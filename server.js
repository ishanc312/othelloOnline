const express = require("express");
const socket = require("socket.io");
const http = require("http");

const app = express();
const PORT = 3000 || process.env.PORT;
const server = http.createServer(app);
let turn = true;

app.use(express.static("public"));
const io = socket(server);
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

function createGame(gameSocket) {
    gameSocket.on('createRoom', () => {
        let newRoomID = (Math.random()*10000 | 0).toString();
        gameSocket.join(newRoomID);
        gameSocket.emit('updateBox', newRoomID)
        gameSocket.on('startGameLoop', () => {
            prepareGame(newRoomID);
            gameLoop(newRoomID, gameSocket);
        })
    });
}

function playerJoinRoomAttempt(gameSocket) {
    gameSocket.on('playerJoinRoomAttempt', (roomID) => {
        let room = io.sockets.adapter.rooms.get(roomID);
        if (room != undefined) {
            if (room.size == 2) {
                gameSocket.emit('playerJoinFail');
            } else {
                gameSocket.join(roomID)
                if (room.size == 1) {
                    gameSocket.emit('playerJoinedOwnLobby');
                } else {
                    io.in(roomID).emit('playerJoinSuccess');
                    gameLoop(roomID, gameSocket);
                }
            }
        } else {
            gameSocket.emit('playerJoinFail')
        }
    });
}

async function prepareGame(roomID) {
    const sockets = await io.in(roomID).fetchSockets();
    const players = [...sockets];
    players[0].emit('yourTurn', data = {
        turn: true,
        flag: false
    });
    players[1].emit('awaitTurn');
}

async function gameLoop(roomID, gameSocket) {
    const sockets = await io.in(roomID).fetchSockets();
    const players = [...sockets];

    gameSocket.on('playerClickCell', (pos) => {
        console.log("SERVER-SIDE: A Player selected Position: " + pos);
        gameSocket.emit('tryPos', pos);
    });

    gameSocket.on('passTurn', (pos) => {
        gameSocket.emit('awaitTurn');
        turn = !turn;
        let data = {
            pos: pos,
            turn: turn,
            flag: true
        }
        gameSocket.to(roomID).emit('yourTurn', data)
        console.log("PASSED TURN...")
    })

    gameSocket.on('alterScoreFlag', (data) => {
        io.in(roomID).emit('alterScore', data);
    });

    gameSocket.on('alterStylesFlag', (data) => {
        io.in(roomID).emit('alterStyles', data);
    })

    gameSocket.on('endGameFlag', () => {
        io.in(roomID).emit('endGame');
    })

}

io.on("connection", (gameSocket) => {
    console.log(gameSocket.id);
    createGame(gameSocket);
    playerJoinRoomAttempt(gameSocket);
});