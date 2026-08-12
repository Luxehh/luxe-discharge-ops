const express = require('express')
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const usersStore = require('../data/usersStore')
const { authMiddleware, requireSuperAdmin } = require('../middleware/auth')

const router = express.Router()

router.use(authMiddleware, requireSuperAdmin)

function getDbFlag() {
  return !!require('../db').isConnected()
}

function mapRole(role) {
  return role === 'super_admin' ? 'Super Admin' : 'Sub Admin'
}

function formatLogin(user) {
  return {
    id: user.id || String(user._id),
    name: user.name,
    role: mapRole(user.role),
    roleKey: user.role,
    location: user.location || null,
    email: user.email,
    password: user.passwordPlain || user.password,
  }
}

router.get('/', async (_req, res) => {
  try {
    if (getDbFlag()) {
      const users = await User.find().sort({ createdAt: 1 })
      return res.json({
        logins: users.map((u) =>
          formatLogin({
            ...u.toObject(),
            password: u.passwordPlain || '********',
          })
        ),
        locations: usersStore.LOCATIONS,
      })
    }

    res.json({
      logins: usersStore.getAll().map(formatLogin),
      locations: usersStore.LOCATIONS,
    })
  } catch (error) {
    console.error('List logins error:', error)
    res.status(500).json({ message: 'Failed to load logins' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, email, password, location } = req.body

    if (!name?.trim() || !email?.trim() || !password || !location) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    if (getDbFlag()) {
      const exists = await User.findOne({ email: email.toLowerCase().trim() })
      if (exists) {
        return res.status(400).json({ message: 'Email already exists' })
      }

      if (!usersStore.LOCATIONS.includes(location)) {
        return res.status(400).json({ message: 'Invalid location' })
      }

      const hashed = await bcrypt.hash(password, 10)
      const user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashed,
        passwordPlain: password,
        role: 'location_admin',
        location,
      })

      return res.status(201).json({ login: formatLogin({ ...user.toObject(), password }) })
    }

    const login = usersStore.create({ name, email, password, location })
    res.status(201).json({ login: formatLogin(login) })
  } catch (error) {
    const status = error.status || 500
    res.status(status).json({ message: error.message || 'Failed to create login' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { name, email, password, location } = req.body

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' })
    }

    if (getDbFlag()) {
      const user = await User.findById(req.params.id)
      if (!user) {
        return res.status(404).json({ message: 'Login not found' })
      }

      const normalizedEmail = email.toLowerCase().trim()
      const existing = await User.findOne({ email: normalizedEmail })
      if (existing && String(existing._id) !== String(user._id)) {
        return res.status(400).json({ message: 'Email already exists' })
      }

      user.name = name.trim()
      user.email = normalizedEmail
      user.password = await bcrypt.hash(password, 10)
      user.passwordPlain = password

      if (user.role !== 'super_admin') {
        if (!location || !usersStore.LOCATIONS.includes(location)) {
          return res.status(400).json({ message: 'Invalid location' })
        }
        user.location = location
      } else {
        user.location = null
      }

      await user.save()
      return res.json({ login: formatLogin({ ...user.toObject(), password }) })
    }

    const login = usersStore.update(req.params.id, { name, email, password, location })
    res.json({ login: formatLogin(login) })
  } catch (error) {
    const status = error.status || 500
    res.status(status).json({ message: error.message || 'Failed to update login' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    if (getDbFlag()) {
      const user = await User.findById(req.params.id)
      if (!user) {
        return res.status(404).json({ message: 'Login not found' })
      }
      if (user.role === 'super_admin') {
        return res.status(400).json({ message: 'Super Admin cannot be deleted' })
      }
      await user.deleteOne()
      return res.json({ message: 'Login deleted' })
    }

    usersStore.remove(req.params.id)
    res.json({ message: 'Login deleted' })
  } catch (error) {
    const status = error.status || 500
    res.status(status).json({ message: error.message || 'Failed to delete login' })
  }
})

module.exports = router
