let nextId = 4

let types = [
  { id: '1', name: 'Medicare Advantage Plan', color: 'yellow' },
  { id: '2', name: 'Medicare', color: 'green' },
  { id: '3', name: 'Lots of Insurance & Charity', color: 'red' },
]

function format(type) {
  return {
    id: type.id || String(type._id),
    name: type.name,
    color: type.color || 'green',
  }
}

function getAll() {
  return types.map(format)
}

function getById(id) {
  const type = types.find((t) => t.id === String(id))
  return type ? format(type) : null
}

function create({ name, color }) {
  const trimmed = name?.trim()
  if (!trimmed) {
    const err = new Error('Insurance type name is required')
    err.status = 400
    throw err
  }

  const normalizedColor = ['green', 'yellow', 'red'].includes(color)
    ? color
    : 'green'

  const exists = types.some(
    (t) => t.name.toLowerCase() === trimmed.toLowerCase()
  )
  if (exists) {
    const err = new Error('Insurance type already exists')
    err.status = 400
    throw err
  }

  const type = { id: String(nextId++), name: trimmed, color: normalizedColor }
  types.push(type)
  return format(type)
}

function update(id, { name, color }) {
  const index = types.findIndex((t) => t.id === String(id))
  if (index === -1) {
    const err = new Error('Insurance type not found')
    err.status = 404
    throw err
  }

  const trimmed = name?.trim()
  if (!trimmed) {
    const err = new Error('Insurance type name is required')
    err.status = 400
    throw err
  }

  const normalizedColor = ['green', 'yellow', 'red'].includes(color)
    ? color
    : types[index].color

  const exists = types.some(
    (t) => t.id !== String(id) && t.name.toLowerCase() === trimmed.toLowerCase()
  )
  if (exists) {
    const err = new Error('Insurance type already exists')
    err.status = 400
    throw err
  }

  types[index] = {
    ...types[index],
    name: trimmed,
    color: normalizedColor,
  }
  return format(types[index])
}

function remove(id) {
  const index = types.findIndex((t) => t.id === String(id))
  if (index === -1) {
    const err = new Error('Insurance type not found')
    err.status = 404
    throw err
  }

  const [removed] = types.splice(index, 1)
  return format(removed)
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  format,
}
