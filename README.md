Game Server
    A simple game server with Line98 and Caro games built with NestJS.

Features
    User authentication (register/login)
    Profile management
    Line98 game
    Caro game (single player)
    SQLite database

Setup
Install dependencies:
    npm install

Run the application:
    npm run start


Open your browser and go to:
    http://localhost:3000/

Authentication
Register a new account or login with existing account
After login, you can access the game selection

Line98 Game
    Click on balls to select them
    Move selected balls to empty cells (horizontal/vertical only)
    Create rows of 5 same-colored balls to score points
    Use "Get Hint" for game tips

Caro Game
    Click on the board to place X/O pieces
    Create a line of 5 pieces to win
    Game supports single player mode

API Endpoints
    POST /auth/register - Register new user
    POST /auth/login - Login user
    PUT /users/profile - Update user profile (requires auth)

Technologies Used
    NestJS framework
    SQLite database with TypeORM
    JWT authentication
    HTML5 Canvas for game graphics