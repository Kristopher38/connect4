export class GameFSM {
    constructor(room, socket) {
        this.room = room
        this.roomSocket = socket
    }


    async start() { 
        this.playerSockets = await this.roomSocket.fetchSockets()
        this.roomSocket.emit("start")
        this.turn(0)
    }

    turn(player) {
        this.playerSockets[player].emit("your turn")
        
        if (winCondition) {}
    }
}
