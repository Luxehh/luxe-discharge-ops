let connected = false

function setConnected(value) {
  connected = value
}

function isConnected() {
  return connected
}

module.exports = { setConnected, isConnected }
