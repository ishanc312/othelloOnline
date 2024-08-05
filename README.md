<div align=center>
<pre>
   ______     ______   __  __     ______     __         __         ______    
/\  __ \   /\__  _\ /\ \_\ \   /\  ___\   /\ \       /\ \       /\  __ \   
\ \ \/\ \  \/_/\ \/ \ \  __ \  \ \  __\   \ \ \____  \ \ \____  \ \ \/\ \  
 \ \_____\    \ \_\  \ \_\ \_\  \ \_____\  \ \_____\  \ \_____\  \ \_____\ 
  \/_____/     \/_/   \/_/\/_/   \/_____/   \/_____/   \/_____/   \/_____/ 
--------------------------------------------------------------------------
A browser-based recreation of the popular board game Othello. 
</pre>
   
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
</div>

# TRY IT OUT [HERE!](http://104.248.225.13/) #

## Overview ##
Featuring a colorful yet simplistic UI created utilizing minimal HTML and CSS, this version offers flexible support for three different gamemodes to choose from:

- **Player v. Player**: Play on a single computer with a friend, simply passing control of the mouse to the other person.
- **Player v. AI**: Play against an AI which utilizes a minimax algorithm and evaluates game states with a simple heuristic.
- **Player v. Player (Online)**: Hit create a lobby to generate a code to share with a friend, who can then join with the code to commence online play. Feature created with the WebSocket protocol, through the Socket.io JS package.

The original version of this project I had created, written in Python, can be found [here](https://github.com/ishanc312/othelloWithBot).

## Code Breakdown ##
#### Player v. Player: ####
```javascript 
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
```
A function which takes in the `currentPlayer` object and the `pos` of the cell the player clicked. 
- If `pos` is not in the list of legal moves, a visual effect is triggered. Otherwise, the scores and board are updated, and the `currentPlayer.opponent` list of legal moves are updated.
- If the opponent has no moves, the `currentPlayer` can pick a cell again; however, if they have no moves either, `endGame()` is called. 

#### Player v. AI: ####
```javascript
function h(board) {
    let whiteCount = 0;
    let blackCount = 0;
    for (let i = 0; i < 64; i++) {
        if (board[i] == 'B') {
            blackCount++;
        } else if (board[i] == 'W') {
            whiteCount++;
        }
    }

    return whiteCount - blackCount;
}
```
The AI follows the rule of maximizing the amount of game pieces of its own color; thus, if its game pieces are black, `whiteCount - blackCount` should be minimized; if its game pieces are white, `whiteCount - blackCount` should be maximized.

```javascript
function minimax(current, board, depth, maximizingPlayer, alpha, beta) {
    if (depth == 0 || stopCondition(current, current.opponent) == true) {
        return [h(board), null]
    } else {
        const potentialMoves = current.moves.slice();
        if (maximizingPlayer) {
            let bestVal = [-Infinity, null];
            for (let i = 0; i < potentialMoves.length; i++) {
                const tempBoard = board.slice();
                playMove(current, potentialMoves[i], tempBoard);
                current.opponent.moves = getAllLegalMoves(current.opponent, tempBoard);
                let v = [minimax(current.opponent, tempBoard, depth-1, false, alpha, beta)[0], potentialMoves[i]];
                bestVal = myMax(v, bestVal);
                alpha = Math.max(alpha, bestVal[0]);
                if (beta <= alpha) {
                    break;
                }
            }
            return bestVal;
        } else {
            let bestVal = [Infinity, null];
            for (let i = 0; i < potentialMoves.length; i++) {
                const tempBoard = board.slice();
                playMove(current, potentialMoves[i], tempBoard);
                current.opponent.moves = getAllLegalMoves(current.opponent, tempBoard);
                let v = [minimax(current.opponent, tempBoard, depth-1, true, alpha, beta)[0], potentialMoves[i]];
                bestVal = myMin(v, bestVal);
                beta = Math.min(beta, bestVal[0]);
                if (beta <= alpha) {
                    break;
                }
            }
            return bestVal;
        }
    }
}

export function botPlayMove(player, board) {
    let optimalPos = minimax(player, board, 3, player.strategy, -Infinity, Infinity)[1];
    return playMove(player, optimalPos, board);
}
```
This recursive `minimax()` function returns a tuple as opposed to a singular value.
- This tuple is comprised of the value of the heuristic evaluated on a board on which the "optimal" position was played, and the actual optimal position itself.
- Then, `botPlayMove()` calls upon the `minimax` function to select an `optimalPos`, and then calls `playMove()` with that `optimalPos`.
- In the actual gameplay loop, similar logic is followed as described in the **Player v. Player** code above; the key difference is that `botPlayMove()` is called following legal play by the (human) player. 

#### Player v. Player (Online) ####
```javascript
async function gameLoop(roomID, gameSocket) {
    const sockets = await io.in(roomID).fetchSockets();
    const players = [...sockets];

    gameSocket.on('playerClickCell', (pos) => {
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
```
Above are all the server-side event listeners and emitters that allow for bidirectional communication with clients in the game room.
- On `'playerClickCell'`, the server tells the client to play that position, and if the move is legal, the client emits 'passTurn', 'alterScoreFlag', and 'alterStylesFlag'.
- On `'alterScoreFlag'` and `'alterStylesFlag'`, the server emits `'alterScore'` and `'alterStyles'` to all clients in the room, updating the physical scoreboard and board, alongside the javascript variables associated with each, on their end.
- On `'passTurn'`, the server tells the client (who just played a position) to `'awaitTurn'`, disabling their ability to click the board. The server then tells the other client it is `'yourTurn'`, re-enabling their ability to click the board.
- On `'endGameFlag'`, the server emits `'endGame'` to all clients in the room, upon which they call the `endGame()` function.

## Tech Stack
- **Client**: HTML, CSS, JavaScript
- **Server**: Node.js, Express, Socket.io 

## Roadmap ##
- Set up a CI/CD Pipeline for my own sanity 
- Fix bugginess with the `endGame()` function not calling when it needs to
- Indicator to alert the user if their opponent has left the game 
- Add a selector for the difficulty of the AI so it can utilize weaker/stronger heuristic functions
- Ensure the ability to play over long distances without weird behavior 
