require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const User = require('./models/User')

const demoUsers = [
  {
    email: 'admin@rms.com',
    password: 'Admin@123',
    name: 'Super Admin',
    role: 'super_admin',
    location: null,
  },
  {
    email: 'illinois@rms.com',
    password: 'Illinois@123',
    name: 'Illinois Admin',
    role: 'location_admin',
    location: 'Illinois',
  },
  {
    email: 'indiana@rms.com',
    password: 'Indiana@123',
    name: 'Indiana Admin',
    role: 'location_admin',
    location: 'Indiana',
  },
  {
    email: 'missouri@rms.com',
    password: 'Missouri@123',
    name: 'Missouri Admin',
    role: 'location_admin',
    location: 'Missouri',
  },
  {
    email: 'oklahoma@rms.com',
    password: 'Oklahoma@123',
    name: 'Oklahoma Admin',
    role: 'location_admin',
    location: 'Oklahoma',
  },
]

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    for (const user of demoUsers) {
      const existing = await User.findOne({ email: user.email })
      const hashed = await bcrypt.hash(user.password, 10)

      if (existing) {
        existing.password = hashed
        existing.passwordPlain = user.password
        existing.name = user.name
        existing.role = user.role
        existing.location = user.location
        await existing.save()
        console.log(`Updated: ${user.email}`)
      } else {
        await User.create({
          ...user,
          password: hashed,
          passwordPlain: user.password,
        })
        console.log(`Created: ${user.email}`)
      }
    }

    console.log('Seed completed')
    process.exit(0)
  } catch (error) {
    console.error('Seed failed:', error.message)
    process.exit(1)
  }
}

seed()
