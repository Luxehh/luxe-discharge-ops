const express = require('express')
const Insurance = require('../models/Insurance')
const InsuranceType = require('../models/InsuranceType')
const insuranceTypesStore = require('../data/insuranceTypesStore')
const insurancesStore = require('../data/insurancesStore')
const usersStore = require('../data/usersStore')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

router.use(authMiddleware)

function getDbFlag() {
  return !!require('../db').isConnected()
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function formatInsurance(insurance) {
  const type = insurance.type
  const typeId =
    type && typeof type === 'object'
      ? String(type._id || type.id)
      : String(insurance.type || insurance.typeId || '')

  const typeName =
    type && typeof type === 'object' ? type.name || '' : insurance.typeName || ''

  const typeColor =
    type && typeof type === 'object'
      ? type.color || 'green'
      : insurance.typeColor || 'green'

  return {
    id: insurance.id || String(insurance._id),
    location: insurance.location,
    name: insurance.name,
    typeId,
    typeName,
    typeColor,
  }
}

function formatType(type) {
  return {
    id: type.id || String(type._id),
    name: type.name,
    color: type.color || 'green',
  }
}

router.get('/', async (_req, res) => {
  try {
    if (getDbFlag()) {
      const [insurances, types] = await Promise.all([
        Insurance.find().populate('type').sort({ location: 1, name: 1 }),
        InsuranceType.find().sort({ name: 1 }),
      ])

      return res.json({
        insurances: insurances.map(formatInsurance),
        types: types.map(formatType),
        locations: usersStore.LOCATIONS,
      })
    }

    res.json({
      insurances: insurancesStore.getAll(),
      types: insuranceTypesStore.getAll(),
      locations: usersStore.LOCATIONS,
    })
  } catch (error) {
    console.error('List insurances error:', error)
    res.status(500).json({ message: 'Failed to load insurances' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { location, name, typeId } = req.body
    const trimmed = name?.trim()

    if (!trimmed) {
      return res.status(400).json({ message: 'Insurance name is required' })
    }

    if (!location || !usersStore.LOCATIONS.includes(location)) {
      return res.status(400).json({ message: 'Valid location is required' })
    }

    if (!typeId) {
      return res.status(400).json({ message: 'Insurance type is required' })
    }

    if (getDbFlag()) {
      const type = await InsuranceType.findById(typeId)
      if (!type) {
        return res.status(400).json({ message: 'Valid insurance type is required' })
      }

      const exists = await Insurance.findOne({
        location,
        name: { $regex: new RegExp(`^${escapeRegex(trimmed)}$`, 'i') },
      })
      if (exists) {
        return res
          .status(400)
          .json({ message: 'Insurance already exists for this location' })
      }

      const insurance = await Insurance.create({
        location,
        name: trimmed,
        type: type._id,
      })
      await insurance.populate('type')
      return res.status(201).json({ insurance: formatInsurance(insurance) })
    }

    const insurance = insurancesStore.create({
      location,
      name: trimmed,
      typeId,
    })
    res.status(201).json({ insurance })
  } catch (error) {
    const status = error.status || 500
    res
      .status(status)
      .json({ message: error.message || 'Failed to create insurance' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { location, name, typeId } = req.body
    const trimmed = name?.trim()

    if (!trimmed) {
      return res.status(400).json({ message: 'Insurance name is required' })
    }

    if (!location || !usersStore.LOCATIONS.includes(location)) {
      return res.status(400).json({ message: 'Valid location is required' })
    }

    if (!typeId) {
      return res.status(400).json({ message: 'Insurance type is required' })
    }

    if (getDbFlag()) {
      const insurance = await Insurance.findById(req.params.id)
      if (!insurance) {
        return res.status(404).json({ message: 'Insurance not found' })
      }

      const type = await InsuranceType.findById(typeId)
      if (!type) {
        return res.status(400).json({ message: 'Valid insurance type is required' })
      }

      const exists = await Insurance.findOne({
        location,
        name: { $regex: new RegExp(`^${escapeRegex(trimmed)}$`, 'i') },
        _id: { $ne: insurance._id },
      })
      if (exists) {
        return res
          .status(400)
          .json({ message: 'Insurance already exists for this location' })
      }

      insurance.location = location
      insurance.name = trimmed
      insurance.type = type._id
      await insurance.save()
      await insurance.populate('type')

      return res.json({ insurance: formatInsurance(insurance) })
    }

    const insurance = insurancesStore.update(req.params.id, {
      location,
      name: trimmed,
      typeId,
    })
    res.json({ insurance })
  } catch (error) {
    const status = error.status || 500
    res
      .status(status)
      .json({ message: error.message || 'Failed to update insurance' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    if (getDbFlag()) {
      const insurance = await Insurance.findById(req.params.id)
      if (!insurance) {
        return res.status(404).json({ message: 'Insurance not found' })
      }

      await insurance.deleteOne()
      return res.json({ message: 'Insurance deleted' })
    }

    insurancesStore.remove(req.params.id)
    res.json({ message: 'Insurance deleted' })
  } catch (error) {
    const status = error.status || 500
    res
      .status(status)
      .json({ message: error.message || 'Failed to delete insurance' })
  }
})

module.exports = router
