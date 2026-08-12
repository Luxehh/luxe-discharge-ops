const express = require('express')
const Category = require('../models/Category')
const NotAcceptReason = require('../models/NotAcceptReason')
const categoriesStore = require('../data/categoriesStore')
const reasonsStore = require('../data/reasonsStore')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

router.use(authMiddleware)

function getDbFlag() {
  return !!require('../db').isConnected()
}

function formatReason(reason) {
  const category = reason.category
  const categoryId =
    category && typeof category === 'object'
      ? String(category._id || category.id)
      : String(reason.category || reason.categoryId || '')

  const categoryName =
    category && typeof category === 'object'
      ? category.name || ''
      : reason.categoryName || ''

  return {
    id: reason.id || String(reason._id),
    name: reason.name,
    categoryId,
    categoryName,
  }
}

router.get('/', async (_req, res) => {
  try {
    if (getDbFlag()) {
      const [reasons, categories] = await Promise.all([
        NotAcceptReason.find().populate('category').sort({ name: 1 }),
        Category.find().sort({ name: 1 }),
      ])

      return res.json({
        reasons: reasons.map(formatReason),
        categories: categories.map((c) => ({
          id: String(c._id),
          name: c.name,
        })),
      })
    }

    res.json({
      reasons: reasonsStore.getAll(),
      categories: categoriesStore.getAll(),
    })
  } catch (error) {
    console.error('List reasons error:', error)
    res.status(500).json({ message: 'Failed to load reasons' })
  }
})

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

router.post('/', async (req, res) => {
  try {
    const { name, categoryId } = req.body
    const trimmed = name?.trim()

    if (!trimmed) {
      return res.status(400).json({ message: 'Reason name is required' })
    }

    if (!categoryId) {
      return res.status(400).json({ message: 'Category is required' })
    }

    if (getDbFlag()) {
      const category = await Category.findById(categoryId)
      if (!category) {
        return res.status(400).json({ message: 'Valid category is required' })
      }

      const exists = await NotAcceptReason.findOne({
        name: { $regex: new RegExp(`^${escapeRegex(trimmed)}$`, 'i') },
      })
      if (exists) {
        return res.status(400).json({ message: 'Reason already exists' })
      }

      const reason = await NotAcceptReason.create({
        name: trimmed,
        category: category._id,
      })

      await reason.populate('category')
      return res.status(201).json({ reason: formatReason(reason) })
    }

    const reason = reasonsStore.create({ name: trimmed, categoryId })
    res.status(201).json({ reason })
  } catch (error) {
    const status = error.status || 500
    res.status(status).json({ message: error.message || 'Failed to create reason' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { name, categoryId } = req.body
    const trimmed = name?.trim()

    if (!trimmed) {
      return res.status(400).json({ message: 'Reason name is required' })
    }

    if (!categoryId) {
      return res.status(400).json({ message: 'Category is required' })
    }

    if (getDbFlag()) {
      const reason = await NotAcceptReason.findById(req.params.id)
      if (!reason) {
        return res.status(404).json({ message: 'Reason not found' })
      }

      const category = await Category.findById(categoryId)
      if (!category) {
        return res.status(400).json({ message: 'Valid category is required' })
      }

      const exists = await NotAcceptReason.findOne({
        name: { $regex: new RegExp(`^${escapeRegex(trimmed)}$`, 'i') },
        _id: { $ne: reason._id },
      })
      if (exists) {
        return res.status(400).json({ message: 'Reason already exists' })
      }

      reason.name = trimmed
      reason.category = category._id
      await reason.save()
      await reason.populate('category')

      return res.json({ reason: formatReason(reason) })
    }

    const reason = reasonsStore.update(req.params.id, { name: trimmed, categoryId })
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
