const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Store connections, tag IDs, and usernames
let tagConnections = {};
let userNames = {};
let pendingConnections = {};

// Serve static files (HTML, CSS, Client-side JS)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/style.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'style.css'));
});

// Handle socket.io connections
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('setTagId', ({ tagId, userName }) => {
        if (tagConnections[tagId]) {
            socket.emit('error', { message: `Tag ID ${tagId} already in use.` });
            return;
        }

        // Save tag ID and username
        socket.tagId = tagId;
        userNames[socket.id] = userName;
        tagConnections[tagId] = socket.id;

        socket.emit('connectionStatus', { status: `Connected as ${userName} with Tag ID: ${tagId}` });
        console.log(`${userName} connected with tag ID: ${tagId}`);
    });

    socket.on('connectToTag', ({ targetTagId }) => {
        if (tagConnections[targetTagId]) {
            const targetSocketId = tagConnections[targetTagId];
            const targetUserName = userNames[targetSocketId];

            // Save pending connection request
            pendingConnections[socket.id] = targetTagId;

            // Notify the target user about the connection request
            io.to(targetSocketId).emit('connectionRequest', { from: socket.id, fromUserName: userNames[socket.id], fromTagId: socket.tagId });
        } else {
            socket.emit('connectionStatus', { status: `No user with Tag ID ${targetTagId}` });
        }
    });

    socket.on('respondToConnection', ({ fromSocketId, accepted }) => {
        if (accepted) {
            const targetSocketId = fromSocketId;
            const targetUserName = userNames[targetSocketId];

            // Notify both users about the accepted connection
            socket.emit('connectionStatus', { status: `Connected to Tag ID ${pendingConnections[targetSocketId]} (${targetUserName})` });
            io.to(targetSocketId).emit('connectionStatus', { status: `Your connection to ${userNames[socket.id]} has been accepted.` });
            
            // Clear pending connection
            delete pendingConnections[targetSocketId];
        } else {
            // Notify the user that the connection was rejected
            io.to(fromSocketId).emit('connectionStatus', { status: `Your connection request was rejected.` });
            delete pendingConnections[fromSocketId];
        }
    });

    socket.on('sendMessage', ({ to, message }) => {
        const targetSocketId = tagConnections[to];

        if (targetSocketId) {
            io.to(targetSocketId).emit('receiveMessage', { message, from: userNames[socket.id] });
        } else {
            socket.emit('connectionStatus', { status: `Tag ID ${to} not connected` });
        }
    });

    socket.on('disconnect', () => {
        console.log(`${userNames[socket.id]} disconnected from tag ID: ${socket.tagId}`);
        delete tagConnections[socket.tagId];
        delete userNames[socket.id];
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
