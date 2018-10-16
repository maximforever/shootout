// game operations go here

var originalGame = {
    id: null,
    status: "setup",
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
        hp: 10,
        player: 1,
        bullets: 50,
        money: 50,
        stun: 0,
        invisibility: 0,
        collecting: "health",
        moneyRate: 0.1,
        healthRate: 0.1,
        base: {
            color: "#6B769E",
            width: 40,
            height: 30,
            healthLeft: 100,
            x: 0,
            y: 0
        },
        moving: null,
        stunBulletEndTime: 0,
        stunnedEndTime: 0,
        invisibilityEndTime: 0,
        queuedUpSounds: [],
        rotationAngle: 90,
        ready: false
    },
    p2: {
        x: 300,
        y: 250,
        color: "#F26DF9", 
        size: 10, 
        hp: 10,
        player: 2,
        bullets: 50,
        money: 50,
        stun: 0,
        invisibility: 0,
        collecting: "health",
        moneyRate: 0.1,
        healthRate: 0.1,
        base: {
            color: "#C900C2",
            width: 40,
            height: 30,
            healthLeft: 100,
            x: 360,             
            y: 270          
        },
        moving: null,
        stunBulletEndTime: 0,
        stunnedEndTime: 0,
        invisibilityEndTime: 0,
        queuedUpSounds: [],
        rotationAngle: 90,
        ready: false
    },
    obstacles: [],
    bullets: []
}

var game;

var itemStore = {
    invisibility: {
        cost: 200,
        amount: 1,
        useSound: "useInvisibility",
    },
    stun: {
        cost: 100,
        amount: 1,
        useSound: "useStun",
    },
    bullets: {
        cost: 75,
        amount: 50,
        useSound: "useBullet",
    },
}



function createNewGame(callback){
    var game = JSON.parse(JSON.stringify(originalGame));    // make a deep copy
    game = generateObstacles(game, 3);
    game.id = Date.now();
    console.log("Created a new game with the ID: " + game.id);
    callback(game);
}

function generateObstacles(thisGame, count){

        /*
            1. pick a random coordinate within our bounds
            2. generate a rectangle of random height and width
            3. ensure it doesn't overlap with existing rectangles
            3. add to game
        */

        // bottom left

        var topTries = 0;
        var bottomTries = 0;
        var topObstacles = 0;
        var bottomObstacles = 0;

        while(topObstacles < count && topTries < 100){  
            var thisObstace = {
                x: randBetween(0 , 150),            // 50 less than width/height so triangles show up
                y: randBetween(150, 250),
                width: randBetween(20, 50),
                height: randBetween(20, 50)
            };

            if(!rectanglesCollide(thisGame, thisObstace)){
                console.log("generated top obstacle #" + topObstacles + " on try " + topTries);
                thisGame.obstacles.push(thisObstace);
                topObstacles++;
            } else {
                topTries++;
            }
        }

        while(bottomObstacles < count && bottomTries < 100){  

            var thisObstace = {
                x: randBetween(200, 350),            // 50 less than width/height so triangles show up
                y: randBetween(0, 150),
                width: randBetween(20, 100),
                height: randBetween(20, 100)
            };

            if(!rectanglesCollide(thisGame, thisObstace)){
                console.log("generated bottom obstacle #" + bottomObstacles + " on try " + bottomTries);
                thisGame.obstacles.push(thisObstace);
                bottomObstacles++;
            } else {
                bottomTries++;
            }
        }


        return thisGame;
    
}

// !!!
//var game = JSON.parse(JSON.stringify(originalGame));         

function setGame(thisGame){

    game = thisGame;

}


function setMoveDirection(game, player, dir, angle){

    //console.log("SETTING DIRECTION FOR " + player); 

    var otherPlayer = (player == "p2") ? "p1" : "p2";

    game[player].rotationAngle = angle;
    game[player].moving = dir;

}



