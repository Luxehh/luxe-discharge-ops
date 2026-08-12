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

function formatCategory(category) {
  return {
    id: category.id || String(category._id),
    name: category.name,
  }
}

router.get('/', async (_req, res) => {
  try {
    if (getDbFlag()) {
      const categories = await Category.find().sort({ name: 1 })
      return res.json({ categories: categories.map(formatCategory) })
    }

    res.json({ categories: categoriesStore.getAll() })
  } catch (error) {
    console.error('List categories error:', error)
    res.status(500).json({ message: 'Failed to load categories' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name } = req.body
    const trimmed = name?.trim()

    if (!trimmed) {
      return res.status(400).json({ message: 'Category name is required' })
    }

    if (getDbFlag()) {
      const exists = await Category.findOne({
        name: { $regex: new RegExp(`^${trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      })
      if (exists) {
        return res.status(400).json({ message: 'Category already exists' })
      }

      const category = await Category.create({ name: trimmed })
      return res.status(201).json({ category: formatCategory(category) })
    }

    const category = categoriesStore.create({ name: trimmed })
    res.status(201).json({ category })
  } catch (error) {
    const status = error.status || 500
    res.status(status).json({ message: error.message || 'Failed to create category' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { name } = req.body
    const trimmed = name?.trim()

    if (!trimmed) {
      return res.status(400).json({ message: 'Category name is required' })
    }

    if (getDbFlag()) {
      const category = await Category.findById(req.params.id)
      if (!category) {
        return res.status(404).json({ message: 'Category not found' })
      }

      const exists = await Category.findOne({
        name: { $regex: new RegExp(`^${trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        _id: { $ne: category._id },
      })
      if (exists) {
        return res.status(400).json({ message: 'Category already exists' })
      }

      category.name = trimmed
      await category.save()
      return res.json({ category: formatCategory(category) })
    }

    const category = categoriesStore.update(req.params.id, { name: trimmed })
    res.json({ category })
  } catch (error) {
    const status = error.status || 500
    res.status(status).json({ message: error.message || 'Failed to update category' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    if (getDbFlag()) {
      const category = await Category.findById(req.params.id)
      if (!category) {
        return res.status(404).json({ message: 'Category not found' })
      }

      const inUse = await NotAcceptReason.countDocuments({ category: category._id })
      if (inUse > 0) {
        return res.status(400).json({
          message: 'Cannot delete category while reasons are using it',
        })
      }

      await category.deleteOne()
      return res.json({ message: 'Category deleted' })
    }

    if (reasonsStore.countByCategory(req.params.id) > 0) {
      return res.status(400).json({
        message: 'Cannot delete category while reasons are using it',
      })
    }

    categoriesStore.remove(req.params.id)
    res.json({ message: 'Category deleted' })
  } catch (error) {
    const status = error.status || 500
    res.status(status).json({ message: error.message || 'Failed to delete category' })
  }
})

module.exports = router
