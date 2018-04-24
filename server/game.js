var originalGame = {
    status: "in progress",
    background: "#00447C",
    winner: "",
    p1: {
        x: 100,
        y: 100,
        color: "#96A9D9",
        size: 10,
        hp: 100
    },
    p2: {
        x: 50,
        y: 50,
        color: "#F26DF9", 
        size: 10, 
        hp: 100
    },
    bullets: []
}

var game = JSON.parse(JSON.stringify(originalGame));         // make a deep copy

function resetGame(callback){
    game = JSON.parse(JSON.stringify(originalGame));
    console.log("the game is now:");
    console.log(game);

    callback(game);
}

function getGame(){
    return game;
}

function movePlayer(dir, player, otherPlayer){

    dir = parseInt(dir);
    var otherPlayer = "p2";
    var newLocation = {
        x: game[player].x,
        y: game[player].y
    };

    if(player == "p2"){ otherPlayer = "p1" }

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

    if(game[player].y < game[player].size){  game[player].y = game[player].size  }
    if(game[player].y > (300 - game[player].size)){  game[player].y = (300 - game[player].size) }
    if(game[player].x < game[player].size){  game[player].x = game[player].size }
    if(game[player].x > (400 - game[player].size)){  game[player].x = (400 - game[player].size) }

}

function createBullet(target, thisPlayer, io, socket){


    var diffX = target.x - game[thisPlayer].x;
    var diffY = target.y - game[thisPlayer].y;

    var hypotenuse = Math.sqrt(Math.pow(diffX,2) + Math.pow(diffY,2));

    var dx = diffX/hypotenuse;
    var dy = diffY/hypotenuse;


    var bullet = {
        x: game[thisPlayer].x,
        y: game[thisPlayer].y,
        deltaX: dx,
        deltaY: dy,
        player: thisPlayer,
        speed: 3,                       // this should vary with powerups
        damage: 20,                      // this should vary with powerups
        hit: false,
        id: Math.floor(Date.now()*Math.random())
    }

    var bulletMove = setInterval(function(){


        if(bullet.x < 400 && bullet.x > 0 && bullet.y < 300 && bullet.y > 0 && !bullet.hit){
            bullet.x += bullet.deltaX*bullet.speed;
            bullet.y += bullet.deltaY*bullet.speed;

            var updatedGame = getGame();

            var newData = {
                game: updatedGame,
                player: updatedGame[socket.id]
            }

            checkForBulletHits(bullet, io);

            io.emit("updated game", newData);


        } else {
            // stop it from moving
            clearInterval(bulletMove);

            // actually delete it

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

    var otherPlayer = "p2";
    if(bullet.player == "p2"){ otherPlayer = "p1" }

    console.log("player:  " + bullet.player + " - other player: " + otherPlayer); 


    console.log(distanceBetween(bullet.x, game[otherPlayer].x, bullet.y, game[otherPlayer].y));

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