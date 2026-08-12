const LOCATIONS = ['Illinois', 'Indiana', 'Missouri', 'Oklahoma']

let nextId = 6

let users = [
  {
    id: '1',
    email: 'admin@rms.com',
    password: 'Admin@123',
    name: 'Super Admin',
    role: 'super_admin',
    location: null,
  },
  {
    id: '2',
    email: 'illinois@rms.com',
    password: 'Illinois@123',
    name: 'Illinois Admin',
    role: 'location_admin',
    location: 'Illinois',
  },
  {
    id: '3',
    email: 'indiana@rms.com',
    password: 'Indiana@123',
    name: 'Indiana Admin',
    role: 'location_admin',
    location: 'Indiana',
  },
  {
    id: '4',
    email: 'missouri@rms.com',
    password: 'Missouri@123',
    name: 'Missouri Admin',
    role: 'location_admin',
    location: 'Missouri',
  },
  {
    id: '5',
    email: 'oklahoma@rms.com',
    password: 'Oklahoma@123',
    name: 'Oklahoma Admin',
    role: 'location_admin',
    location: 'Oklahoma',
  },
]

function toPublic(user) {
  return {
    id: user.id || String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    location: user.location,
    password: user.password,
  }
}

function getAll() {
  return users.map(toPublic)
}

function getById(id) {
  const user = users.find((u) => u.id === String(id))
  return user ? toPublic(user) : null
}

function getByEmail(email) {
  return users.find((u) => u.email === email.toLowerCase().trim()) || null
}

function create({ name, email, password, location }) {
  const normalizedEmail = email.toLowerCase().trim()

  if (getByEmail(normalizedEmail)) {
    const err = new Error('Email already exists')
    err.status = 400
    throw err
  }

  if (!LOCATIONS.includes(location)) {
    const err = new Error('Invalid location')
    err.status = 400
    throw err
  }

  const user = {
    id: String(nextId++),
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: 'location_admin',
    location,
  }

  users.push(user)
  return toPublic(user)
}

function update(id, { name, email, password, location }) {
  const index = users.findIndex((u) => u.id === String(id))
  if (index === -1) {
    const err = new Error('Login not found')
    err.status = 404
    throw err
  }

  const current = users[index]
  const normalizedEmail = email.toLowerCase().trim()
  const existing = getByEmail(normalizedEmail)

  if (existing && existing.id !== current.id) {
    const err = new Error('Email already exists')
    err.status = 400
    throw err
  }

  if (current.role === 'super_admin') {
    users[index] = {
      ...current,
      name: name.trim(),
      email: normalizedEmail,
      password,
      location: null,
    }
  } else {
    if (!LOCATIONS.includes(location)) {
      const err = new Error('Invalid location')
      err.status = 400
      throw err
    }

    users[index] = {
      ...current,
      name: name.trim(),
      email: normalizedEmail,
      password,
      location,
    }
  }

  return toPublic(users[index])
}

function remove(id) {
  const index = users.findIndex((u) => u.id === String(id))
  if (index === -1) {
    const err = new Error('Login not found')
    err.status = 404
    throw err
  }

  if (users[index].role === 'super_admin') {
    const err = new Error('Super Admin cannot be deleted')
    err.status = 400
    throw err
  }

  const [removed] = users.splice(index, 1)
  return toPublic(removed)
}

module.exports = {
  LOCATIONS,
  getAll,
  getById,
  getByEmail,
  create,
  update,
  remove,
  toPublic,
}
