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

var scaleMultiplier = 1;


var currentGame = {
    background: "white"
}

var offset = {
    x: 0,
    y: 0
}


// load up images for canvas 
var healthImage = new Image();
healthImage.src = "../../assets/icons/health.png";

var moneyImage = new Image();
moneyImage.src = "../../assets/icons/money.png";

var mountains = new Image();
mountains.src = "../../assets/patterns/mountains2.png";

var building = new Image();
building.src = "../../assets/patterns/building.png";



var p1image = new Image();
p1image.src = "../../assets/icons/bluePlayer.png";

var p2image = new Image();
p2image.src = "../../assets/icons/redPlayer.png";



/* audio */

var zapMP3 = new Audio('../../assets/zap.mp3');
var stunMP3 = new Audio('../../assets/stun.mp3');
var hitMP3 = new Audio('../../assets/hit.mp3');
var thumpMP3 = new Audio('../../assets/thump.mp3');

var hpMP3 = new Audio('../../assets/hp.mp3');
var berserkMP3 = new Audio('../../assets/berserk.mp3');
var hyperspeedMP3 = new Audio('../../assets/hyperspeed.mp3');
var bulletsMP3 = new Audio('../../assets/bullets.mp3');
var shieldMP3 = new Audio('../../assets/shield.mp3');

var hyperCollectMP3 = new Audio('../../assets/hyperCollect.mp3');
var berserkCollectMP3 = new Audio('../../assets/berserkCollect.mp3');
var shieldCollectMP3 = new Audio('../../assets/shieldCollect.mp3');


var cashRegisterMP3 = new Audio('../../assets/cash.mp3');
var whooshMP3 = new Audio('../../assets/whoosh.mp3');

var gameID, player;



// launch game
$(document).ready(main);
    

function main(){
    gameInit();

}

function gameInit(){
    console.log("initiating");
    
    scaleMultiplier = window.innerHeight / HEIGHT * 0.75;


    WIDTH = canvas.width *= scaleMultiplier;
    HEIGHT = canvas.height *= scaleMultiplier;

    $(".panel").width(WIDTH);

    socket.emit("update game");
    gameLoop();


}

// main game loop

function gameLoop(){

    clear();

    if(currentGame != null && typeof(currentGame) != "undefined" && currentGame.background != "white") { 
        drawBoard(currentGame);
    } 

    if(currentGame.status == "gameover"){
        text(currentGame.winner + " has won.", WIDTH/2, HEIGHT/2, 30*scaleMultiplier, "white", true);
    }
    
    var animationCycle = setTimeout(function(){ requestAnimationFrame(gameLoop) }, animationSpeed);

}

function sendMovement(){
    if(currentGame.status == "in progress"){

        var direction = null;

        if(keypressLeft){ direction = "Left" }
        if(keypressRight){ direction = "Right" }
        if(keypressDown){ direction = "Down" }
        if(keypressUp){ direction = "Up" } 

        if(keypressLeft && keypressUp){ direction = "UpLeft" }
        if(keypressLeft && keypressDown){ direction = "DownLeft" }
        if(keypressRight && keypressUp){ direction = "UpRight" }
        if(keypressRight && keypressDown){ direction = "DownRight" }

        if(direction != null){
            socket.emit("move player", direction);
        }
        
    }

}


function drawBoard(game){

    drawBackround(game.background);
    drawShotLine();
    
    
    if(game.participants.p1){ 
        drawBase("p1")
        drawPlayer(game.p1) 
    }

    if(game.participants.p2){ 
        drawBase("p2")
        drawPlayer(game.p2) 
    }

    drawObstacles();
    drawBullets();


    if(currentGame.status == "in progress"){
        sendMovement();
    }
    



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

    if(player && typeof(player.stun) != "undefined"){
        $("#stun-count").text(Math.floor(player.stun));
    }

    if(player && typeof(player.invisibility) != "undefined"){
        $("#invisibility-count").text(Math.floor(player.invisibility));
    }

    if(player && player.invisibilityEndTime > Date.now()){
        $("use-invisibility").prop("disabled",true);    
    }

    if(player && player.stunBulletEndTime > Date.now()){
        $("use-stuns").prop("disabled",true);    
    }
    

}

