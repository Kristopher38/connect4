const socket = io("/room")

socket.on("connect", async () => {
    let room = await socket.emitWithAck("join", roomID, nick)
    if (room.status === "ok")
        console.log(room)
    else if (room.status === "fail")
        console.log("failed connecting to room")
})
