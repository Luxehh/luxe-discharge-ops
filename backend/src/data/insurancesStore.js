const insuranceTypesStore = require('./insuranceTypesStore')
const { LOCATIONS } = require('./usersStore')

let nextId = 22

let insurances = [
  { id: '1', location: 'Illinois', name: 'Aetna', typeId: '1' },
  { id: '2', location: 'Illinois', name: 'Medicare', typeId: '2' },
  { id: '3', location: 'Illinois', name: 'BCBS Commercial', typeId: '1' },
  { id: '4', location: 'Illinois', name: 'MMAI', typeId: '3' },
  { id: '5', location: 'Illinois', name: 'BCBS MCR', typeId: '2' },
  { id: '6', location: 'Indiana', name: 'Aetna', typeId: '1' },
  { id: '7', location: 'Indiana', name: 'Humana', typeId: '1' },
  { id: '8', location: 'Indiana', name: 'United HC', typeId: '1' },
  { id: '9', location: 'Indiana', name: 'Medicare', typeId: '2' },
  { id: '10', location: 'Indiana', name: 'Other', typeId: '3' },
  { id: '11', location: 'Missouri', name: 'Aetna', typeId: '1' },
  { id: '12', location: 'Missouri', name: 'Humana', typeId: '1' },
  { id: '13', location: 'Missouri', name: 'United HC', typeId: '1' },
  { id: '14', location: 'Missouri', name: 'Medicare', typeId: '2' },
  { id: '15', location: 'Missouri', name: 'Other', typeId: '3' },
  { id: '16', location: 'Oklahoma', name: 'SoonerCare', typeId: '3' },
  { id: '17', location: 'Oklahoma', name: 'BCBS OK', typeId: '1' },
  { id: '18', location: 'Oklahoma', name: 'Humana', typeId: '1' },
  { id: '19', location: 'Oklahoma', name: 'United HC', typeId: '1' },
  { id: '20', location: 'Oklahoma', name: 'Medicare', typeId: '2' },
  { id: '21', location: 'Oklahoma', name: 'Other', typeId: '3' },
]

function format(insurance) {
  const type = insuranceTypesStore.getById(insurance.typeId)
  return {
    id: insurance.id || String(insurance._id),
    location: insurance.location,
    name: insurance.name,
    typeId: insurance.typeId,
    typeName: type?.name || '',
    typeColor: type?.color || 'green',
  }
}

function getAll() {
  return insurances.map(format)
}

function getById(id) {
  const insurance = insurances.find((i) => i.id === String(id))
  return insurance ? format(insurance) : null
}

function create({ location, name, typeId }) {
  const trimmed = name?.trim()
  if (!trimmed) {
    const err = new Error('Insurance name is required')
    err.status = 400
    throw err
  }

  if (!location || !LOCATIONS.includes(location)) {
    const err = new Error('Valid location is required')
    err.status = 400
    throw err
  }

  if (!typeId || !insuranceTypesStore.getById(typeId)) {
    const err = new Error('Valid insurance type is required')
    err.status = 400
    throw err
  }

  const exists = insurances.some(
    (i) =>
      i.location === location &&
      i.name.toLowerCase() === trimmed.toLowerCase()
  )
  if (exists) {
    const err = new Error('Insurance already exists for this location')
    err.status = 400
    throw err
  }

  const insurance = {
    id: String(nextId++),
    location,
    name: trimmed,
    typeId: String(typeId),
  }
  insurances.push(insurance)
  return format(insurance)
}

function update(id, { location, name, typeId }) {
  const index = insurances.findIndex((i) => i.id === String(id))
  if (index === -1) {
    const err = new Error('Insurance not found')
    err.status = 404
    throw err
  }

  const trimmed = name?.trim()
  if (!trimmed) {
    const err = new Error('Insurance name is required')
    err.status = 400
    throw err
  }

  if (!location || !LOCATIONS.includes(location)) {
    const err = new Error('Valid location is required')
    err.status = 400
    throw err
  }

  if (!typeId || !insuranceTypesStore.getById(typeId)) {
    const err = new Error('Valid insurance type is required')
    err.status = 400
    throw err
  }

  const exists = insurances.some(
    (i) =>
      i.id !== String(id) &&
      i.location === location &&
      i.name.toLowerCase() === trimmed.toLowerCase()
  )
  if (exists) {
    const err = new Error('Insurance already exists for this location')
    err.status = 400
    throw err
  }

  insurances[index] = {
    ...insurances[index],
    location,
    name: trimmed,
    typeId: String(typeId),
  }
  return format(insurances[index])
}

function remove(id) {
  const index = insurances.findIndex((i) => i.id === String(id))
  if (index === -1) {
    const err = new Error('Insurance not found')
    err.status = 404
    throw err
  }

  const [removed] = insurances.splice(index, 1)
  return format(removed)
}

function countByType(typeId) {
  return insurances.filter((i) => i.typeId === String(typeId)).length
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  countByType,
  format,
  LOCATIONS,
}
