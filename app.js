
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
app.set("views", path.join(__dirname, "/public"));        // tells us where our views are
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

MongoClient.connect(dbAddress, function(err, db){
    if (err){
        console.log("MAYDAY! MAYDAY! Crashing.");
        return console.log(err);
    } else {

    }

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

        if(!thisGame.p1){
            thisGame.p1 = true;
            thisGame[socket.id] = "p1"
        } else if(!thisGame.p2){
            thisGame.p2 = true;
            thisGame[socket.id] = "p2"
        }



        var thisConnection = setInterval(function(){

            // this is effectively the game loop

            var updatedGame = game.getGame();


            var newData = {
                game: updatedGame,
                player: thisGame[socket.id]
            }

            socket.emit("updated game", newData)

            game.healPlayer(thisGame[socket.id]);
            game.makeMoney(thisGame[socket.id]);


        }, 20)


        console.log("a user connected");
        userCount++;
        console.log("User count is now: " + userCount);

        socket.on("disconnect", function(){

            clearInterval(thisConnection);

            thisGame[thisGame[socket.id]] = false;
            delete thisGame[socket.id];  

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
            game.movePlayer(dir, thisGame[socket.id]);
        })

        socket.on("shoot", function(target){
            game.createBullet(target, thisGame[socket.id], io);         // this is messy
        })

        socket.on("buy bullets", function(target){
            game.buy(thisGame[socket.id], "bullets", socket);         // this is messy
        })

        socket.on("buy stuns", function(target){
            game.buy(thisGame[socket.id], "stuns", socket);         // this is messy
        })

        socket.on("buy invisibility", function(target){
            game.buy(thisGame[socket.id], "invisibility", socket);         // this is messy
        })

        socket.on("activate stun", function(target){
            game.activateStun(thisGame[socket.id]); 
        })

        socket.on("activate invisibility", function(target){
            game.activateInvisibility(thisGame[socket.id], io); 
        })
            

    });

    app.get("/", function(req, res){
        res.render("index"); 
    })





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
});
