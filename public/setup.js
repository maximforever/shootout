/* SOCKET.IO */
var socket = io();



var app = new Vue({
    el: "#games-list",
    data: {
        games: {}
    },
    methods: {
        playerUrl(id){
            return ("/game/" + id + "/player");
        },

        spectatorUrl(id){
            console.log(id);
            return ("/game/" + id + "/spectator");
        }
    }
});

socket.emit("get all games");


socket.on("updated game list", function(gameList){
    app.games = gameList;
})


function main(){ 
   console.log("Hello world!");
}
