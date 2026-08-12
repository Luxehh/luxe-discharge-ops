const { LOCATIONS } = require('./usersStore')

let nextId = 15

let houses = [
  { id: '1', location: 'Illinois', name: 'McHenry', status: 'Active' },
  { id: '2', location: 'Illinois', name: 'Hanover Park', status: 'Active' },
  { id: '3', location: 'Illinois', name: 'Lisle', status: 'Active' },
  { id: '4', location: 'Illinois', name: 'Fox Valley', status: 'Active' },
  { id: '5', location: 'Illinois', name: 'Lake Zurich', status: 'Active' },
  { id: '6', location: 'Indiana', name: 'Chesterton', status: 'Active' },
  { id: '7', location: 'Indiana', name: 'Crown Point', status: 'Active' },
  { id: '8', location: 'Indiana', name: 'South Bend', status: 'Active' },
  { id: '9', location: 'Missouri', name: 'Blue Springs', status: 'Active' },
  { id: '10', location: 'Missouri', name: 'Gladstone', status: 'Active' },
  { id: '11', location: 'Missouri', name: 'Northland', status: 'Active' },
  { id: '12', location: 'Missouri', name: "St. Mary's", status: 'Active' },
  { id: '13', location: 'Oklahoma', name: 'Oklahoma House 1', status: 'Coming Soon' },
  { id: '14', location: 'Oklahoma', name: 'Oklahoma House 2', status: 'Coming Soon' },
]

const STATUSES = ['Active', 'Coming Soon']

function format(house) {
  return {
    id: house.id || String(house._id),
    location: house.location,
    name: house.name,
    status: house.status,
  }
}

function getAll() {
  return houses.map(format)
}

function getById(id) {
  const house = houses.find((h) => h.id === String(id))
  return house ? format(house) : null
}

function create({ location, name, status }) {
  const trimmed = name?.trim()
  if (!trimmed) {
    const err = new Error('House name is required')
    err.status = 400
    throw err
  }

  if (!location || !LOCATIONS.includes(location)) {
    const err = new Error('Valid location is required')
    err.status = 400
    throw err
  }

  const normalizedStatus = STATUSES.includes(status) ? status : 'Active'

  const exists = houses.some(
    (h) =>
      h.location === location &&
      h.name.toLowerCase() === trimmed.toLowerCase()
  )
  if (exists) {
    const err = new Error('House already exists for this location')
    err.status = 400
    throw err
  }

  const house = {
    id: String(nextId++),
    location,
    name: trimmed,
    status: normalizedStatus,
  }
  houses.push(house)
  return format(house)
}

function update(id, { location, name, status }) {
  const index = houses.findIndex((h) => h.id === String(id))
  if (index === -1) {
    const err = new Error('House not found')
    err.status = 404
    throw err
  }

  const trimmed = name?.trim()
  if (!trimmed) {
    const err = new Error('House name is required')
    err.status = 400
    throw err
  }

  if (!location || !LOCATIONS.includes(location)) {
    const err = new Error('Valid location is required')
    err.status = 400
    throw err
  }

  const normalizedStatus = STATUSES.includes(status) ? status : houses[index].status

  const exists = houses.some(
    (h) =>
      h.id !== String(id) &&
      h.location === location &&
      h.name.toLowerCase() === trimmed.toLowerCase()
  )
  if (exists) {
    const err = new Error('House already exists for this location')
    err.status = 400
    throw err
  }

  houses[index] = {
    ...houses[index],
    location,
    name: trimmed,
    status: normalizedStatus,
  }
  return format(houses[index])
}

function remove(id) {
  const index = houses.findIndex((h) => h.id === String(id))
  if (index === -1) {
    const err = new Error('House not found')
    err.status = 404
    throw err
  }

  const [removed] = houses.splice(index, 1)
  return format(removed)
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  format,
  STATUSES,
  LOCATIONS,
}
