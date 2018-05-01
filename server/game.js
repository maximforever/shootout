var originalGame = {
    status: "in progress",
    background: "#00447C",
    winner: "",
    width: 0,
    height: 0, 
    p1: {
        x: 80,
        y: 60,
        color: "#96A9D9",
        size: 10,
        hp: 100,
        player: 1,
        bullets: 50,
        money: 1000,
        stuns: 0,
        collecting: "health",
        moneyRate: 0.1,
        healthRate: 0.1,
        base: {
            color: "#6B769E",
            width: 40,
            height: 30,
            x: 0,
            y: 0,
            hp: 1000
        },
        stunBulletEndTime: 0,
        stunnedEndTime: 0
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
        stuns: 0,
        collecting: "health",
        moneyRate: 0.1,
        healthRate: 0.1,
        base: {
            color: "#C900C2",
            width: 40,
            height: 30,
            x: 360,             // THIS WILL BE DEPENDENT ON CANVAS SIZE
            y: 270,
            hp: 1000              
        },
        stunBulletEndTime: 0,
        stunnedEndTime: 0
    },
    obstacles: [],
    bullets: []
}

var game;

function newGame(){
    game = JSON.parse(JSON.stringify(originalGame));    // make a deep copy
    generateObstacles(3);
}

function generateObstacles(count){

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

            if(!rectanglesCollide(thisObstace)){
                console.log("generated top obstacle #" + topObstacles + " on try " + topTries);
                game.obstacles.push(thisObstace);
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

            if(!rectanglesCollide(thisObstace)){
                console.log("generated bottom obstacle #" + bottomObstacles + " on try " + bottomTries);
                game.obstacles.push(thisObstace);
                bottomObstacles++;
            } else {
                bottomTries++;
            }
        }
    
}




var game = JSON.parse(JSON.stringify(originalGame));         

function getGame(){
    return game;
}

