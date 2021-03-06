
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

app.set("port", process.env.PORT || 3000)                       // we're gonna start a server on whatever the environment port is or on 3000
app.use(express.static('public'));                              // sets the correct root directory for static files we're going to serve
app.set("views", path.join(__dirname, "/public"));              // tells us where our views are
app.set("view engine", "ejs");                                  // tells us what view engine to use

app.use(express.static('public'));                              // sets the correct directory for static files we're going to serve - I believe this whole folder is sent to the user

const gameops = require("./server/gameops");


// games currently stored on the server - later, consider moving this to DB
var currentGames = {}

// game currently being played:

var thisGame = null; // this may be a huge problem later




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

        app.get("/", function(req, res){
            //console.log(currentGames);
            res.render("index"); 
        });

        app.get("/clear", function(req, res){
            currentGames = {};
            res.redirect("/");
        })


        app.get("/new-game", function(req, res){

            gameops.createNewGame(function(game){
                currentGames[game.id] = game;
                res.redirect("/");           // later to /:id
            }); 
        });

        app.get("/game/:id/:player", function(req, res){

            console.log("Trying to enter game " + req.params.id + " as player " + req.params.player);   

            if(currentGames[req.params.id] != null && typeof(currentGames[req.params.id] != "undefined")){

                // create game
                thisGame = currentGames[req.params.id];

                // when a player connects, based on params whether this can be added as a P1, or a P2

                var incomingPlayer, otherPlayer;

                // figure out if this is P1, P2, or a spectator

                if(req.params.player == "player"){
                    

                    // incoming player is 1 if empty, 2 if empty, or spectator

                    if(thisGame.participants.p1 == null || thisGame.participants.p1.length == 0){
                        incomingPlayer = "p1";
                    } else if(thisGame.participants.p2 == null || thisGame.participants.p1.length == 0){
                        incomingPlayer = "p2";
                    } else {
                        incomingPlayer = "spectator"
                    }

                } else {
                    incomingPlayer = "spectator";
                }


                // why?
                thisGame.incomingPlayer = incomingPlayer;

                res.render("game");
        
            } else {
                console.log("that's not a real game");
                res.redirect("/")
            }

        });

