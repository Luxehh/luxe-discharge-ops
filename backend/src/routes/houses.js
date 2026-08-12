const express = require('express')
const House = require('../models/House')
const housesStore = require('../data/housesStore')
const usersStore = require('../data/usersStore')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

router.use(authMiddleware)

const STATUSES = ['Active', 'Coming Soon']

function getDbFlag() {
  return !!require('../db').isConnected()
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function formatHouse(house) {
  return {
    id: house.id || String(house._id),
    location: house.location,
    name: house.name,
    status: house.status,
  }
}

router.get('/', async (_req, res) => {
  try {
    if (getDbFlag()) {
      const houses = await House.find().sort({ location: 1, name: 1 })
      return res.json({
        houses: houses.map(formatHouse),
        locations: usersStore.LOCATIONS,
        statuses: STATUSES,
      })
    }

    res.json({
      houses: housesStore.getAll(),
      locations: usersStore.LOCATIONS,
      statuses: STATUSES,
    })
  } catch (error) {
    console.error('List houses error:', error)
    res.status(500).json({ message: 'Failed to load houses' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { location, name, status } = req.body
    const trimmed = name?.trim()
    const normalizedStatus = STATUSES.includes(status) ? status : 'Active'

    if (!trimmed) {
      return res.status(400).json({ message: 'House name is required' })
    }

    if (!location || !usersStore.LOCATIONS.includes(location)) {
      return res.status(400).json({ message: 'Valid location is required' })
    }

    if (getDbFlag()) {
      const exists = await House.findOne({
        location,
        name: { $regex: new RegExp(`^${escapeRegex(trimmed)}$`, 'i') },
      })
      if (exists) {
        return res
          .status(400)
          .json({ message: 'House already exists for this location' })
      }

      const house = await House.create({
        location,
        name: trimmed,
        status: normalizedStatus,
      })
      return res.status(201).json({ house: formatHouse(house) })
    }

    const house = housesStore.create({
      location,
      name: trimmed,
      status: normalizedStatus,
    })
    res.status(201).json({ house })
  } catch (error) {
    const statusCode = error.status || 500
    res
      .status(statusCode)
      .json({ message: error.message || 'Failed to create house' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { location, name, status } = req.body
    const trimmed = name?.trim()
    const normalizedStatus = STATUSES.includes(status) ? status : null

    if (!trimmed) {
      return res.status(400).json({ message: 'House name is required' })
    }

    if (!location || !usersStore.LOCATIONS.includes(location)) {
      return res.status(400).json({ message: 'Valid location is required' })
    }

    if (getDbFlag()) {
      const house = await House.findById(req.params.id)
      if (!house) {
        return res.status(404).json({ message: 'House not found' })
      }

      const exists = await House.findOne({
        location,
        name: { $regex: new RegExp(`^${escapeRegex(trimmed)}$`, 'i') },
        _id: { $ne: house._id },
      })
      if (exists) {
        return res
          .status(400)
          .json({ message: 'House already exists for this location' })
      }

      house.location = location
      house.name = trimmed
      if (normalizedStatus) house.status = normalizedStatus
      await house.save()

      return res.json({ house: formatHouse(house) })
    }

    const house = housesStore.update(req.params.id, {
      location,
      name: trimmed,
      status: normalizedStatus || undefined,
    })
    res.json({ house })
  } catch (error) {
    const statusCode = error.status || 500
    res
      .status(statusCode)
      .json({ message: error.message || 'Failed to update house' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    if (getDbFlag()) {
      const house = await House.findById(req.params.id)
      if (!house) {
        return res.status(404).json({ message: 'House not found' })
      }

      await house.deleteOne()
      return res.json({ message: 'House deleted' })
    }

    housesStore.remove(req.params.id)
    res.json({ message: 'House deleted' })
  } catch (error) {
    const statusCode = error.status || 500
    res
      .status(statusCode)
      .json({ message: error.message || 'Failed to delete house' })
  }
})

module.exports = router
