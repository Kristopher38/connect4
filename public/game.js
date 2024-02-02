const socket = io("/room")

const discStyles = ["d-red", "d-yellow"]
const LAST_ROW = 5
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

function highlightPlayer(playerIdx, isWinner) {
    let playerSlots = document.querySelectorAll(".player-slot")
    Array.from(playerSlots).forEach(slot => {
        slot.classList.remove("player-highlight", "player-winner")
    })
    const className = isWinner ? "player-winner" : "player-highlight"
    if (playerIdx > -1)
        playerSlots[playerIdx].classList.add(className)
}

function renderBoard(board) {
    Array.from(document.querySelector(".board").children).forEach((column, colIdx) => {
        Array.from(column.children).forEach((space, rowIdx) => {
            const disc = board[colIdx][5-rowIdx]
            space.classList.remove("disc", "ghost", ...discStyles)
            if (disc > -1)
                space.classList.add("disc", discStyles[disc])
        })
    })
}

function firstFree(colIdx) {
    return board[colIdx].findIndex(v => v === -1)
}

document.querySelector("#start-button").addEventListener("click", function() {
    socket.emit("start request")
})

document.querySelectorAll(".column").forEach((column, colIdx) => {
    column.addEventListener("mouseenter", ev => {
        const freeIdx = firstFree(colIdx)
        if (freeIdx > -1)
            column.children[LAST_ROW - freeIdx].classList.add("disc", "ghost", discStyles[ourPlayerIdx])
    })
    column.addEventListener("mouseleave", ev => {
        const freeIdx = firstFree(colIdx)
        if (board[colIdx][freeIdx] === -1)
            column.children[LAST_ROW - freeIdx].classList.remove("disc", discStyles[ourPlayerIdx])
        if (freeIdx > -1)
            column.children[LAST_ROW - freeIdx].classList.remove("ghost")
    })
    column.addEventListener("click", ev => {
        const freeIdx = firstFree(colIdx)
        if (freeIdx > -1)
            socket.emit("move", colIdx)
    })
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
    highlightPlayer(currentPlayerIdx, false)
})

socket.on("finished", winnerIdx => {
    console.log(`Game finished, player ${winnerIdx} won`)
    highlightPlayer(winnerIdx, true)
})