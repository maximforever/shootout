
/* dependencies */

const fs = require("fs");                               // file system
const path = require("path");                           // access paths
const express = require("express");                     // express
const MongoClient = require('mongodb').MongoClient;     // talk to mongo
const bodyParser = require('body-parser');              // parse request body
var session = require('express-session');               // create sessions
const MongoStore = require('connect-mongo')(session);   // store sessions in Mongo so we don't get dropped on every server restart

const app = express();
const http = require("http").Server(app);
var io  = require('socket.io')(http);

var userCount = 0;

app.set("port", process.env.PORT || 3000)                       // we're gonna start a server on whatever the environment port is or on 3000
app.use(express.static('public'));                              // sets the correct root directory for static files we're going to serve
app.set("views", path.join(__dirname, "/public"));              // tells us where our views are
app.set("view engine", "ejs");                                  // tells us what view engine to use

app.use(express.static('public'));                              // sets the correct directory for static files we're going to serve - I believe this whole folder is sent to the user

const dbops = require("./server/dbops");
const database = require("./server/database");
const game = require("./server/game");

var thisGame = {
    p1: false,
    p2: false
}




if(process.env.LIVE){                                                                           // this is how I do config, folks. put away your pitforks, we're all learning here.
    dbAddress = "mongodb://" + process.env.MLAB_USERNAME + ":" + process.env.MLAB_PASSWORD + "@ds157639.mlab.com:57639/shootout";
} else {
    dbAddress = "mongodb://localhost:27017/shootout";
}

MongoClient.connect(dbAddress, function(err, client){
    if (err){
        console.log("MAYDAY! MAYDAY! Crashing.");
        return console.log(err);
    } else {

        var db = client.db('shootout');            // this is a Mongo 3.0 thing

        app.use(bodyParser.urlencoded({
            extended: true
        }));

        app.use(bodyParser.json());                         // for parsing application/json

        var thisDb = db;

        var sessionSecret = process.env.SESSION_SECRET || "ejqjxvsh994hw8e7fl4gbnslvt3";

        app.use(session({                                
                secret: sessionSecret,             
                saveUninitialized: false,
                resave: false,
                secure: false,
                expires: null,
                cookie: {
                    maxAge: null
                },/*
                store: new MongoStore({ 
                    db: thisDb,
                    ttl: 60*60*12,                  // in seconds - so, 12 hours total. Ths should hopefully expire and remove sessions for users that haven't logged in
                    autoRemove: 'native'
                })*/
        }));

        app.use(function(req, res, next){                                           // logs request URL
            
            var timeNow = new Date();
            console.log("-----> " + req.method.toUpperCase() + " " + req.url + " on " + timeNow); 

            next();
        });


    /* ROUTES */

        io.on('connection', function(socket){



            // figure out if this is P1, P2, or a spectator




            if(!thisGame.p1){
                thisGame.p1 = true;
                thisGame[socket.id] = "p1"
            } else if(!thisGame.p2){
                thisGame.p2 = true;
                thisGame[socket.id] = "p2"
            }

            var thisPlayer = thisGame[socket.id];
            var otherPlayer = (thisPlayer == "p1") ? "p2" : "p1";



            var thisConnection = setInterval(function(){

                // this is effectively the game loop

                var updatedGame = game.getGame();



                var newData = {
                    game: updatedGame,
                    player: thisPlayer
                }


                // get the sound from the queue

               // console.log(newData.game[thisPlayer]);

                var sound = newData.game[thisPlayer].queuedUpSounds.shift()

                socket.emit("updated game", newData, sound)

                game.healPlayer(thisPlayer);
                game.makeMoney(thisPlayer);
                game.moveBullets(thisPlayer);
                

                if (updatedGame[otherPlayer] && updatedGame[otherPlayer].hp <= 0){
                    console.log("GAME OVER!");
                    updatedGame.status = "gameover";
                    updatedGame.winner = thisPlayer;
                    io.emit("gameover", thisPlayer)
                }


            }, 20)


            console.log("a user connected");
            userCount++;
            console.log("User count is now: " + userCount);

            socket.on("disconnect", function(){

                // stop sending updates
                clearInterval(thisConnection);

                // remove player info from game file

                thisGame[thisPlayer] = false;
                delete thisPlayer;  

                console.log("post leave");
                console.log(thisGame);


                console.log("user disconnected");
                userCount--;
                console.log("User count is now: " + userCount);

                if(userCount == 0){
                    console.log("resetting game!");
                    game.newGame();
                }
            });

            socket.on("reset game", function(){
                console.log("resetting game");
                game.newGame();
            })

            socket.on("move player", function(dir){
                game.movePlayer(dir, thisPlayer);
            })

            socket.on("shoot", function(target){
                game.createBullet(target, thisPlayer, io);         // this is messy
            })

            socket.on("buy bullets", function(target){
                game.buy(thisPlayer, "bullets", socket);         // this is messy
            })

            socket.on("buy stun", function(target){
                game.buy(thisPlayer, "stun", socket);         // this is messy
            })

            socket.on("buy invisibility", function(target){
                game.buy(thisPlayer, "invisibility", socket);         // this is messy
            })

            socket.on("activate stun", function(target){
                game.activateStun(thisPlayer); 
            })

            socket.on("activate invisibility", function(target){
                game.activateInvisibility(thisPlayer, io); 
            })
                

        });

        app.get("/", function(req, res){
            dbops.getAllGames(db, function(allGames){
                console.log(allGames);
                res.render("index", {games: allGames}); 
            }); 
        });

        app.get("/game", function(req, res){
            res.render("game"); 
        });

        app.get("/reset", function(req, res){
            game.resetGame(); 
            res.redirect("/");
        })


        app.get("/new-game", function(req, res){

            dbops.createNewGame(db, function(id){
                res.redirect("/");           // later to /:id
            }); 
        });




    /* END ROUTES */


        /* 404 */

        app.use(function(req, res) {
            res.status(404);
            req.session.error = "404 - page not found!";
            res.redirect("/");
        });

        http.listen(app.get("port"), function() {
            console.log("Server started on port " + app.get("port"));
        });
    }
});
