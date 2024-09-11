const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

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
            <title>1-on-1 Chat with Settings</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f0f0f0;
                    display: flex;
                }

                .settings-tab {
                    width: 25%;
                    background-color: #333;
                    color: white;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                }

                .settings-tab input, .settings-tab button {
                    margin: 10px 0;
                    padding: 10px;
                    width: 90%;
                    border-radius: 5px;
                    border: none;
                }

                .settings-tab button {
                    background-color: #4CAF50;
                    color: white;
                    cursor: pointer;
                }

                .settings-tab button:hover {
                    background-color: #45a049;
                }

                .chat-container {
                    width: 75%;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                }

                .chat-box {
                    height: 300px;
                    overflow-y: scroll;
                    border: 1px solid #ccc;
                    padding: 10px;
                    margin-bottom: 10px;
                    width: 100%;
                }

                input[type="text"], button {
                    margin: 5px;
                    padding: 8px;
                    border: 1px solid #ccc;
                    border-radius: 3px;
                    width: 100%;
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
            <div class="settings-tab">
                <h2>Settings</h2>
                <input type="text" id="nameInput" placeholder="Enter your name">
                <input type="text" id="tagInput" placeholder="Enter your Tag ID">
                <button onclick="saveSettings()">Save Settings</button>
                <h3>Saved Info</h3>
                <p id="savedInfo"></p>
            </div>

            <div class="chat-container">
                <h1>1-on-1 Chat</h1>
                <input type="text" id="connectTagInput" placeholder="Enter other's Tag ID">
                <button onclick="connect()">Connect</button>
                <div id="chatBox" class="chat-box"></div>
                <input type="text" id="messageInput" placeholder="Type your message...">
                <button onclick="sendMessage()">Send</button>
            </div>

            <script src="/socket.io/socket.io.js"></script>
            <script>
                const socket = io();
                let tagId = '';
                let userName = '';
                let connectedTagId = '';

                // Load saved settings from localStorage when page loads
                window.onload = function() {
                    const savedName = localStorage.getItem('name');
                    const savedTagId = localStorage.getItem('tagId');

                    if (savedName && savedTagId) {
                        userName = savedName;
                        tagId = savedTagId;
                        document.getElementById('nameInput').value = savedName;
                        document.getElementById('tagInput').value = savedTagId;
                        displaySavedInfo();
                    }
                };

                // Save name and Tag ID to localStorage
                function saveSettings() {
                    userName = document.getElementById('nameInput').value.trim();
                    tagId = document.getElementById('tagInput').value.trim();
                    if (userName !== '' && tagId !== '') {
                        localStorage.setItem('name', userName);
                        localStorage.setItem('tagId', tagId);
                        displaySavedInfo();
                    } else {
                        alert('Please enter both a valid name and Tag ID');
                    }
                }

                // Display saved name and Tag ID
                function displaySavedInfo() {
                    const savedInfo = document.getElementById('savedInfo');
                    savedInfo.textContent = \`Name: \${userName}, Tag ID: \${tagId}\`;
                }

                // Connect to another user by Tag ID
                function connect() {
                    connectedTagId = document.getElementById('connectTagInput').value.trim();
                    if (connectedTagId !== '' && userName !== '' && tagId !== '') {
                        socket.emit('connectToTag', { tagId, userName });
                        alert(\`Connected to Tag ID: \${connectedTagId}\`);
                    } else {
                        alert('Please enter a valid Tag ID and save your settings first');
                    }
                }

                // Send message to connected user
                function sendMessage() {
                    const message = document.getElementById('messageInput').value.trim();
                    if (message !== '') {
                        socket.emit('sendMessage', { to: connectedTagId, message, userName });
                        displayMessage(\`You (\${userName}): \${message}\`);
                        document.getElementById('messageInput').value = '';
                    }
                }

                // Receive messages from the server
                socket.on('receiveMessage', data => {
                    displayMessage(\`\${data.sender}: \${data.message}\`);
                });

                // Display a message in the chat box
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
    // When the client connects to a specific tag with their name
    socket.on('connectToTag', ({ tagId, userName }) => {
        tagConnections[tagId] = socket.id;
        socket.userName = userName;
        socket.tagId = tagId;
        socket.join(tagId);
        console.log(`${userName} connected with tag ID: ${tagId}`);
    });

    // When the client sends a message
    socket.on('sendMessage', ({ to, message, userName }) => {
        if (tagConnections[to]) {
            io.to(tagConnections[to]).emit('receiveMessage', { message, sender: userName });
        } else {
            console.log(`Tag ID ${to} not connected`);
        }
    });

    socket.on('disconnect', () => {
        // Handle disconnection if needed
        console.log(`${socket.userName} disconnected from tag ID: ${socket.tagId}`);
        delete tagConnections[socket.tagId];
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