function movePlayer(game, player){

    var otherPlayer = (player == "p2") ? "p1" : "p2";

    var newLocation = {
        x: game[player].x,
        y: game[player].y
    };

    var moveFactor = 2.5;             // the larger this is, the less the player moves

    if(game[player].stunnedEndTime > Date.now()){ 


        var timeLeft = (game[player].stunnedEndTime - Date.now())/1000;

        moveFactor *= 1.5;                                                    // double the move factor - slow down by 2       
    }

    // figure out where the player will be
    if(game[player].moving == "Left"){
        newLocation.x -= game[player].size/moveFactor;
    } else if(game[player].moving == "Right"){
        newLocation.x += game[player].size/moveFactor;
    } else if(game[player].moving == "Down"){
        newLocation.y += game[player].size/moveFactor;
    } else if(game[player].moving == "Up"){
        newLocation.y -= game[player].size/moveFactor;
    } else if(game[player].moving == "UpLeft"){
        newLocation.x -= game[player].size/moveFactor/Math.sqrt(2);      // we divide by Math.sqrt(2) so that diagonal moves still only move by 1 unit (not faster than Up/Right/Down/Left)
        newLocation.y -= game[player].size/moveFactor/Math.sqrt(2);
    } else if(game[player].moving == "UpRight"){
        newLocation.x += game[player].size/moveFactor/Math.sqrt(2);
        newLocation.y -= game[player].size/moveFactor/Math.sqrt(2);
    } else if(game[player].moving == "DownLeft"){
        newLocation.y += game[player].size/moveFactor/Math.sqrt(2);
        newLocation.x -= game[player].size/moveFactor/Math.sqrt(2);
    } else if(game[player].moving == "DownRight"){
        newLocation.y += game[player].size/moveFactor/Math.sqrt(2);
        newLocation.x += game[player].size/moveFactor/Math.sqrt(2);
    } 

    var canGoThere = true;

    // only move players if the new location doesn't collide with the other player
    if(!(distanceBetween(newLocation.x, game[otherPlayer].x, newLocation.y, game[otherPlayer].y) > (game.p1.size + game.p2.size ))){
        canGoThere = false;
        console.log("colliding");
    }

    //can't go onto the opponent's base
    if(otherPlayer && playerIsInObstacle(newLocation.x, newLocation.y, game[player].size, game[otherPlayer].base)){
        canGoThere = false;
    }

    // can't go into obstacles

    var collidingWithObstacles = false;

    game.obstacles.forEach(function(obstacle){
        if(playerIsInObstacle(newLocation.x, newLocation.y, game[player].size, obstacle)){
            canGoThere = false;
        }
    });

    if(canGoThere){ 
        game[player].x = newLocation.x;
        game[player].y = newLocation.y;
    }

    // don't let the player go off the map
    if(game[player].y < game[player].size){  game[player].y = game[player].size  }
    if(game[player].y > (300 - game[player].size)){  game[player].y = (300 - game[player].size) }
    if(game[player].x < game[player].size){  game[player].x = game[player].size }
    if(game[player].x > (400 - game[player].size)){  game[player].x = (400 - game[player].size) }


}

function healPlayer(game, player){
    if(game.status == "in progress"){
        thisPlayer = game[player];

        if(thisPlayer /*&& thisPlayer.collecting == "health" */&& inRectangle(thisPlayer.x, thisPlayer.y, thisPlayer.base)){

            thisPlayer.hp += thisPlayer.healthRate;                     // 0.1 = 2 HP/second

            if(thisPlayer.hp > 100){  thisPlayer.hp = 100 }

            if(thisPlayer.player == 1){ thisPlayer.base.color = "#5ce0af" }
            if(thisPlayer.player == 2){ thisPlayer.base.color = "#f1f7a0" }


            // switch base to heal

            thisPlayer.collecting = "health"


       
        } else {
            if(thisPlayer && thisPlayer.player == 1){ thisPlayer.base.color = "#6b739f" }
            if(thisPlayer && thisPlayer.player == 2){ thisPlayer.base.color = "#C900C2" }

            // if off base, switch base to make money

            thisPlayer.collecting = "money"
        }
    }
}

