const socket = io("/")
const rooms = document.querySelector("#room-list")

socket.on("room list", serverRoomList => {
  let newRoomList = []
  for (const room of Object.values(serverRoomList)) {
    const entry = document.querySelector("#room-entry-t").content.cloneNode(true)
    entry.querySelector(".room-occupancy").textContent = `${room.players.length}/${room.maxPlayers}`
    entry.querySelector(".room-name").textContent = room.name
    const link = entry.querySelector(".room-url")
    link.href = `/room/${room.id}`
    if (room.players.length >= room.maxPlayers)
      link.classList.add("disabled-url")
    newRoomList.push(entry)
  }
  rooms.replaceChildren(...newRoomList)
})
