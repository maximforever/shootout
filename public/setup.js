/* SOCKET.IO */
var socket = io();



var app = new Vue({
    el: "#games-list",
    data: {
        games: {}
    }
});

socket.emit("get all games");


socket.on("updated game list", function(gameList){
    console.log("got an updated game list");
    console.log(gameList);
    app.games = gameList;
})


function main(){ 
   console.log("Hello world!");
}