/*        app.get("/all-games", function(req,res){
            res.send(currentGames);
        });
*/

        /* SOCKET IO */

        io.on('connection', function(socket){   


            // when a player connects, based on params whether this can be added as a P1, or a P2

            var thisPlayer, otherPlayer;

            socket.on("get all games", function(){
                console.log("getting all games");
                io.emit("updated game list", currentGames);
            })




            if(thisGame != null){

                /* this happens once on connection */

                console.log("A USER CONNECTED: " + socket.id);
                console.log("incomingPlayer: " + thisGame.incomingPlayer);
                
                if(thisGame.incomingPlayer == "p1"  || thisGame.incomingPlayer == "p2"){  

                    // if that player socket ID isn't taken, set it                  
                    if(thisGame.participants[thisGame.incomingPlayer] == null){
                        console.log("Setting player " + thisGame.incomingPlayer + " id as: " + socket.id);
                        thisGame.participants[thisGame.incomingPlayer] = socket.id;
                    }
                } else {
                    // if it IS a spectator, push to the spectators array:
                    thisGame.participants.spectators.push(socket.id);
                }  

                if(thisGame.incomingPlayer != "p1" && thisGame.incomingPlayer != "p2"){ 
                    thisGame.incomingPlayer = "spectators";
                }

                thisPlayer = thisGame.incomingPlayer;

                console.log(`this player: ${thisPlayer}`);

                otherPlayer = (thisPlayer == "p1") ? "p2" : "p1";

                thisGame.incomingPlayer = null;          // reset incoming player for the next player

                // send first update
                var newData = {
                    game: thisGame,
                    player: thisPlayer
                }

                socket.emit("updated game", newData, []) ;                    


                /* this is the game loop, runs only if both players are connected*/

                var thisConnection = setInterval(function(){

                    // this is effectively the game loop
                    // only run it if both players are connected

                    if(thisGame != null && thisGame.participants.p1 != null && thisGame.participants.p2 != null){

                        var updatedGame = thisGame;             // these should both reference the same object, I think

                        var newData = {
                            game: updatedGame,
                            player: thisPlayer
                        }


                        // get the sound from the queue

                        var sound = newData.game[thisPlayer].queuedUpSounds.shift()

                        gameops.movePlayer(thisGame, thisPlayer);
                        gameops.healPlayer(thisGame, thisPlayer);
                        gameops.makeMoney(thisGame, thisPlayer);
                        gameops.moveBullets(thisGame, thisPlayer);

                        // send the new data to just this socket
                        socket.emit("updated game", newData, sound);


                        if(thisGame[thisPlayer].hp <= 0 && thisGame.status != "gameover"){
                            
                            console.log("THE GAME IS OVER!");
                            console.log(`${thisPlayer} has been killed. ${otherPlayer} has won`);

                            updatedGame.status = "gameover";

                            if(updatedGame.winner == ""){
                                updatedGame.winner = otherPlayer;        
                            }
                            
                            console.log("GAME OVER!");

                            io.emit("gameover", otherPlayer);
                        }
                    }
                }, 20)

                socket.on("disconnect", function(){

                    console.log("A USER DISCONNECTED: " + socket.id);

                    // stop sending updates
                    

                    // remove player info from game file
                    if(thisPlayer == "p1" || thisPlayer == "p2"){
                        console.log("the id for thisPlayer, " + thisPlayer + ", is " + thisGame.participants[thisPlayer]);
                        thisGame.participants[thisPlayer] = null;
                        console.log(thisGame.participants);
                    }
                    
                    console.log("post-disconnect:");
                    console.log(thisGame.participants);

                    // if everyone leaves, delete the game
/*                    if(thisGame.participants.p1 == null && thisGame.participants.p2 == null && thisGame.participants.spectators.length == 0){
                        console.log("deleting game!");
                        delete currentGames[thisGame.id];
                    }*/

                    // send first update
                    var newData = {
                        game: thisGame,
                        player: thisPlayer
                    }

                    socket.emit("updated game", newData, [])  


                    clearInterval(thisConnection);
                });

                socket.on("move player", function(dir, angle){
                    if(thisGame.status == "in progress"){
                        gameops.setMoveDirection(thisGame, thisPlayer, dir, angle);
                    }
                });

                socket.on("shoot", function(target){
                    if(thisGame.status == "in progress"){
                        gameops.createBullet(thisGame, target, thisPlayer, io);         // this is messy
                    }
                });

                socket.on("buy bullets", function(target){
                    if(thisGame.status == "in progress"){
                        gameops.buy(thisGame, thisPlayer, socket, "bullets");         // this is messy
                    }
                });

                socket.on("buy stun", function(target){
                    if(thisGame.status == "in progress"){
                        gameops.buy(thisGame, thisPlayer, socket, "stun");         // this is messy
                    }
                });

                socket.on("buy invisibility", function(target){
                    if(thisGame.status == "in progress"){
                        gameops.buy(thisGame, thisPlayer, socket, "invisibility");         // this is messy
                    }
                });

                socket.on("activate stun", function(target){
                    if(thisGame.status == "in progress"){
                        gameops.activateStun(thisGame, thisPlayer); 
                    }
                });

                socket.on("activate invisibility", function(target){
                    if(thisGame.status == "in progress"){
                        gameops.activateInvisibility(thisGame, thisPlayer, io); 
                    }
                });

                socket.on("ready up", function(){

                    thisGame[thisPlayer].ready = true;

                    // if both players are in and ready, start the game
                    if(thisGame.p1.ready && thisGame.p2.ready){
                        console.log("starting the game");


                        thisGame.status = "on deck";
                        io.emit("on deck");

                        setTimeout(function(){

                            var track = (Math.random() < 0.5) ? 1 : 2;

                            thisGame.status = "in progress";
                            io.emit("start game", track);
                        }, 3000 )
                        
                    }

                });
            } else {
                console.log("There is no game");

                var countOfGames = 0;

                var thisConnection = setInterval(function(){

                     var gameNumberHasChanged = ( countOfGames == currentGames.length);

                    if(gameNumberHasChanged){
                        countOfGames = currentGames.length;
                        io.emit("updated game list", currentGames);
                    }
                    
                }, 20);
            }

        });


        

    /* END ROUTES */


        /* 404 */

        app.use(function(req, res) {
            res.status(404);
            res.redirect("/");
        });

        http.listen(app.get("port"), function() {
            console.log("Server started on port " + app.get("port"));
        });
    }
});
