const DIRECTIONS = [-8, -7, 1, 9, 8, 7, -1, -9];

export function printBoard(board) {
    for (let i = 0; i < 8; i++) {
        console.log(board.slice(8*i, 8*i+8));
    }
}

function getBracket(player, pos, d, board) {
    let oppColor = player.oppColor;
    let inc=1;
    const bracket=[pos];

    while(board[pos+inc*d] == oppColor) {
        bracket.push(pos+inc*d);
        inc=inc+1;
    }

    if (board[pos+inc*d] == undefined || inc == 1 || board[pos+inc*d] == '*') {
        return null;
    } else {
        return bracket;
    }
}

export function playMove(player, pos, board) {
    let color = player.color;
    const allBrackets = [];
    DIRECTIONS.forEach(d => {
        let bracket = getBracket(player, pos, d, board);
        if (bracket != null) {
            allBrackets.push(bracket);
            for (let i = 0; i < bracket.length; i++) {
                board[bracket[i]] = color;
            }
        }
    });
    return allBrackets;
}

function isLegalMove(player, pos, board) {
    let moveExists = false;
    if (board[pos] == '*') {
        for (let i = 0; i < DIRECTIONS.length; i++) {
            if (getBracket(player, pos, DIRECTIONS[i], board) != null) {
                moveExists = true;
                break;
            }
        }
    }
    return moveExists; 
}

export function getAllLegalMoves(player, board) {
    const playable = [];
    for (let i = 0; i < 64; i++) {
        if (isLegalMove(player, i, board)) {
            playable.push(i);
        }
    }
    return playable;
}

// BOT FUNCTIONS

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

function myMax(v, bestVal) {
    if (v[0] > bestVal[0]) {
        return v;
    } else {
        return bestVal;
    }
}

function myMin(v, bestVal) {
    if (v[0] < bestVal[0]) {
        return v;
    } else {
        return bestVal;
    }
}

function stopCondition(playerOne, playerTwo) {
    if (playerOne.moves.length == 0 && playerTwo.moves.length == 0) {
        return true;
    } else {
        return false;
    }
}

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