const socket = io("/room")

function renderPlayerList(players) {
    const playerNames = document.querySelectorAll(".player-name")
    for (let i = 0; i < playerNames.length; i++) {
        playerNames[i].textContent = players[i]
    }
}

socket.on("connect", async () => {
    let resp = await socket.emitWithAck("join")
    if (resp.status === "ok")
        renderPlayerList(resp.room.players)
    else if (resp.status === "fail")
        console.log("failed connecting to room")
})

socket.on("room update", room => {
    renderPlayerList(room.players)
})

socket.on("start", () => {
    
})

socket.on("your turn", () => {
    
})