function makeMoney(game, player){
    if(game.status == "in progress"){
        player = game[player];
        if(player && player.collecting == "money"){
            player.money += player.moneyRate; 
        }
    }
}


function createBullet(game, target, thisPlayer, io){


    if(game[thisPlayer] && game[thisPlayer].bullets == 0){
        return
    }

    game[thisPlayer].bullets--;


    var diffX = target.x - game[thisPlayer].x;
    var diffY = target.y - game[thisPlayer].y;

    var hypotenuse = Math.sqrt(Math.pow(diffX,2) + Math.pow(diffY,2));

    var dx = diffX/hypotenuse;
    var dy = diffY/hypotenuse;

    var startingX = game[thisPlayer].x + 20*dx;
    var startingY = game[thisPlayer].y + 20*dy;


    var bullet = {
        x: startingX,
        y: startingY,
        deltaX: dx,
        deltaY: dy,
        color: "#ED0014",
        player: thisPlayer,
        stun: false,
        speed: 2,                       // this should vary with powerups
        damage: 3,                      // this should vary with powerups
        expired: false,
        id: Math.floor(Date.now()*Math.random())
    }

    if(game[thisPlayer].stunBulletEndTime > Date.now()){
        bullet.stun = true;
        bullet.color = "#1AE296";
    }

    game.bullets.push(bullet);

}

function moveBullets(game, io){

    for(var i = 0; i < game.bullets.length; i++){

        var bullet = game.bullets[i];

        if(!bullet.expired){


            checkForBulletHits(game, bullet, io);
            checkForObstacleHits(game, bullet);

            if(bullet.x < 400 && bullet.x > 0 && bullet.y < 300 && bullet.y > 0 && !bullet.expired){
                bullet.x += bullet.deltaX*bullet.speed;
                bullet.y += bullet.deltaY*bullet.speed;

            } else {
                // stop tracking the bullet's movement
                bullet.expired = true;

                // delete the bullet from the bullets array - cycle again in case multiple bullets hit at the same time?
                // cycling again really shouldn't be necessary

                // (version 1)

                for(var i = 0; i < game.bullets.length; i++){
                    if(game.bullets[i].id == bullet.id){
                        game.bullets.splice(i, 1);
                    }
                }

                // (version 2)

                // game.bullets.splice(i, 1);


            }
        }

    }
}

function checkForBulletHits(game, bullet, io){

    var otherPlayer = (bullet.player == "p2") ? "p1" : "p2";

    if(distanceBetween(bullet.x, game[otherPlayer].x, bullet.y, game[otherPlayer].y) < game[otherPlayer].size){

        bullet.expired = true;

        console.log(otherPlayer + " hit!");
        game[otherPlayer].hp -= bullet.damage;

        if(bullet.stun){
            game[bullet.player].queuedUpSounds.push("applyStun");
            game[otherPlayer].stunnedEndTime = (Date.now() + 1000 * 10);    // 10 seconds of stun
            game.spectators.queuedUpSounds.push("applyStun");
        }

    }
}

function checkForObstacleHits(game, bullet){

    game.obstacles.forEach(function(obstacle){
        if(inRectangle(bullet.x, bullet.y, obstacle)){ bullet.expired = true; }
    });


    // if we hit the base, switch from healing to money

/*
    if(bullet.player == "p1" && inRectangle(bullet.x, bullet.y, game.p1.base)){
        console.log(game.p1.collecting);
        game.p1.collecting = (game.p1.collecting == "money") ? "health" : "money";
        bullet.expired = true;
    }

    if(bullet.player == "p2" && inRectangle(bullet.x, bullet.y, game.p2.base)){
        console.log(game.p2.collecting);
        game.p2.collecting = (game.p2.collecting == "money") ? "health" : "money";
        bullet.expired = true;
    }


*/

}

