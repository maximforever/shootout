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


/* audio */

var soundtrack = new Audio('assets/StarfieldDraft1.mp3');

var zapMP3 = new Audio('assets/zap.mp3');
var hitMP3 = new Audio('assets/hit1.mp3');
var hurtMP3 = new Audio('assets/hit2.mp3');
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
    socket.emit("update game");
    gameLoop();
}

// main game loop

function gameLoop(){

    clear();

    if(currentGame != null && currentGame.status != "gameover") { 
        drawBoard(currentGame);
    } else {
        drawBoard(currentGame);
        
    }
    
    var animationCycle = setTimeout(function(){ requestAnimationFrame(gameLoop) }, animationSpeed);

}

function sendMovement(){
    if(keypressLeft){ socket.emit("move player", 65) }
    if(keypressRight){ socket.emit("move player", 83) }
    if(keypressDown){ socket.emit("move player", 68) }
    if(keypressUp){ socket.emit("move player", 87) }   
}


function drawBoard(game){
    // console.log(game);

    drawBackround(game.background);
    sendMovement();

    if(game.p1){ drawPlayer(game.p1) }
    if(game.p2){ drawPlayer(game.p2) }

    drawShotLine();
    drawBullets();
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

function drawShotLine(){
    if(thisPlayer){
        //line(currentGame[thisPlayer].x, currentGame[thisPlayer].y, lastX, lastY, 1)
    } 
}

function drawBullets(){

    if(currentGame.bullets && currentGame.bullets.length){
        currentGame.bullets.forEach(function(bullet){

            if(!bullet.hit){
                line(bullet.x, bullet.y, bullet.x - bullet.deltaX*10, bullet.y - bullet.deltaY*10, "red", 3) 
            }
            

        });
    } else {
        console.log("no bullets");
    }

}

function shoot(){
    var shot = {
        x: lastX, 
        y: lastY
    }

    socket.emit("shoot", shot);
}


// LISTENERS

$("body").on("click", "#update", function(){
    socket.emit("update game");
});


$("#canvas").on("mousemove", function(e){

    lastX = e.pageX - $("#canvas").offset().left;
    lastY = e.pageY - $("#canvas").offset().top;
});


$("#canvas").on("click", function(e){
    console.log(lastX + ", " + lastY);
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


$("#canvas").on("click", function(e){

    zapMP3.currentTime = 0;
    zapMP3.play();


});






// SOCKET CODE

// when we get an updated game, set current game to updated game.
socket.on('updated game', function(newData){
    currentGame = newData.game;
    thisPlayer = newData.player;

});


socket.on('gameover', function(player){
    
});




// LIBRARY CODE

function clear() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);                 // creates a rectangle the size of the entire canvas that clears the area
}

function circle(x,y,r, color, stroke) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI*2, false);               // start at 0, end at Math.PI*2
    ctx.closePath();
    ctx.fillStyle = color;

    if(stroke){
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.stroke();
    }


    ctx.fill();
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

/* other functions */

function randBetween(min, max){
    return Math.floor(Math.random() * (max - min) + min);
}

function getDistance(x1, y1, x2, y2){
    return Math.sqrt(Math.pow((x1-x2),2) + Math.pow((y1-y2),2));
}