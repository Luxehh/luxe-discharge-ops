const express = require('express')
const NotAcceptReason = require('../models/NotAcceptReason')
const reasonsStore = require('../data/reasonsStore')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

router.use(authMiddleware)

function getDbFlag() {
  return !!require('../db').isConnected()
}

function formatReason(reason) {
  return {
    id: reason.id || String(reason._id),
    name: reason.name,
  }
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

router.get('/', async (_req, res) => {
  try {
    if (getDbFlag()) {
      const reasons = await NotAcceptReason.find().sort({ name: 1 })
      return res.json({ reasons: reasons.map(formatReason) })
    }

    res.json({ reasons: reasonsStore.getAll() })
  } catch (error) {
    console.error('List reasons error:', error)
    res.status(500).json({ message: 'Failed to load reasons' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name } = req.body
    const trimmed = name?.trim()

    if (!trimmed) {
      return res.status(400).json({ message: 'Reason name is required' })
    }

    if (getDbFlag()) {
      const exists = await NotAcceptReason.findOne({
        name: { $regex: new RegExp(`^${escapeRegex(trimmed)}$`, 'i') },
      })
      if (exists) {
        return res.status(400).json({ message: 'Reason already exists' })
      }

      const reason = await NotAcceptReason.create({ name: trimmed })
      return res.status(201).json({ reason: formatReason(reason) })
    }

    const reason = reasonsStore.create({ name: trimmed })
    res.status(201).json({ reason })
  } catch (error) {
    const status = error.status || 500
    res.status(status).json({ message: error.message || 'Failed to create reason' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { name } = req.body
    const trimmed = name?.trim()

    if (!trimmed) {
      return res.status(400).json({ message: 'Reason name is required' })
    }

    if (getDbFlag()) {
      const reason = await NotAcceptReason.findById(req.params.id)
      if (!reason) {
        return res.status(404).json({ message: 'Reason not found' })
      }

      const exists = await NotAcceptReason.findOne({
        name: { $regex: new RegExp(`^${escapeRegex(trimmed)}$`, 'i') },
        _id: { $ne: reason._id },
      })
      if (exists) {
        return res.status(400).json({ message: 'Reason already exists' })
      }

      reason.name = trimmed
      await reason.save()

      return res.json({ reason: formatReason(reason) })
    }

    const reason = reasonsStore.update(req.params.id, { name: trimmed })
    res.json({ reason })
  } catch (error) {
    const status = error.status || 500
    res.status(status).json({ message: error.message || 'Failed to update reason' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    if (getDbFlag()) {
      const reason = await NotAcceptReason.findById(req.params.id)
      if (!reason) {
        return res.status(404).json({ message: 'Reason not found' })
      }

      await reason.deleteOne()
      return res.json({ message: 'Reason deleted' })
    }

    reasonsStore.remove(req.params.id)
    res.json({ message: 'Reason deleted' })
  } catch (error) {
    const status = error.status || 500
    res.status(status).json({ message: error.message || 'Failed to delete reason' })
  }
})

module.exports = router
