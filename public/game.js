const socket = io("/room")

function renderPlayerList(players) {
    const playerNames = document.querySelectorAll(".player-name")
    for (let i = 0; i < playerNames.length; i++) {
        playerNames[i].textContent = players[i]
    }
}

document.querySelector("#start-button").addEventListener("click", function() {
    socket.emit("start request")
})

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
    console.log("Game has started")
})

socket.on("your turn", () => {
    
})
