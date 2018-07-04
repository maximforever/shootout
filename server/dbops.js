// database operations go here
const game = require("../server/game");
const database = require("../server/database");

var gameTemplate = {
    id: 0,
    status: "in progress",
    background: "#00447C",
    winner: "",
    participants: {
        p1: null,
        p2: null,
        spectators: []
    },
    spectators: {
        queuedUpSounds: []
    },
    p1: {
        x: 80,
        y: 60,
        color: "#96A9D9",
        size: 10,
        hp: 100,
        player: 1,
        bullets: 50,
        money: 1000,
        stun: 0,
        invisibility: 0,
        collecting: "health",
        moneyRate: 0.1,
        healthRate: 0.1,
        base: {
            color: "#6B769E",
            width: 40,
            height: 30,
            x: 0,
            y: 0
        },
        stunBulletEndTime: 0,
        stunnedEndTime: 0,
        invisibilityEndTime: 0,
        queuedUpSounds: []
    },
    p2: {
        x: 300,
        y: 250,
        color: "#F26DF9", 
        size: 10, 
        hp: 100,
        player: 2,
        bullets: 50,
        money: 1000,
        stun: 0,
        invisibility: 0,
        collecting: "health",
        moneyRate: 0.1,
        healthRate: 0.1,
        base: {
            color: "#C900C2",
            width: 40,
            height: 30,
            x: 360,             
            y: 270          
        },
        stunBulletEndTime: 0,
        stunnedEndTime: 0,
        invisibilityEndTime: 0,
        queuedUpSounds: []
    },
    obstacles: [],
    bullets: []
}





function getAllGames(db, callback){

    // get all games from DB here

    var gameQuery = {
        status: "in progress"
    }

    database.read(db, "games", gameQuery, function getOngoingGames(games){
        console.log("fetched " +  games.length + " games");
        callback(games);
    })

    //callback({})
    
}

function createNewGame(db, callback){

    var newGame = JSON.parse(JSON.stringify(gameTemplate));
    newGame.id = Date.now()
    newGame = game.generateObstacles(newGame, 3);

    console.log("game with obstacles");
    console.log(newGame);
    

    database.create(db, "games", newGame, function createGame(game){
        callback(game.id)
    })
}


module.exports.getAllGames = getAllGames;
module.exports.createNewGame = createNewGame;