// BUY FUNCTIONS


function buy(game, player, socket, item){
    console.log("buying " + item);
    player = game[player];
    var thisItem = itemStore[item];            // itemStore holds objects that describe the items & prices

    console.log(thisItem);

    if(player.money >= thisItem.cost){

        player.money -= thisItem.cost;
        player[item] += thisItem.amount;

        console.log(player);

        player.queuedUpSounds.push("purchase");
        game.spectators.queuedUpSounds.push("purchase");

        socket.emit(item + " bought");


    } else {
        console.log("not enough money");
        player.queuedUpSounds.push("buzz");
    }

}


// POWERUP FUNCTUINS


function activateStun(game, player){

    if(game[player].stun > 0 && game[player].stunBulletEndTime <= Date.now()){           // if player not currently stunning
        game[player].stun--;
        game[player].stunBulletEndTime = (Date.now() + 1000 * 10);         // 10 secs of stun
        game[player].queuedUpSounds.push("useStun")
        game.spectators.queuedUpSounds.push("useStun");
    }
}

function activateInvisibility(game, player, io){

    console.log(Date.now());
    console.log(game[player].invisibilityEndTime);

    if(game[player].invisibility > 0 && game[player].invisibilityEndTime <= Date.now()){ // if player not currently invisible
        game[player].invisibility--;
        game[player].invisibilityEndTime = (Date.now() + 1000 * 10);         // 10 secs of invisibility
    
        game[player].queuedUpSounds.push("useInvisibility")
        game.spectators.queuedUpSounds.push("useInvisibility");
    }
}



// SUPORTING FUNCTIONS

function distanceBetween(x1, x2, y1, y2){
    return Math.sqrt(Math.pow((x1-x2),2) + Math.pow((y1-y2),2));
}

function inRectangle(x, y, rect){

    var colliding = false;

        if(x > rect.x && x < (rect.x + rect.width) && y > rect.y && y < (rect.y + rect.height)){
            colliding = true;
        }

    return colliding;
}


function playerIsInObstacle(locationX, locationY, playerSize, obstacle){

    var colliding = true;

    if((locationY + playerSize) < obstacle.y)                       { colliding = false }
    if((locationY - playerSize) > (obstacle.y + obstacle.height))   { colliding = false }
    if((locationX + playerSize) < obstacle.x)                       { colliding = false }
    if((locationX - playerSize) > (obstacle.x + obstacle.width))    { colliding = false }

    return colliding;

}




function rectanglesCollide(thisGame, rectangle){

    var colliding = false;

    if(thisGame.obstacles.length > 0){

        // check every point of the rectangle for collision
        thisGame.obstacles.forEach(function(obstacle){
            if(inRectangle(rectangle.x, rectangle.y, obstacle)){ colliding = true; }
            if(inRectangle(rectangle.x + rectangle.width, rectangle.y, obstacle)){ colliding = true; }
            if(inRectangle(rectangle.x, rectangle.y + rectangle.height , obstacle)){ colliding = true; }
            if(inRectangle(rectangle.x + rectangle.width, rectangle.y + rectangle.height, obstacle)){ colliding = true; }
        });
    }

    return colliding;
}



function randBetween(min, max){
    return Math.floor(Math.random() * (max - min) + min);
}

module.exports.createNewGame = createNewGame;
module.exports.setMoveDirection = setMoveDirection;
module.exports.movePlayer = movePlayer;
module.exports.createBullet = createBullet;
module.exports.moveBullets = moveBullets;
module.exports.healPlayer = healPlayer;
module.exports.makeMoney = makeMoney;
module.exports.buy = buy;

module.exports.generateObstacles = generateObstacles;

module.exports.activateStun = activateStun;
module.exports.activateInvisibility = activateInvisibility;
