var originalGame = {
    status: "in progress",
    background: "#00447C",
    winner: "",
    width: 0,
    height: 0, 
    p1: {
        x: 50,
        y: 50,
        color: "#96A9D9",
        size: 10,
        hp: 100,
        player: 1,
        bullets: 50,
        base: {
            color: "#6B769E",
            width: 40,
            height: 30,
            x: 0,
            y: 0
        }
    },
    p2: {
        x: 300,
        y: 250,
        color: "#F26DF9", 
        size: 10, 
        hp: 100,
        player: 2,
        bullets: 50,
        base: {
            color: "#C900C2",
            width: 40,
            height: 30,
            x: 360,             // THIS WILL BE DEPENDENT ON CANVAS SIZE
            y: 270              
        }
    },
    bullets: []
}

var game = JSON.parse(JSON.stringify(originalGame));         // make a deep copy

function resetGame(){
    game = JSON.parse(JSON.stringify(originalGame));
}

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

    // figre out where the player will be
    if(dir == 65){
        newLocation.x -= game[player].size/3;
    } else if(dir == 68){
        newLocation.x += game[player].size/3;
    } else if(dir == 83){
        newLocation.y += game[player].size/3;
    } else if(dir == 87){
        newLocation.y -= game[player].size/3;
    } else {
        console.log("move error");
    }

    // only move players if the new location doesn't collide with the other player
    if(distanceBetween(newLocation.x, game[otherPlayer].x, newLocation.y, game[otherPlayer].y) > (game.p1.size + game.p2.size )){
        game[player].x = newLocation.x;
        game[player].y = newLocation.y;
    } else {
        console.log("colliding");
    }

    // don't let the player go off the map
    if(game[player].y < game[player].size){  game[player].y = game[player].size  }
    if(game[player].y > (300 - game[player].size)){  game[player].y = (300 - game[player].size) }
    if(game[player].x < game[player].size){  game[player].x = game[player].size }
    if(game[player].x > (400 - game[player].size)){  game[player].x = (400 - game[player].size) }

}

function healPlayer(player){

    player = game[player];

    if(player.x > player.base.x && player.x < (player.base.x + player.base.width) && player.y > player.base.y && player.y < (player.base.y + player.base.height)){

        player.hp += 0.1           // 2 HP/second
        if(player.hp > 100){  player.hp = 100 }

        //console.log(player.hp);

        if(player.player == 1){ player.base.color = "#5ce0af" }
        if(player.player == 2){ player.base.color = "#f1f7a0" }
   
    } else {
        if(player.player == 1){ player.base.color = "#6b739f" }
        if(player.player == 2){ player.base.color = "#C900C2" }
    }


}

function createBullet(target, thisPlayer, io){


    if(game[thisPlayer].bullets == 0){
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
        player: thisPlayer,
        speed: 3,                       // this should vary with powerups
        damage: 5,                      // this should vary with powerups
        hit: false,
        id: Math.floor(Date.now()*Math.random())
    }

    var bulletMove = setInterval(function(){

        checkForBulletHits(bullet, io);

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

        if (game[otherPlayer].hp <= 0){
            game.status = "gameover";
            game.winner = bullet.player;
            io.emit("gameover", bullet.player)
        }

    }
}




// supporting functions

function distanceBetween(x1, x2, y1, y2){
    return Math.sqrt(Math.pow((x1-x2),2) + Math.pow((y1-y2),2));
}





module.exports.getGame = getGame;
module.exports.movePlayer = movePlayer;
module.exports.resetGame = resetGame;
module.exports.createBullet = createBullet;
module.exports.healPlayer = healPlayer;