function movePlayer(dir, player){

    dir = parseInt(dir);
    var otherPlayer = (player == "p2") ? "p1" : "p2";

    var newLocation = {
        x: game[player].x,
        y: game[player].y
    };

    var moveFactor = 3;             // the larger this is, the less the player moves

    if(game[player].stunnedEndTime > Date.now()){ 
        moveFactor = 6 
    }

    // figre out where the player will be
    if(dir == 65){
        newLocation.x -= game[player].size/moveFactor;
    } else if(dir == 68){
        newLocation.x += game[player].size/moveFactor;
    } else if(dir == 83){
        newLocation.y += game[player].size/moveFactor;
    } else if(dir == 87){
        newLocation.y -= game[player].size/moveFactor;
    } else {
        console.log("move error");
    }


    var canGoThere = true;

    // only move players if the new location doesn't collide with the other player
    if(!(distanceBetween(newLocation.x, game[otherPlayer].x, newLocation.y, game[otherPlayer].y) > (game.p1.size + game.p2.size ))){
        canGoThere = false;
        console.log("colliding");
    }

    //can't go onto the opponent's base
    if(otherPlayer && inRectangle(newLocation.x, newLocation.y, game[otherPlayer].base)){
        canGoThere = false;
    }

    // can't go into obstacles

    var collidingWithObstacles = false;

    game.obstacles.forEach(function(obstacle){
        if(inRectangle(newLocation.x, newLocation.y, obstacle)){
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

function healPlayer(player){

    player = game[player];

    if(player && player.collecting == "health" && inRectangle(player.x, player.y, player.base)){

        player.hp += player.healthRate;                     // 0.1 = 2 HP/second

        if(player.hp > 100){  player.hp = 100 }

        if(player.player == 1){ player.base.color = "#5ce0af" }
        if(player.player == 2){ player.base.color = "#f1f7a0" }
   
    } else {
        if(player && player.player == 1){ player.base.color = "#6b739f" }
        if(player && player.player == 2){ player.base.color = "#C900C2" }
    }


}

function makeMoney(player){
    player = game[player];
    if(player && player.collecting == "money"){
        player.money += player.moneyRate; 
    }
}


function createBullet(target, thisPlayer, io){


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
        speed: 3,                       // this should vary with powerups
        damage: 1,                      // this should vary with powerups
        hit: false,
        id: Math.floor(Date.now()*Math.random())
    }

    if(game[thisPlayer].stunBulletEndTime > Date.now()){
        bullet.stun = true;
        bullet.color = "#1AE296";
    }

    var bulletMove = setInterval(function(){

        checkForBulletHits(bullet, io);
        checkForBaseHits(bullet);
        checkForObstacleHits(bullet);

        if(bullet.x < 400 && bullet.x > 0 && bullet.y < 300 && bullet.y > 0 && !bullet.hit){
            bullet.x += bullet.deltaX*bullet.speed;
            bullet.y += bullet.deltaY*bullet.speed;

        } else {
            // stop tracking the bullet's movement
            clearInterval(bulletMove);

            // delete the bullet from the bullets array

            for(var i = 0; i < game.bullets.length; i++){
                if(game.bullets[i].id == bullet.id){
                    game.bullets.splice(i, 1);
                }
            }
        }

    }, 20)


    game.bullets.push(bullet);

}

function checkForBulletHits(bullet, io){

    var otherPlayer = (bullet.player == "p2") ? "p1" : "p2";

    if(distanceBetween(bullet.x, game[otherPlayer].x, bullet.y, game[otherPlayer].y) < game[otherPlayer].size){

        bullet.hit = true;

        console.log(otherPlayer + " hit!");
        game[otherPlayer].hp -= bullet.damage;

        if(bullet.stun){
            game[otherPlayer].stunnedEndTime = (Date.now() + 1000 * 10);    // 10 seconds of stun
        }

        if (game[otherPlayer].hp <= 0){
            game.status = "gameover";
            game.winner = bullet.player;
            io.emit("gameover", bullet.player)
        }

    }
}

function checkForBaseHits(bullet){

    var player = bullet.player;
    var otherPlayer = (bullet.player == "p2") ? "p1" : "p2";

    // no need to check whose bullet hits the base, because it's only checking the base of the player that fired the bullet

    // if a bullet hits the base...
    if(inRectangle(bullet.x, bullet.y, game[bullet.player].base)){

        bullet.hit = true;

        var newMode = (game[player].collecting == "health") ? "money" : "health";
        game[player].collecting = newMode;

        console.log("Now collecting " + newMode);
    } else if(inRectangle(bullet.x, bullet.y, game[otherPlayer].base)){
        game[otherPlayer].base.hp -= bullet.damage;
        bullet.hit = true;
    }

}

function checkForObstacleHits(bullet){
    game.obstacles.forEach(function(obstacle){
        if(inRectangle(bullet.x, bullet.y, obstacle)){ bullet.hit = true; }
    });
}

// BUY FUNCTIONS


function buy(player, item, socket){
    console.log("buying " + item);
    player = game[player];
        
    var thisItem = {};


    if(item == "bullets"){
        thisItem = {
            cost: 75,
            amount: 50
        }
    } else if(item == "stuns"){
        thisItem = {
            cost: 100,
            amount: 1
        }
    }



    if(player.money >= thisItem.cost){

        socket.emit("successful purchase")

        player.money -= 100;
        player[item] += thisItem.amount;

    } else {
        console.log("not enough money");
    }

}


// POWERUP FUNCTUINS


function activateStun(player){

    if(game[player].stuns > 0){
        game[player].stuns--;
        game[player].stunBulletEndTime = (Date.now() + 1000 * 10);         // 10 secs of stun
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

function rectanglesCollide(rectangle){

    var colliding = false;

    if(game.obstacles.length > 0){

        // check every point of the rectangle for collision
        game.obstacles.forEach(function(obstacle){
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





module.exports.getGame = getGame;
module.exports.movePlayer = movePlayer;
module.exports.newGame = newGame;
module.exports.createBullet = createBullet;
module.exports.healPlayer = healPlayer;
module.exports.makeMoney = makeMoney;
module.exports.buy = buy;

module.exports.activateStun = activateStun;