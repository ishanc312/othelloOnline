export function alterStyles(color, brackets, blackScore, whiteScore) {
    let placePiece = "";

    if (color == 'B') {
        document.getElementById("board").style.borderColor = "white";
        document.getElementById("title").style.color = "white";
        document.getElementById("turnStatus").innerHTML = "WHITE'S TURN!"
        document.getElementById("turnStatus").style.color = "white";
        placePiece =  "<p class='blackPiece'></p>";
    } else {
        document.getElementById("board").style.borderColor = "black";
        document.getElementById("title").style.color = "black";
        document.getElementById("turnStatus").innerHTML = "BLACK'S TURN!"
        document.getElementById("turnStatus").style.color = "black";
        placePiece = "<span class='whitePiece'></span>"
    }
    
    brackets.forEach(bracket => {
        for (let i = 0; i < bracket.length; i++) {
            document.getElementById(bracket[i]).innerHTML = placePiece;
        }
    });    

    document.getElementById("blackScore").innerHTML = blackScore;
    document.getElementById("whiteScore").innerHTML = whiteScore;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function initializeEndScreen() {
    let indicator = document.getElementById("turnStatus");
    indicator.innerHTML = "GAME OVER!";
    indicator.style.color = "#48a16d";

    let resetButton = document.getElementById("moveStatus");
    resetButton.innerHTML = "PLAY AGAIN?";
    resetButton.style.color = "#48a16d";
    resetButton.addEventListener("click", function() {
        location.reload()
    });
}

export async function shake(element, newText, oldText) {
    element.classList.add("shake");
    element.innerHTML = newText;
    setTimeout(function() {
        element.classList.remove("shake");
        element.innerHTML = oldText;
    }, 800);
}