function drawBackround(color){

    rect(-WIDTH, -HEIGHT, WIDTH*3, HEIGHT*3, "black");
    rect(0, 0, WIDTH, HEIGHT, color);      // 
    //rect(0, 0, WIDTH, HEIGHT, color);
}

function drawPlayer(player){
    //console.log(player.player);








    var image = (player.player == 1) ? p1image : p2image;

    ctx.save();

    // move to the center of the canvas
    //ctx.translate(WIDTH/2,HEIGHT/2);

    // rotate the canvas to the specified degrees
//    ctx.rotate(90*Math.PI/180);
    

/*    function getAngle(x1, y1, x2, y2) {
        var dx = x1 - x2;
        var dy = y1 - y2;
        var defaultDegrees = Math.atan2(dy,dx) * 180/Math.PI;

        var shiftedAngle = defaultDegrees + 180 -90;       
        return shiftedAngle;
    }
*/


    // var angleDeg = getAngle(player.x, player.y, lastX, lastY);
    //console.log(angleDeg);

    //ctx.rotate(angleDeg);
    
    player.color = "rgba(255, 255, 255, 0)";

    // health bar
    var healthBarWidth = player.size*2 + 10;                // those extra 10 px make the players look a little nicer              
    var healthWidth = player.hp/100*healthBarWidth;

    //check that the player is invisible...

    if(player.invisibilityEndTime > Date.now()){

        if(player.player == thisPlayer){       

            // draw an empty circle            
            circle(player.x, player.y, player.size, player.color, true);

            // draw health bars
            rect(player.x - player.size - 5, player.y - player.size*2, healthBarWidth, healthBarWidth/6, "red", true);
            rect(player.x - player.size - 5, player.y - player.size*2, healthWidth, healthBarWidth/6, "green", false);

        } else {
            // draw nothing
            text("Someone is invisible", WIDTH/2, HEIGHT/2, 10*scaleMultiplier, "white", true);

        }
    } else {
            // 1.5*player.size ensures the image is ligned up correctly within a circle
                                        
        ctx.drawImage(image, player.x - 1.5*player.size + offset.x , player.y- player.size*2 + offset.y , player.size*3, player.size*3);
        player.color = "rgba(255, 255, 255, 0)";
        circle(player.x , player.y , player.size, player.color, true);
        rect(player.x - player.size - 5, player.y - player.size*2, healthBarWidth, healthBarWidth/6, "red", true);
        rect(player.x - player.size - 5, player.y - player.size*2, healthWidth, healthBarWidth/6, "green", false);
    }

    
    ctx.restore();


    /*
    if(player.stunnedEndTime > Date.now()){
        if(player.player == 1){
            player.color = "#a6f4d0";
        } 

        if(player.player == 2){
            player.color = "#fcc2fa";
        }
    }

    if(player.invisibilityEndTime > Date.now()){
        player.color = "rgba(255, 255, 255, 0)";

        if(("p" + player.player) == thisPlayer){
            circle(player.x, player.y, player.size, player.color, true);
        } else {
            circle(player.x, player.y, player.size, player.color, false);
        }


    } else {

        circle(player.x, player.y, player.size, player.color, false);

        var healthBarWidth = player.size*2 + 10;                // those extra 10 px make the players look a little nicer              
        var healthWidth = player.hp/100*healthBarWidth;

        rect(player.x - player.size - 5, player.y - player.size*2, healthBarWidth, healthBarWidth/6, "red", true);
        
        if(player.hp >= 0){
            rect(player.x - player.size - 5, player.y - player.size*2, healthWidth, healthBarWidth/6, "green", false);
        }
    }

    
    */
    
}

