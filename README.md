This is a revamped version of my previous recreation of Othello, which was done in Python; here, I have created a full-stack web application in HTML/CSS/JS featuring a colorful UI and additional functionality.

It features three gamemodes: 
1. The game can be played on a singular computer, where two players take turns passing the laptop and inputting their moves.
2. A player can play against an AI, which utilizes a Minimax Algorithm according to a Heuristic which I have defined for the bot, to pick an "optimal" move.
3. A player can create a lobby for someone on another computer to join via localhost. This was implemented utilizing Express and Socket.io.

To run, simply type node server.js into your terminal and visit localhost:3000 to play!
