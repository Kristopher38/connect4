export class GameFSM {
    constructor(room, socket) {
        this.room = room
        this.roomSocket = socket
        this.board = [
            [-1, -1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1, -1],
        ]
        this.currentPlayer = -1
    }

    _firstFree(colIdx) {
        return this.board[colIdx].findIndex(v => v == -1)
    }

    _colFull(colIdx) {
        return this.board[colIdx][5] !== -1
    }

    _placeDisc(playerIdx, colIdx) {
        this.board[colIdx][this._firstFree(colIdx)] = playerIdx
    }

    _checkWinCondition() {
        // column win check
        for (let start = 0; start < 3; start++) {
            // for every column
            for (let i = 0; i < 7; i++) {
                // select 4 elements from a column
                const slice = this.board[i].slice(start, start+4)
                // check that they're nonempty and identical
                if (slice[0] != -1 && slice.every(v => v == slice[0]))
                    return slice[0]
            }
        }

        for (let start = 0; start < 4; start++) {
            // row win check
            // select 4 columns
            const slice = this.board.slice(start, start+4)
            // for every row in a column
            for (let j = 0; j < 6; j++) {
                // check that they're nonempty and identical
                if (slice[0][j] != -1 && slice.every(col => col[j] == slice[0][j]))
                    return slice[0][j]
            }

            // diagonal win check
            for (let j = 0; j < 3; j++) {
                // for every left-to-right upward diagonal start height check
                // if it's nonempty and all elements identical
                if (slice.every((col, idx) => col[j+idx] == slice[0][j]))
                    return slice[0][j]
                // for every left-to-right downward diagonal start height check
                // if it's nonempty and all elements identical
                if (slice.every((col, idx) => col[j+3-idx] == slice[0][j+3]))
                    return slice[0][j+3]
            }
        }
    }

    async start() { 
        this.playerSockets = await this.roomSocket.fetchSockets()

        // register appropriate handlers for events sent by players
        // once the game has started
        this.playerSockets.forEach((playerSocket, playerIdx) => {
            playerSocket.on("move", colIdx => this.move(playerIdx, colIdx))
            playerSocket.emit("start", playerIdx)
        })

        this.turn(0)
    }

    move(playerIdx, colIdx) {
        if (this.currentPlayer === playerIdx && !this._colFull(colIdx)) {
            const nextPlayerIdx = (playerIdx + 1) % this.room.players.length
            this._placeDisc(playerIdx, colIdx)
            this.roomSocket.emit("game update", this.board, nextPlayerIdx)

            const winner = this._checkWinCondition()
            if (winner > -1)
                this.end(winner)
            else
                this.turn(nextPlayerIdx)
        }
    }

    end(winnerIdx) {
        this.roomSocket.emit("finished", winnerIdx)
        this.playerSockets.forEach(playerSocket => playerSocket.off("move", playerSocket.listeners("move")[0]))
    }

    turn(playerIdx) {
        this.currentPlayer = playerIdx
        this.playerSockets[playerIdx].emit("your turn")
    }
}
