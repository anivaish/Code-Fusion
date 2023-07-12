require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const http = require('http');
const path = require('path');
const bodyP = require('body-parser');
var compiler = require('compilex');
const { Server } = require('socket.io');
const ACTIONS = require('./src/Actions');


const corsOptions = {
    origin: process.env.ALLOWED_CLIENTS.split(',')
}
app.use(cors(corsOptions));

const server = http.createServer(app);
const io = new Server(server);


var options = { stats: true }; //prints stats on console 
compiler.init(options);

app.use(bodyP.json());
app.use("node_modules/codemirror", express.static("C:/Users/Aniruddh Vaish/Desktop/Project-CodeFusion/codefusion/node_modules/codemirror"));

app.get("/", function (req, res) {
    res.sendFile("C:/Users/Aniruddh Vaish/Desktop/Project-CodeFusion/codefusion/node_modules/codemirror")
})

app.post("/compile", function (req, res) {
    let code = req.body.code;
    let input = req.body.input;
    let lang = req.body.lang;
    try {

        if (lang === "C" || lang === "Cpp") {
            var envData = { OS: "windows", cmd: "g++" }; // (uses g++ command to compile )
            compiler.compileCPPWithInput(envData, code, input, function (data) {
                if (data.output) {
                    res.send(data);
                }
                else {
                    res.send("Error, Please check your program.");
                }
            });
        }
        else if (lang === "Java") {
            var envData = { OS: "windows" }; // (Support for Linux in Next version)
            compiler.compileJavaWithInput(envData, code, input, function (data) {
                if (data.output) {
                    res.send(data);
                }
                else {
                    res.send("Error, Please check your program.");
                }
            });
        }
        else if (lang === "Python") {
            var envData = { OS: "windows" };
            compiler.compilePython(envData, code, function (data) {
                if (data.output) {
                    res.send(data);
                }
                else {
                    res.send("Error, Please check your program.");
                }
            });
        }

    } catch (error) {
        console.log("Error Detected");
    }
})

app.use(express.static('build'));
app.use((req, res, next) => {
    console.log(res);
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const userSocketMap = {};
function getAllConnectedClients(roomId) {
    // Map
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            return {
                socketId,
                username: userSocketMap[socketId],
            };
        }
    );
}

io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);
        const clients = getAllConnectedClients(roomId);
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
            });
        });
    });

    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
        });
        delete userSocketMap[socket.id];
        socket.leave();
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
