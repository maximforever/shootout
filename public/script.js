/* SOCKET.IO */
var socket = io();

/* GLOBAL VARS */
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext('2d');

var animationSpeed = 20;

var WIDTH = canvas.width;
var HEIGHT = canvas.height;

var lastX = lastY = 0;

var thisPlayer = null;

var keypressLeft = false;
var keypressDown = false;
var keypressRight = false;
var keypressUp = false

var currentGame = {
    background: "white"
}


// load up images for canvas 
var healthImage = new Image();
healthImage.src = "assets/icons/health.png";

var moneyImage = new Image();
moneyImage.src = "assets/icons/money.png";

var mountains = new Image();
mountains.src = "assets/patterns/mountains2.png";




/* audio */

var zapMP3 = new Audio('assets/zap.mp3');
var hitMP3 = new Audio('assets/hit.mp3');
var thumpMP3 = new Audio('assets/thump.mp3');

var hpMP3 = new Audio('assets/hp.mp3');
var berserkMP3 = new Audio('assets/berserk.mp3');
var hyperspeedMP3 = new Audio('assets/hyperspeed.mp3');
var bulletsMP3 = new Audio('assets/bullets.mp3');
var shieldMP3 = new Audio('assets/shield.mp3');

var hyperCollectMP3 = new Audio('assets/hyperCollect.mp3');
var berserkCollectMP3 = new Audio('assets/berserkCollect.mp3');
var shieldCollectMP3 = new Audio('assets/shieldCollect.mp3');

// launch game
$(document).ready(main);
    

function main(){

    gameInit();

}

function gameInit(){
    console.log("initiating");
    socket.emit("update game");
    gameLoop();
}

// main game loop

function gameLoop(){

    clear();

    if(currentGame != null && typeof(currentGame) != "undefined" && currentGame.status != "gameover") { 
        drawBoard(currentGame);
    } else {
        drawBoard(currentGame);
        text(currentGame.winner + " has won.", WIDTH/2, HEIGHT/2, 30, "white", true);

    }
    
    var animationCycle = setTimeout(function(){ requestAnimationFrame(gameLoop) }, animationSpeed);

}

function sendMovement(){
    if(currentGame.status != "gameover"){
        if(keypressLeft){ socket.emit("move player", 65) }
        if(keypressRight){ socket.emit("move player", 83) }
        if(keypressDown){ socket.emit("move player", 68) }
        if(keypressUp){ socket.emit("move player", 87) }   
    }
}


function drawBoard(game){

    drawBackround(game.background);
    sendMovement();

    if(game.p1){ 
        drawBase("p1")
        drawPlayer(game.p1) 
    }

    if(game.p2){ 
        drawBase("p2")
        drawPlayer(game.p2) 
    }

    drawObstacles();

    drawShotLine();
    drawBullets();






    var player = game[thisPlayer];

    if(player && typeof(player.bullets) != "undefined"){
        $("#bullet-count").text(player.bullets);

        if(player.bullets < 10 ){
            $("#bullet-count").css("color", "red").css("font-weight", "bold");
        } else {
            $("#bullet-count").css("color", "black").css("font-weight", "normal");
        }
    }

    if(player && typeof(player.money) != "undefined"){
        $("#money-count").text(Math.floor(player.money));
    }

    if(player && typeof(player.hp) != "undefined"){
        $("#health-count").text(Math.floor(player.hp));
    }

}

function drawBackround(color){
    rect(0, 0, WIDTH, HEIGHT, color)
}

function drawPlayer(player){
    circle(player.x, player.y, player.size, player.color, false);


    var healthBarWidth = player.size*2 + 10;                // those extra 10 px make the players look a little nicer              
    var healthWidth = player.hp/100*healthBarWidth;

    rect(player.x - player.size - 5, player.y - player.size*2, healthBarWidth, 5, "red", true);
    
    if(player.hp >= 0){
        rect(player.x - player.size - 5, player.y - player.size*2, healthWidth, 5, "green", false);
    }
}

function drawBase(player){
    var base = currentGame[player].base;
    rect(base.x, base.y, base.width , base.height, base.color);

    var startingY = (player == "p2") ? (currentGame[player].base.y - 5) : (currentGame[player].base.y + base.height);

    var healthBarWidth = base.width;                // those extra 10 px make the players look a little nicer              
    var healthWidth = base.hp/1000*healthBarWidth;

    rect(base.x, startingY, healthBarWidth, 5, "red", true);
    
    if(base.hp >= 0){
        rect(base.x, startingY, healthWidth, 5, "green", false);
    }



    drawBaseType(player);
}

function drawObstacles(){



    if(currentGame.obstacles){

        currentGame.obstacles.forEach(function(obstacle){
            var mountainPattern = ctx.createPattern(mountains, 'repeat');
            rect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, "black" ); //mountainPattern);
        })

    }

}

function drawShotLine(){
    if(thisPlayer){
        //line(currentGame[thisPlayer].x, currentGame[thisPlayer].y, lastX, lastY, 1)
    } 
}

