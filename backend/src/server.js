require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const usersStore = require('./data/usersStore')
const { JWT_SECRET } = require('./middleware/auth')
const db = require('./db')
const loginsRoutes = require('./routes/logins')
const categoriesRoutes = require('./routes/categories')
const reasonsRoutes = require('./routes/reasons')
const insuranceTypesRoutes = require('./routes/insuranceTypes')
const insurancesRoutes = require('./routes/insurances')
const housesRoutes = require('./routes/houses')
const referralsRoutes = require('./routes/referrals')
const adminRoutes = require('./routes/admin')
const {
  ensureSeedUsers,
  ensureSeedCategories,
  ensureSeedInsurances,
  ensureSeedHouses,
} = require('./seedMasterData')
const { ensureSeedDummyReferrals } = require('./seedDummyReferrals')

const app = express()
const PORT = process.env.PORT || 5000

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
)
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Discharge Ops API',
    database: db.isConnected() ? 'connected' : 'demo-mode',
  })
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const normalizedEmail = email.toLowerCase().trim()

    if (db.isConnected()) {
      const User = require('./models/User')
      const user = await User.findOne({ email: normalizedEmail })

      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' })
      }

      const isMatch = await bcrypt.compare(password, user.password)
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' })
      }

      const token = jwt.sign(
        {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          location: user.location,
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      )

      return res.json({
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          location: user.location,
        },
      })
    }

    const demoUser = usersStore.getByEmail(normalizedEmail)
    if (!demoUser || demoUser.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const token = jwt.sign(
      {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        role: demoUser.role,
        location: demoUser.location,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        role: demoUser.role,
        location: demoUser.location,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error during login' })
  }
})

app.get('/api/auth/me', (req, res) => {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' })
  }

  try {
    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)

    res.json({
      user: {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
        location: decoded.location,
      },
    })
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
})

app.use('/api/logins', loginsRoutes)
app.use('/api/categories', categoriesRoutes)
app.use('/api/reasons', reasonsRoutes)
app.use('/api/insurance-types', insuranceTypesRoutes)
app.use('/api/insurances', insurancesRoutes)
app.use('/api/houses', housesRoutes)
app.use('/api/referrals', referralsRoutes)
app.use('/api/admin', adminRoutes)

function tryConnectMongo() {
  if (!process.env.MONGODB_URI) return

  mongoose
    .connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
    })
    .then(async () => {
      db.setConnected(true)
      console.log('MongoDB connected')
      await ensureSeedUsers()
      await ensureSeedCategories()
      await ensureSeedInsurances()
      await ensureSeedHouses()
      await ensureSeedDummyReferrals()
    })
    .catch((err) => {
      db.setConnected(false)
      console.warn('MongoDB unavailable — using demo credentials mode')
      console.warn(err.message)
    })
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log('Demo mode active until MongoDB connects')
  tryConnectMongo()
})
