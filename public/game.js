const socket = io("/room")

const discStyles = ["d-red", "d-yellow"]
let ourPlayerIdx = 0
let board = [
    [-1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1],
]

function renderPlayerList(players) {
    const playerNames = document.querySelectorAll(".player-name")
    for (let i = 0; i < playerNames.length; i++) {
        playerNames[i].textContent = players[i]
    }
}

function highlightPlayer(playerIdx) {

}

function renderBoard(board) {

}

document.querySelector("#start-button").addEventListener("click", function() {
    socket.emit("start request")
})

document.querySelectorAll(".column").forEach((column, colIdx) => {
    const topmost = board[colIdx].findIndex(v => v == -1)
    if (topmost > -1) {
        const childIdx = 5 - topmost
        column.addEventListener("mouseenter", ev => {
            column.children[childIdx].classList.add("disc", "ghost", discStyles[ourPlayerIdx])
        })
        column.addEventListener("mouseleave", ev => {
            if (board[colIdx][childIdx] === -1)
                column.children[childIdx].classList.remove("disc", discStyles[ourPlayerIdx])
            column.children[childIdx].classList.remove("ghost")
        })
        column.addEventListener("click", ev => {
            socket.emit("move", colIdx)
        })
    }
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

socket.on("start", yourPlayerIdx => {
    console.log("Game has started")
    ourPlayerIdx = yourPlayerIdx
})

socket.on("your turn", () => {
    console.log("It's your turn")
})

socket.on("game update", (newBoard, currentPlayerIdx) => {
    board = newBoard
    renderBoard(board)
    highlightPlayer(currentPlayerIdx)
})

socket.on("finished", winnerIdx => {
    console.log(`Game finished, player ${winnerIdx} won`)
})