function drawBase(player){
    var base = currentGame[player].base;
    rect(base.x, base.y, base.width, base.height, base.color);

    var startingY = (player == "p2") ? (currentGame[player].base.y - 5) : (currentGame[player].base.y + base.height);
    drawBaseType(player);
}

function drawObstacles(){

    if(currentGame.obstacles){
        currentGame.obstacles.forEach(function(obstacle){
            var buildingPattern = ctx.createPattern(building, 'repeat');
            rect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, "black");//buildingPattern);
        })

    }

}

function drawShotLine(){
    if(thisPlayer){
        circle(lastX - offset.x, lastY - offset.y, 5, "pink", true );
        line(currentGame[thisPlayer].x, currentGame[thisPlayer].y, lastX - offset.x, lastY - offset.y, 1)
    } 
}

function drawBullets(){

    if(currentGame.bullets && currentGame.bullets.length){
        currentGame.bullets.forEach(function(bullet){

            if(!bullet.hit){
                makeBullet(bullet.x, bullet.y, bullet.x - bullet.deltaX*10, bullet.y - bullet.deltaY*10, bullet.color, 3) 
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

    if(currentGame.status == "in progress" && currentGame[thisPlayer] && currentGame[thisPlayer].bullets > 0){
        console.log("shooting");
        zapMP3.currentTime = 0;
        zapMP3.play();

        var shot = {    
            // we have to "un"-account for screen size 
            x: lastX/scaleMultiplier, 
            y: lastY/scaleMultiplier
        }

        socket.emit("shoot", shot);
    } else {
        console.log("not meeting some requirement");
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

$("#buy-stuns").on("click", function(){
    socket.emit("buy stun");
});

$("#buy-invisibility").on("click", function(){
    socket.emit("buy invisibility");
});


$("#canvas").on("click", function(e){
    shoot();
});


// LEFT 65, DOWN 83, RIGHT 68, UP 87


$("body").on("keydown", function(e){

    // if an arrow key is pressed, send move event

    if(e.which == 65) { keypressLeft = true }
    if(e.which == 68) { keypressRight = true }
    if(e.which == 83) { keypressDown = true }
    if(e.which == 87) { keypressUp = true }         


    if(e.which == 93) {
        socket.emit("activate stun");
    } 

    if(e.which == 94) {
       socket.emit("activate invisibility");
    }
});


$("body").on("keyup", function(e){

    // if an arrow key is pressed, send move event

    if(e.which == 65) { keypressLeft = false }
    if(e.which == 68) { keypressRight = false }
    if(e.which == 83) { keypressDown = false }
    if(e.which == 87) { keypressUp = false }

});


$("body").on("click", "#activate-stun", function(){
    socket.emit("activate stun");
});

$("body").on("click", "#activate-invisibility", function(){
    socket.emit("activate invisibility");
});










// SOCKET CODE

// when we get an updated game, set current game to updated game.
socket.on('updated game', function(newData, sound){


    currentGame = scaleGame(newData.game)
    console.log(newData.player);

    // TURN OFFSET ON

    var offsetOn = false;

    if(offsetOn && typeof(currentGame[newData.player]) != "undefined" ){
        offset.x = WIDTH/2 - currentGame[newData.player].x;
        offset.y = HEIGHT/2 - currentGame[newData.player].y;
    }


/*
    $("#offset-x").text(offset.x);
    $("#offset-y").text(offset.y);
    

*/

    currentGame = newData.game;
    thisPlayer = newData.player;

    // delete this later
    $("#game-json").html(JSON.stringify(currentGame, undefined, 4))

    if(sound != null){

        switch(sound) {
            case "purchase":
                playPurchaseSound();
                break;
            case "useInvisibility":
                playInvisibilitySound();
                break;
            case "applyStun":
                playApplyStunSound();
                break;
            case "useStun":
                playUseStunSound();
                break;
            default:
                break;
        }


    }
});



socket.on('updated bullet locations', function(updatedBullets){
    currentGame.bullets = updatedBullets;
});

socket.on('gameover', function(player){
    gameOver = true;
});


function playPurchaseSound(){
    cashRegisterMP3.currentTime = 0;
    cashRegisterMP3.volume = 0.2;
    cashRegisterMP3.play();
}

function playInvisibilitySound(){
    whooshMP3.currentTime = 0;
    whooshMP3.volume = 0.2;
    whooshMP3.play();
};

function playApplyStunSound(){
    stunMP3.currentTime = 0;
    stunMP3.volume = 0.2;
    stunMP3.play();
};

function playUseStunSound(){
    console.log("there'll be a sound here");
};


// LIBRARY CODE

function clear() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);                 // creates a rectangle the size of the entire canvas that clears the area
}

function circle(x,y,r, color, stroke) {

    ctx.beginPath();
    ctx.arc(x + offset.x, y + offset.y, r, 0, Math.PI*2, false);               // start at 0, end at Math.PI*2

    ctx.shadowBlur = 30;
    ctx.shadowColor = color;
    ctx.closePath();
    ctx.fillStyle = color;

    if(stroke){
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;
        ctx.stroke();
    }


    ctx.fill();


    ctx.shadowColor = "transparent";
}

function rect(x,y,w,h, color) {
    ctx.beginPath();
    ctx.rect(x + offset.x ,y + offset.y,w,h);
    ctx.closePath();

    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.fillStyle = color;
    ctx.stroke();
    ctx.fill();
}

function text(text, x, y, size, color, centerAlign){

    ctx.font =  size + "px Arial";
    ctx.fillStyle = color;

    if(centerAlign){
        ctx.textAlign = "center";
    } else {
        ctx.textAlign = "left";
    }

    ctx.fillText(text, x + offset.x, y + offset.y);
}


function line(x1, y1, x2, y2, color, width){
    ctx.beginPath();
    //ctx.globalCompositeOperation = "destination-over";
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.moveTo(x1 + offset.x,y1+ offset.y);
    ctx.lineTo(x2+ offset.x,y2 + offset.y);
    ctx.stroke();
}

function makeBullet(x1, y1, x2, y2, color, width){

    ctx.beginPath();

    ctx.shadowBlur = 10;
    ctx.globalAlpha = 0.6;
    ctx.shadowColor = "#BA0E11";
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.moveTo(x1 + offset.x, y1 + offset.y);
    ctx.lineTo(x2 + offset.x, y2 + offset.y);
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

    ctx.drawImage(image, (currentGame[player].base.x + currentGame[player].base.width/2) - 20/2 + offset.x, (currentGame[player].base.y + currentGame[player].base.height/2) - 20/2 + offset.y, 20*scaleMultiplier, 20*scaleMultiplier);

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


function scaleGame(game){
    
    game.p1.x *= scaleMultiplier;
    game.p1.y *= scaleMultiplier;
    game.p1.size *= scaleMultiplier;
    game.p1.base.x *= scaleMultiplier;
    game.p1.base.y *= scaleMultiplier;
    game.p1.base.width *= scaleMultiplier;
    game.p1.base.height *= scaleMultiplier;

    game.p2.x *= scaleMultiplier;
    game.p2.y *= scaleMultiplier;
    game.p2.size *= scaleMultiplier;
    game.p2.base.x *= scaleMultiplier;
    game.p2.base.y *= scaleMultiplier;
    game.p2.base.width *= scaleMultiplier;
    game.p2.base.height *= scaleMultiplier;


    game.obstacles.forEach(function(obstacle){
        obstacle.x *= scaleMultiplier;
        obstacle.y *= scaleMultiplier;
        obstacle.width *= scaleMultiplier;
        obstacle.height *= scaleMultiplier;
    });

    game.bullets.forEach(function(bullet){
        bullet.x *= scaleMultiplier;
        bullet.y *= scaleMultiplier;
    });

    return game;


}

