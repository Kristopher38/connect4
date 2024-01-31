import express from "express"
import session from "express-session"
import { createServer } from "node:http"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { Server } from "socket.io"

import { Room } from "./common/room.js"
import { GameFSM } from "./game-fsm.js"

const app = express();
const server = createServer(app);
const io = new Server(server)
const _dirname = dirname(fileURLToPath(import.meta.url))

let sessionMiddleware = session({resave: true, saveUninitialized: true, secret: 'qewhiugriasgy'})

app.set('etag', false)
app.set('view engine', 'ejs')
app.use(express.static(join(_dirname, "public")))
app.use(express.static(join(_dirname, "common")))
app.use(sessionMiddleware)
app.use(express.urlencoded({ extended: true }))

io.engine.use(sessionMiddleware)

let roomList = {}
let games = {}

class IDGenerator {
    constructor() {
        this.state = 0
    }

    next() {
        this.state += 1;
        return this.state - 1;
    }
}

let idgen = new IDGenerator();


app.get("/", (req, res) => {
    res.render(join(_dirname, "login.ejs"))
})

app.post("/anon-login", (req, res) => {
    req.session.nick = req.body.username
    res.redirect("/rooms")
})

app.get("/rooms", (req, res) => {
    if (!req.session.nick)
        res.redirect("/")

    res.render(join(_dirname, "rooms.ejs"), {nick: req.session.nick})
})

app.post("/newroom", (req, res) => {
    const roomID = idgen.next()
    const room = new Room(
        req.body.roomName,
        [],
        req.body.maxPlayers,
        roomID,
    )
    roomList[roomID] = room
    games[roomID] = new GameFSM(room, io.of("/room").to(`${roomID}`))
    io.emit("room list", roomList)
    res.redirect(`/room/${roomID}`)
})

app.get("/room/:roomID", (req, res) => {
    if (!req.session.nick)
        res.redirect("/")

    const roomID = req.params.roomID
    if (!(roomID in roomList))
        res.redirect("/rooms")

    const room = roomList[roomID]
    if (room.players.length >= room.maxPlayers)
        res.redirect("/rooms")

    req.session.roomID = roomID
    res.render(join(_dirname, "board.ejs"), {room: room})
})

function refreshRooms(socket) {
    socket.emit("room list", roomList)
}

function updateRoom(socket, room) {
    socket.to(`${room.id}`).emit("room update", room)
}

io.of("/").on("connection", (socket) => {
    refreshRooms(socket)
    setInterval(() => {
        refreshRooms(socket)
    }, 30000);
})

io.of("/room").on("connection", (socket) => {
    socket.on("join", (cont) => {
        const session = socket.request.session
        const roomID = session.roomID
        const nick = session.nick
        console.log(`Player "${nick}" connected to room ${roomID}`)
        if (roomID in roomList) {
            let room = roomList[roomID]
            let game = games[roomID];
            if (nick in room.players)
                return // player already joined this room
            room.players.push(nick)
            // TODO: deduplicate with socket.request.session
            socket.data.nick = nick
            socket.data.roomID = roomID
            socket.join(`${roomID}`)
            updateRoom(socket, room)
            refreshRooms(io)
            // install handler only if successfully connected
            // this doesn't leak memory as handler will only be
            // installed once per socket
            socket.on("start request", async () => {
                if (socket.data.nick != room.players[0])
                    return // ignore requests from non-admin

                if (room.players.length >= 2)
                    await game.start()
            })
            cont({status: "ok", room: room})
        }
        else
            cont({status: "fail"})
    })
     
    socket.on("disconnect", (reason) => {
        console.log(`Player "${socket.data.nick}" disconnected from room ${socket.data.roomID}`)
        if (socket.data.roomID in roomList) {
            const room = roomList[socket.data.roomID]
            room.players = room.players.filter(x => x !== socket.data.nick)
            if (room.players.length == 0) {
                delete roomList[socket.data.roomID]
                delete games[socket.data.roomID]
            }
            updateRoom(socket, room)
            refreshRooms(io)
        }
    })
})

server.listen(3000, () => {
    console.log("Server started on http://localhost:3000")
})
