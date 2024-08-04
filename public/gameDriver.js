import { playMove, getAllLegalMoves, botPlayMove, printBoard } from "./gameLogic.js"
import { alterStyles, initializeEndScreen, shake } from "./gameEffects.js"

const BOARD =[
    '*', '*', '*', '*', '*', '*', '*', '*',
    '*', '*', '*', '*', '*', '*', '*', '*',
    '*', '*', '*', '*', '*', '*', '*', '*',
    '*', '*', '*', 'W', 'B', '*', '*', '*',
    '*', '*', '*', 'B', 'W', '*', '*', '*',
    '*', '*', '*', '*', '*', '*', '*', '*',
    '*', '*', '*', '*', '*', '*', '*', '*',
    '*', '*', '*', '*', '*', '*', '*', '*',
];

const Player1 = {
    name: "P1",
    color: 'B',
    coins: 30,
    score: 2,
    moves: [19, 26, 37, 44],
    oppColor: 'W',
    playAsBot: false,
    opponent: null,
    strategy: false
};

const Player2 = {
    name: "P2",
    color: 'W',
    coins: 30,
    score: 2,
    moves: [20,29,34,43],
    oppColor: 'B',
    playAsBot: false,
    opponent: null,
    strategy: true
};

Player1.opponent = Player2;
Player2.opponent = Player1;
let currentPlayer = Player1;
let turn = true;
const socket = io("http://localhost:8000");

const ALL_OPTIONS = document.querySelectorAll(".options");
const PC_OPTION = document.getElementById("PC")
const AI_OPTION = document.getElementById("AI")
const LOBBY_OPTION = document.getElementById("LOBBY")
const JOIN_OPTION = document.getElementById("JOIN")

const CELLS = document.querySelectorAll("td");

function disableBoxes(e) {
    if (e.target.id == "AI") { 
        Player2.playAsBot = true;
    }
    if (e.target.id == "LOBBY" || e.target.id == "JOIN") {
        Player1.playAsBot = true;
        Player2.playAsBot = true;
    }

    ALL_OPTIONS.forEach(button => {
        button.style.background = "#DDDDDC";
        button.style.pointerEvents = "none";
    });
    PC_OPTION.removeEventListener("click", initialize);
    AI_OPTION.removeEventListener("click", initialize)
    LOBBY_OPTION.removeEventListener("click", createRoom)
    JOIN_OPTION.removeEventListener("keydown", joinGame)
}

function initializeBoard() {
    document.getElementById("27").innerHTML = "<p class='whitePiece'></p>";
    document.getElementById("28").innerHTML = "<span class='blackPiece'></span>";
    document.getElementById("35").innerHTML = "<span class='blackPiece'></span>";
    document.getElementById("36").innerHTML = "<p class='whitePiece'></p>";
    if (!Player1.playAsBot && Player2.playAsBot) {
        CELLS.forEach(cell => cell.addEventListener("click", PVAILoop));
    } else if (Player1.playAsBot && Player2.playAsBot) {
        onlineTurn();
    } else {
        CELLS.forEach(cell => cell.addEventListener("click", PVPLoop));
    }
}

function initializeIndicators() {
    document.getElementById("turnStatus").innerHTML = "BLACK STARTS!";
    document.getElementById("moveStatus").innerHTML = "CLICK A SQUARE!";
    document.getElementById("blackScore").innerHTML = "2";
    document.getElementById("whiteScore").innerHTML = "2";
}

function initialize(e) {
    disableBoxes(e);
    initializeBoard();
    initializeIndicators();
}
PC_OPTION.addEventListener("click", initialize);
AI_OPTION.addEventListener("click", initialize);

function createRoom(e) {
    socket.emit('createRoom');
    socket.on('updateBox', (newRoomID) => {
        e.target.innerHTML = "SHARE THIS CODE: " + newRoomID.toString();
    });
    socket.on('playerJoinSuccess', () => {
        initialize(e);
        socket.emit('startGameLoop');
    });
}

function joinGame(e) {
    if (e.key == 'Enter') {
        socket.emit('playerJoinRoomAttempt', JOIN_OPTION.value);
        socket.on('playerJoinFail', () => {
            shake(JOIN_OPTION, "", "");
        });
        socket.on('playerJoinedOwnLobby', () => {
            shake(JOIN_OPTION, "", "");
        });
        socket.on('playerJoinSuccess', () => {
            initialize(e);
        });
    }
}
LOBBY_OPTION.addEventListener("click", createRoom)
JOIN_OPTION.addEventListener("keydown", joinGame);

function endGame() {
    CELLS.forEach(cell => cell.replaceWith(cell.cloneNode(true)));
    initializeEndScreen();
}

