import express from "express"
import session from "express-session"
import { createServer } from "node:http"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { Server } from "socket.io"

import { Room } from "./common/room.js"

const app = express();
const server = createServer(app);
const io = new Server(server)
const _dirname = dirname(fileURLToPath(import.meta.url))

app.set('etag', false)
app.set('view engine', 'ejs')
app.use(express.static(join(_dirname, "public")))
app.use(express.static(join(_dirname, "common")))
app.use(session({resave: true, saveUninitialized: true, secret: 'qewhiugriasgy'}))
app.use(express.urlencoded({ extended: true }))

let roomList = {}

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
    let roomID = idgen.next()
    roomList[roomID] = new Room(
        req.body.roomName,
        [],
        req.body.maxPlayers,
        roomID,
    )
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

    // TODO: sanitize user input ;)
    res.render(join(_dirname, "board.ejs"), {roomID: roomID, nick: req.session.nick})
})

function refreshRooms(socket) {
    socket.emit("room list", roomList)
}

io.of("/").on("connection", (socket) => {
    refreshRooms(socket)
    setInterval(() => {
        refreshRooms(socket)
    }, 30000);
})

io.of("/room").on("connection", (socket) => {
    socket.on("join", (roomID, nick, cont) => {
        if (roomID in roomList) {
            let room = roomList[roomID]
            room.players.push(nick)
            socket.data.nick = nick
            socket.data.roomID = roomID
            refreshRooms(io)
            socket.join(`${roomID}`)
            cont({status: "ok", room: roomList[roomID]})
        }
        else
            cont({status: "fail"})
    })
    socket.on("disconnect", (reason) => {
        if (socket.data.roomID in roomList) {
            const room = roomList[socket.data.roomID]
            room.players.pop(socket.data.nick)
            refreshRooms(io)
        }
    })
})

server.listen(3000, () => {
    console.log("Server started on http://localhost:3000")
})
