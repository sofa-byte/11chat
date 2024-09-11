const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

// Create an Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve the HTML, CSS, and JavaScript directly
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>1-on-1 Chat</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    background-color: #f0f0f0;
                }

                .container {
                    text-align: center;
                    background-color: #fff;
                    padding: 20px;
                    border-radius: 5px;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    width: 300px;
                }

                .chat-box {
                    height: 200px;
                    overflow-y: scroll;
                    border: 1px solid #ccc;
                    padding: 10px;
                    margin-bottom: 10px;
                }

                input[type="text"], button {
                    margin: 5px;
                    padding: 8px;
                    border: 1px solid #ccc;
                    border-radius: 3px;
                }

                button {
                    cursor: pointer;
                    background-color: #4CAF50;
                    color: white;
                    border: none;
                }

                button:hover {
                    background-color: #45a049;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>1-on-1 Chat</h1>
                <input type="text" id="tagInput" placeholder="Enter Tag ID">
                <button onclick="connect()">Connect</button>
                <div id="chatBox" class="chat-box"></div>
                <input type="text" id="messageInput" placeholder="Type your message...">
                <button onclick="sendMessage()">Send</button>
            </div>

            <script src="/socket.io/socket.io.js"></script>
            <script>
                const socket = io();

                let tagId;

                function connect() {
                    tagId = document.getElementById('tagInput').value.trim();
                    if (tagId !== '') {
                        socket.emit('connectToTag', tagId);
                    } else {
                        alert('Please enter a valid Tag ID');
                    }
                }

                function sendMessage() {
                    const message = document.getElementById('messageInput').value.trim();
                    if (message !== '') {
                        socket.emit('sendMessage', { to: tagId, message });
                        displayMessage(\`You: \${message}\`);
                        document.getElementById('messageInput').value = '';
                    }
                }

                socket.on('receiveMessage', data => {
                    displayMessage(\`Stranger: \${data.message}\`);
                });

                function displayMessage(message) {
                    const chatBox = document.getElementById('chatBox');
                    const messageElement = document.createElement('div');
                    messageElement.textContent = message;
                    chatBox.appendChild(messageElement);
                    chatBox.scrollTop = chatBox.scrollHeight;
                }
            </script>
        </body>
        </html>
    `);
});

const tagConnections = {};

io.on('connection', socket => {
    socket.on('connectToTag', tagId => {
        tagConnections[tagId] = socket.id;
        socket.join(tagId);
        console.log(`User connected with tag ID: ${tagId}`);
    });

    socket.on('sendMessage', data => {
        const { to, message } = data;
        if (tagConnections[to]) {
            io.to(tagConnections[to]).emit('receiveMessage', { message });
        } else {
            console.log(`Tag ID ${to} not connected`);
        }
    });

    socket.on('disconnect', () => {
        // Handle disconnection if needed
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