function alterScore(currentPlayerColor, brackets) {
    let flipped = brackets.flat().length - brackets.length;
    if (currentPlayerColor == 'B') {
        Player1.score += (flipped+1);
        Player2.score -= (flipped);
        Player1.coins -= 1;
    } else {
        Player2.score += (flipped+1);
        Player1.score -= (flipped);
        Player2.coins -= 1;
    }
}

function humanTurn(currentPlayer, pos) {
    if (!currentPlayer.moves.includes(pos)) {
        shake(document.getElementById("moveStatus"), "INVALID MOVE!", "CLICK A SQUARE!");
        return false;
    } else {
        let brackets = playMove(currentPlayer, pos, BOARD);
        alterScore(currentPlayer.color, brackets);
        alterStyles(currentPlayer.color, brackets, Player1.score, Player2.score);
        currentPlayer.opponent.moves = getAllLegalMoves(currentPlayer.opponent, BOARD);
        if (currentPlayer.opponent.moves.length > 0) {
            turn = !turn;
        } else {
            currentPlayer.moves = getAllLegalMoves(currentPlayer, BOARD);
            if (currentPlayer.moves.length == 0) {
                endGame();
            }
        }
        return true;
    }
}

function botTurn(currentPlayer) {
    let brackets = botPlayMove(currentPlayer, BOARD);

    let status = document.getElementById("moveStatus");
    status.classList = "think";
    status.innerHTML = "AI IS THINKING.."
    setTimeout(function() {
        status.classList = "";
        status.innerHTML = "CLICK A SQUARE!";
        alterScore(currentPlayer.color, brackets);
        alterStyles(currentPlayer.color, brackets, Player1.score, Player2.score);
    }, 1000)

    currentPlayer.opponent.moves = getAllLegalMoves(currentPlayer.opponent, BOARD);
    if (currentPlayer.opponent.moves.length > 0) {
        turn = !turn;
    } else {
        currentPlayer.moves = getAllLegalMoves(currentPlayer, BOARD);
        if (currentPlayer.moves.length == 0) {
            endGame();
        } else {
            botTurn(currentPlayer);
        }
    }
}

function onlineTurn() {

    socket.on('yourTurn', (data) => {
        if (data.turn) {
            currentPlayer = Player1;
        } else {
            currentPlayer = Player2;
        }

        if (data.flag) {
            playMove(currentPlayer.opponent, data.pos, BOARD);
            currentPlayer.moves = getAllLegalMoves(currentPlayer, BOARD);
        }

        CELLS.forEach(cell => cell.addEventListener("click", onlineLoop));
        document.getElementById("moveStatus").innerHTML = "CLICK A SQUARE!";
    });

    socket.on('awaitTurn', () => {
        CELLS.forEach(cell => cell.removeEventListener("click", onlineLoop));
        document.getElementById("moveStatus").innerHTML = "WAITING..";
    });

    socket.on('tryPos', (pos) => {
        if (!currentPlayer.moves.includes(pos)) {
            shake(document.getElementById("moveStatus"), "INVALID MOVE", "CLICK A SQUARE!");
        } else {
            let brackets = playMove(currentPlayer, pos, BOARD);
            currentPlayer.opponent.moves = getAllLegalMoves(currentPlayer.opponent, BOARD);
            let data = {
                color: currentPlayer.color,
                bracket: brackets
            }
            socket.emit('alterScoreFlag', data);
            if (currentPlayer.opponent.moves.length > 0) {
                socket.emit('passTurn', pos);
            } else {
                currentPlayer.moves = getAllLegalMoves(currentPlayer, BOARD);
                if (currentPlayer.moves.length == 0) {
                    socket.emit('endGameFlag');
                }
            }
        }
    });

    socket.on('alterScore', (previousData) => {
        alterScore(previousData.color, previousData.bracket);
        let data = {
            color: previousData.color,
            bracket: previousData.bracket,
            blackScore: Player1.score,
            whiteScore: Player2.score
        }
        socket.emit('alterStylesFlag', data);
    });

    socket.on('alterStyles', (data) => {
        alterStyles(data.color, data.bracket, data.blackScore, data.whiteScore);
    });

    socket.on('endGame', () => {
        endGame();
    })
}

function PVAILoop(e) {
    let pos = parseInt(e.target.id);
    if (humanTurn(Player1, pos)) {
        botTurn(Player2);
    }
}

function PVPLoop(e) {
    let pos = parseInt(e.target.id);
    if (turn) {
        currentPlayer = Player1;
    } else {
        currentPlayer = Player2;
    }
    humanTurn(currentPlayer, pos);
}

function onlineLoop(e) {
    let pos = parseInt(e.target.id);
    socket.emit('playerClickCell', pos);
}