function drawBullets(){

    if(currentGame.bullets && currentGame.bullets.length){
        currentGame.bullets.forEach(function(bullet){

            if(!bullet.hit){
                makeBullet(bullet.x, bullet.y, bullet.x - bullet.deltaX*10, bullet.y - bullet.deltaY*10, "#ED0014", 3) 
            }

            // circle(bullet.x, bullet.y,2, "white", false) where the bullet currently is

            var otherPlayer = "p2";
            if(bullet.player == "p2"){ otherPlayer = "p1" }


            if(distanceBetween(bullet.x, currentGame[otherPlayer].x, bullet.y, currentGame[otherPlayer].y) < currentGame[otherPlayer].size){
                hitMP3.currentTime = 0;
                hitMP3.volume = 0.2;
                hitMP3.play();
            } else if(inRectangle(bullet.x, bullet.y, currentGame[otherPlayer].base)){
                hitMP3.currentTime = 0;
                hitMP3.volume = 0.2;
                hitMP3.play();
            } else if(checkForObstacleHits(bullet)){
                console.log("thud");
                thumpMP3.currentTime = 0;
                thumpMP3.volume = 0.2;
                thumpMP3.play();
            }
            
        });
    } 

}

function shoot(){


    if(currentGame.status != "gameover" && currentGame[thisPlayer].bullets > 0){

        zapMP3.currentTime = 0;
        zapMP3.play();

        var shot = {
            x: lastX, 
            y: lastY
        }

        socket.emit("shoot", shot);
    }
}

// LISTENERS

$("body").on("click", "#update", function(){
    socket.emit("update game");
});

$("body").on("click", "#reset", function(){
    socket.emit("reset game");
});


$("#canvas").on("mousemove", function(e){

    lastX = e.pageX - $("#canvas").offset().left;
    lastY = e.pageY - $("#canvas").offset().top;
});


$("#buy-bullets").on("click", function(){
    socket.emit("buy bullets");
});


$("#canvas").on("click", function(e){
    shoot();
});


// LEFT 65, DOWN 83, RIGHT 68, UP 87


$("body").on("keydown", function(e){

    // if an arrow key is pressed, send move event

    if(e.which == 65) { keypressLeft = true }
    if(e.which == 68) { keypressDown = true }
    if(e.which == 83) { keypressRight = true }
    if(e.which == 87) { keypressUp = true }

});

$("body").on("keyup", function(e){

    // if an arrow key is pressed, send move event

    if(e.which == 65) { keypressLeft = false }
    if(e.which == 68) { keypressDown = false }
    if(e.which == 83) { keypressRight = false }
    if(e.which == 87) { keypressUp = false }

});








// SOCKET CODE

// when we get an updated game, set current game to updated game.
socket.on('updated game', function(newData){
    currentGame = newData.game;
    thisPlayer = newData.player;
});



socket.on('updated bullet locations', function(updatedBullets){
    currentGame.bullets = updatedBullets;
});

socket.on('gameover', function(player){
    gameOver = true;
});




// LIBRARY CODE

function clear() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);                 // creates a rectangle the size of the entire canvas that clears the area
}

function circle(x,y,r, color, stroke) {

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI*2, false);               // start at 0, end at Math.PI*2
    
    ctx.shadowBlur = 30;
    ctx.shadowColor = color;
    ctx.closePath();
    ctx.fillStyle = color;

    if(stroke){
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.stroke();
    }


    ctx.fill();


    ctx.shadowColor = "transparent";
}

function rect(x,y,w,h, color) {
    ctx.beginPath();
    ctx.rect(x,y,w,h);
    ctx.closePath();

    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.fillStyle = color;
    ctx.stroke();
    ctx.fill();
}

function text(text, x, y, size, color, centerAlign){
    ctx.font =  size + "px";
    ctx.fillStyle = color;

    if(centerAlign){
        ctx.textAlign = "center";
    } else {
        ctx.textAlign = "left";
    }

    ctx.fillText(text, x, y);
}

function line(x1, y1, x2, y2, color, width){
    ctx.beginPath();
    //ctx.globalCompositeOperation = "destination-over";
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.stroke();
}

function makeBullet(x1, y1, x2, y2, color, width){

    ctx.beginPath();

    ctx.shadowBlur = 10;
    ctx.globalAlpha = 0.6;
    ctx.shadowColor = "#BA0E11";
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.shadowColor = "transparent";
}


function drawBaseType(player){

    var image;

    if(currentGame[player].collecting == "health"){
        image = healthImage;
    } else if(currentGame[player].collecting == "money"){
        image = moneyImage;
    } else {
        console.log("Currently collecting: ");
        console.log(currentGame[player].collecting);
    }

    ctx.drawImage(image, (currentGame[player].base.x + currentGame[player].base.width/2) - 20/2, (currentGame[player].base.y + currentGame[player].base.height/2) - 20/2, 20, 20);

}


/* other functions */

function randBetween(min, max){
    return Math.floor(Math.random() * (max - min) + min);
}


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

function checkForObstacleHits(bullet){

    var hitObstacle = false;

    currentGame.obstacles.forEach(function(obstacle){
        if(inRectangle(bullet.x, bullet.y, obstacle)){ hitObstacle = true; }
    });
    
    return hitObstacle;
}
