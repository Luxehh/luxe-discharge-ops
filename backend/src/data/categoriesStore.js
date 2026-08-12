let nextId = 4

let categories = [
  { id: '1', name: 'Out of Network' },
  { id: '2', name: 'ACO' },
  { id: '3', name: 'Out of Coverage' },
]

function format(category) {
  return {
    id: category.id || String(category._id),
    name: category.name,
  }
}

function getAll() {
  return categories.map(format)
}

function getById(id) {
  const category = categories.find((c) => c.id === String(id))
  return category ? format(category) : null
}

function create({ name }) {
  const trimmed = name?.trim()
  if (!trimmed) {
    const err = new Error('Category name is required')
    err.status = 400
    throw err
  }

  const exists = categories.some(
    (c) => c.name.toLowerCase() === trimmed.toLowerCase()
  )
  if (exists) {
    const err = new Error('Category already exists')
    err.status = 400
    throw err
  }

  const category = { id: String(nextId++), name: trimmed }
  categories.push(category)
  return format(category)
}

function update(id, { name }) {
  const index = categories.findIndex((c) => c.id === String(id))
  if (index === -1) {
    const err = new Error('Category not found')
    err.status = 404
    throw err
  }

  const trimmed = name?.trim()
  if (!trimmed) {
    const err = new Error('Category name is required')
    err.status = 400
    throw err
  }

  const exists = categories.some(
    (c) => c.id !== String(id) && c.name.toLowerCase() === trimmed.toLowerCase()
  )
  if (exists) {
    const err = new Error('Category already exists')
    err.status = 400
    throw err
  }

  categories[index] = { ...categories[index], name: trimmed }
  return format(categories[index])
}

function remove(id) {
  const index = categories.findIndex((c) => c.id === String(id))
  if (index === -1) {
    const err = new Error('Category not found')
    err.status = 404
    throw err
  }

  const [removed] = categories.splice(index, 1)
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
