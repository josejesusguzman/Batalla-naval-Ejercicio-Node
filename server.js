const express = require('express');
const path = require('path'); 
const http = require('http');
const PORT = process.env.PORT || 3000;
const socket = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socket(server);

app.use(express.static('public'));

/**
 * This is a JavaScript arrow function that logs the message "El servidor esta
 * corriendo" to the console. It does not take any parameters.
 */
server.listen(PORT, () => console.log("El servidor esta corriendo"));

const connections = [null, null];

/**
 * The `socket` method is responsible for handling player connections,
 * disconnections, and game actions in a multiplayer game. It takes care of
 * assigning player numbers, tracking player readiness, checking player status,
 * handling player firing actions, and managing disconnections due to inactivity.
 * 
 * **Parameters:**
 * - None
 * 
 * **Returns:**
 * - None
 * 
 * **Events emitted:**
 * - `player-number`: Emits the player index to the connected socket.
 * - `player-connection`: Emits the player index to all other connected sockets.
 * - `enemy-ready`: Emits the player index to all other connected sockets when a
 * player is ready.
 * - `check-players`: Emits an array of player objects containing their connection
 * and readiness status to the connected socket.
 * - `fire`: Emits the player index and the target square ID to all other connected
 * sockets.
 * - `fire-reply`: Emits the target square object to all other connected sockets.
 * - `timeout`: Emits a timeout event to the connected socket when the player is
 * inactive for a specified time.
 * 
 * **Events received:**
 * - `disconnect`: Handles the disconnection event of the socket.
 * - `player-ready`: Handles the player readiness event from the socket.
 * - `check-players`: Handles the check players event from the socket.
 * - `fire`: Handles the firing event from the socket.
 * - `fire-reply`: Handles the firing reply event from the socket.
 * 
 * **Functionality:**
 * 1. Find an available player index by iterating through the `connections` array.
 * 2. Emit the player index to the connected socket using the `player-number`
 * event.
 * 3. Log the connection of the player with their index.
 * 4. If no player index is available, return.
 * 5. Set the player's connection status to `false` in the `connections` array.
 * 6. Emit the player index to all other connected sockets using the
 * `player-connection` event.
 * 7. Handle the disconnection event by logging the disconnection and updating the
 * player's connection status in the `connections` array.
 * 8. Emit the player index to all other connected sockets using the
 * `player-connection` event.
 * 9. Handle the player readiness event by updating the player's readiness status
 * in the `connections` array and emitting the player index to all other connected
 * sockets using the `enemy-ready` event.
 * 10. Handle the check players event by creating an array of player objects
 * containing their connection and readiness status, and emitting it to the
 * connected socket using the `check-players` event.
 * 11. Handle the firing event by logging the player index and the target square
 * ID.
 * 12. Emit the target square ID to all other connected sockets using the `fire`
 * event.
 * 13. Handle the firing reply event by logging the target square object.
 * 14. Emit the target square object to all other connected sockets using the
 * `fire-reply` event.
 * 15. Set a timeout for the player's inactivity. After the specified time, emit a
 * timeout event to the connected socket and disconnect the socket.
 */
io.on('connection', socket => {
    let playerIndex = -1;
    for (const i in connections) {
        if (connections[i] === null) {
            playerIndex = i;
            break;
        }
    }

    socket.emit("player-number", playerIndex);

    console.log(`Jugador ${playerIndex} se ha conectado`);

    if (playerIndex === -1) return;
    connections[playerIndex] = false;

    socket.broadcast.emit('player-connection', playerIndex);

    /**
     * This method is used to handle the disconnection of a player in a multiplayer
     * game. It takes no parameters.
     * 
     * When a player disconnects, it logs a message to the console indicating which
     * player has disconnected. It then sets the corresponding element in the
     * `connections` array to `null` to indicate that the player is no longer
     * connected.
     * 
     * Finally, it emits a 'player-connection' event to all connected sockets,
     * broadcasting the index of the disconnected player.
     */
    socket.on('disconnect', () => {
        console.log(`Jugador ${playerIndex} se ha desconectado`);
        connections[playerIndex] = null;
        socket.broadcast.emit('player-connection', playerIndex);
    });

    /**
     * This method is a callback function that takes no parameters. It is responsible
     * for emitting the 'enemy-ready' event to all connected sockets except the
     * current socket. The event is emitted with the playerIndex as the data payload.
     * Additionally, it updates the connections array by setting the value at the
     * playerIndex to true.
     */
    socket.on('player-ready', () => {
        socket.broadcast.emit('enemy-ready', playerIndex);
        connections[playerIndex] = true;
    });

    /**
     * This method is used to check the status of players in a game. It takes no
     * parameters and returns nothing.
     * 
     * The method first initializes an empty array called "players".
     * 
     * Then, it iterates over the "connections" object using a for...in loop.
     * 
     * Inside the loop, it checks if the value of each connection is null. If it is
     * null, it means the player is not connected, so it pushes an object with
     * properties "connected" set to false and "ready" set to false into the "players"
     * array.
     * 
     * If the value of the connection is not null, it means the player is connected and
     * ready, so it pushes an object with properties "connected" set to true and
     * "ready" set to the value of the connection into the "players" array.
     * 
     * Finally, it emits an event called "check-players" through the "socket" object,
     * passing the "players" array as the data.
     */
    socket.on('check-players', () => {
        const players = [];
        for (const i in connections) {
            connections[i] === null ? 
                players.push({connected: false, ready: false}) : 
                players.push({connected: true, ready: connections[i]});
        }
        socket.emit('check-players', players);
    });

    /**
     * The `id` function is used to handle the firing action of a player in a game. It
     * takes in a `playerIndex` parameter and logs a message indicating the player who
     * fired. It then emits a 'fire' event to all connected sockets except the one
     * that triggered the action.
     */
    socket.on('fire', id => {
        console.log(`Disparo de ${playerIndex}`, id);
        socket.broadcast.emit('fire', id);
    });

    /**
     * The `square` method is used to calculate the square of a given number. It takes
     * no parameters and returns the square of the number. The result is then emitted
     * to all connected sockets using the `fire-reply` event.
     */
    socket.on('fire-reply', square =>{
        console.log(square);
        socket.broadcast.emit('fire-reply', square);
    });

    /**
     * This method is used to handle a timeout event for a player. It performs the
     * following actions:
     * 
     * 1. Sets the connection for the specified player index to null.
     * 2. Emits a 'timeout' event to the socket.
     * 3. Disconnects the socket.
     */
    setTimeout(() => {
        connections[playerIndex] = null;
        socket.emit('timeout');
        socket.disconnect();
    }, 600000);

});

