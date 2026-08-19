let nextId = 7
let reasons = [
  { id: '1', name: 'Out of Network' },
  { id: '2', name: 'Out of Network / Staffing' },
  { id: '3', name: 'Advocate at Home (PAN)' },
  { id: '4', name: 'DULY ACO' },
  { id: '5', name: 'Staffing Unavailable' },
  { id: '6', name: 'Distance Too Far' },
]

function format(reason) {
  return {
    id: reason.id || String(reason._id),
    name: reason.name,
  }
}

function getAll() {
  return reasons.map(format).sort((a, b) => a.name.localeCompare(b.name))
}

function create({ name }) {
  const trimmed = name?.trim()
  if (!trimmed) {
    const err = new Error('Reason name is required')
    err.status = 400
    throw err
  }

  const exists = reasons.some(
    (r) => r.name.toLowerCase() === trimmed.toLowerCase()
  )
  if (exists) {
    const err = new Error('Reason already exists')
    err.status = 400
    throw err
  }

  const reason = {
    id: String(nextId++),
    name: trimmed,
  }
  reasons.push(reason)
  return format(reason)
}

function update(id, { name }) {
  const index = reasons.findIndex((r) => r.id === String(id))
  if (index === -1) {
    const err = new Error('Reason not found')
    err.status = 404
    throw err
  }

  const trimmed = name?.trim()
  if (!trimmed) {
    const err = new Error('Reason name is required')
    err.status = 400
    throw err
  }

  const exists = reasons.some(
    (r) =>
      r.id !== String(id) && r.name.toLowerCase() === trimmed.toLowerCase()
  )
  if (exists) {
    const err = new Error('Reason already exists')
    err.status = 400
    throw err
  }

  reasons[index] = {
    ...reasons[index],
    name: trimmed,
  }
  return format(reasons[index])
}

function remove(id) {
  const index = reasons.findIndex((r) => r.id === String(id))
  if (index === -1) {
    const err = new Error('Reason not found')
    err.status = 404
    throw err
  }
  reasons.splice(index, 1)
}

module.exports = {
  getAll,
  create,
  update,
  remove,
}
