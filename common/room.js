export class Room {
    #id
    constructor(name, players, maxPlayers, id) {
      this.name = name
      this.players = players
      this.maxPlayers = maxPlayers
      this.id = id
    }
}
