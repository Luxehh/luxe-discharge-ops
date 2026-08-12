const categoriesStore = require('./categoriesStore')

let nextId = 7

let reasons = [
  { id: '1', name: 'Out of Network', categoryId: '1' },
  { id: '2', name: 'Out of Network / Staffing', categoryId: '1' },
  { id: '3', name: 'Advocate at Home (PAN)', categoryId: '2' },
  { id: '4', name: 'DULY ACO', categoryId: '2' },
  { id: '5', name: 'Staffing Unavailable', categoryId: '3' },
  { id: '6', name: 'Distance Too Far', categoryId: '3' },
]

function format(reason) {
  const category = categoriesStore.getById(reason.categoryId)
  return {
    id: reason.id || String(reason._id),
    name: reason.name,
    categoryId: reason.categoryId,
    categoryName: category?.name || '',
  }
}

function getAll() {
  return reasons.map(format)
}

function getById(id) {
  const reason = reasons.find((r) => r.id === String(id))
  return reason ? format(reason) : null
}

function create({ name, categoryId }) {
  const trimmed = name?.trim()
  if (!trimmed) {
    const err = new Error('Reason name is required')
    err.status = 400
    throw err
  }

  if (!categoryId || !categoriesStore.getById(categoryId)) {
    const err = new Error('Valid category is required')
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
    categoryId: String(categoryId),
  }
  reasons.push(reason)
  return format(reason)
}

function update(id, { name, categoryId }) {
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

  if (!categoryId || !categoriesStore.getById(categoryId)) {
    const err = new Error('Valid category is required')
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
    categoryId: String(categoryId),
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

  const [removed] = reasons.splice(index, 1)
  return format(removed)
}

function countByCategory(categoryId) {
  return reasons.filter((r) => r.categoryId === String(categoryId)).length
}

function clearCategory(categoryId) {
  reasons = reasons.filter((r) => r.categoryId !== String(categoryId))
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  countByCategory,
  clearCategory,
  format,
}
