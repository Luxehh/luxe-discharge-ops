const express = require('express')
const InsuranceType = require('../models/InsuranceType')
const Insurance = require('../models/Insurance')
const insuranceTypesStore = require('../data/insuranceTypesStore')
const insurancesStore = require('../data/insurancesStore')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

router.use(authMiddleware)

function getDbFlag() {
  return !!require('../db').isConnected()
}

function formatType(type) {
  return {
    id: type.id || String(type._id),
    name: type.name,
    color: type.color || 'green',
  }
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

router.get('/', async (_req, res) => {
  try {
    if (getDbFlag()) {
      const types = await InsuranceType.find().sort({ name: 1 })
      return res.json({ types: types.map(formatType) })
    }

    res.json({ types: insuranceTypesStore.getAll() })
  } catch (error) {
    console.error('List insurance types error:', error)
    res.status(500).json({ message: 'Failed to load insurance types' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, color } = req.body
    const trimmed = name?.trim()
    const normalizedColor = ['green', 'yellow', 'red'].includes(color)
      ? color
      : 'green'

    if (!trimmed) {
      return res.status(400).json({ message: 'Insurance type name is required' })
    }

    if (getDbFlag()) {
      const exists = await InsuranceType.findOne({
        name: { $regex: new RegExp(`^${escapeRegex(trimmed)}$`, 'i') },
      })
      if (exists) {
        return res.status(400).json({ message: 'Insurance type already exists' })
      }

      const type = await InsuranceType.create({
        name: trimmed,
        color: normalizedColor,
      })
      return res.status(201).json({ type: formatType(type) })
    }

    const type = insuranceTypesStore.create({
      name: trimmed,
      color: normalizedColor,
    })
    res.status(201).json({ type })
  } catch (error) {
    const status = error.status || 500
    res
      .status(status)
      .json({ message: error.message || 'Failed to create insurance type' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { name, color } = req.body
    const trimmed = name?.trim()
    const normalizedColor = ['green', 'yellow', 'red'].includes(color)
      ? color
      : null

    if (!trimmed) {
      return res.status(400).json({ message: 'Insurance type name is required' })
    }

    if (getDbFlag()) {
      const type = await InsuranceType.findById(req.params.id)
      if (!type) {
        return res.status(404).json({ message: 'Insurance type not found' })
      }

      const exists = await InsuranceType.findOne({
        name: { $regex: new RegExp(`^${escapeRegex(trimmed)}$`, 'i') },
        _id: { $ne: type._id },
      })
      if (exists) {
        return res.status(400).json({ message: 'Insurance type already exists' })
      }

      type.name = trimmed
      if (normalizedColor) type.color = normalizedColor
      await type.save()
      return res.json({ type: formatType(type) })
    }

    const type = insuranceTypesStore.update(req.params.id, {
      name: trimmed,
      color: normalizedColor || undefined,
    })
    res.json({ type })
  } catch (error) {
    const status = error.status || 500
    res
      .status(status)
      .json({ message: error.message || 'Failed to update insurance type' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    if (getDbFlag()) {
      const type = await InsuranceType.findById(req.params.id)
      if (!type) {
        return res.status(404).json({ message: 'Insurance type not found' })
      }

      const inUse = await Insurance.countDocuments({ type: type._id })
      if (inUse > 0) {
        return res.status(400).json({
          message: 'Cannot delete type while insurances are using it',
        })
      }

      await type.deleteOne()
      return res.json({ message: 'Insurance type deleted' })
    }

    if (insurancesStore.countByType(req.params.id) > 0) {
      return res.status(400).json({
        message: 'Cannot delete type while insurances are using it',
      })
    }

    insuranceTypesStore.remove(req.params.id)
    res.json({ message: 'Insurance type deleted' })
  } catch (error) {
    const status = error.status || 500
    res
      .status(status)
      .json({ message: error.message || 'Failed to delete insurance type' })
  }
})

module.exports = router
