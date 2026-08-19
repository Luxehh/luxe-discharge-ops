/**
 * Shared master-data seed (users, reasons, insurances, houses).
 * Used on startup and after delete-all (without dummy referrals).
 */

const bcrypt = require('bcryptjs')

async function ensureSeedHouses() {
  const House = require('./models/House')
  const count = await House.countDocuments()
  if (count > 0) return

  await House.insertMany([
    { location: 'Illinois', name: 'McHenry', status: 'Active' },
    { location: 'Illinois', name: 'Hanover Park', status: 'Active' },
    { location: 'Illinois', name: 'Lisle', status: 'Active' },
    { location: 'Illinois', name: 'Fox Valley', status: 'Active' },
    { location: 'Illinois', name: 'Lake Zurich', status: 'Active' },
    { location: 'Indiana', name: 'Chesterton', status: 'Active' },
    { location: 'Indiana', name: 'Crown Point', status: 'Active' },
    { location: 'Indiana', name: 'South Bend', status: 'Active' },
    { location: 'Missouri', name: 'Blue Springs', status: 'Active' },
    { location: 'Missouri', name: 'Gladstone', status: 'Active' },
    { location: 'Missouri', name: 'Northland', status: 'Active' },
    { location: 'Missouri', name: "St. Mary's", status: 'Active' },
    { location: 'Oklahoma', name: 'Oklahoma House 1', status: 'Coming Soon' },
    { location: 'Oklahoma', name: 'Oklahoma House 2', status: 'Coming Soon' },
  ])

  console.log('Seeded default houses')
}

async function ensureSeedInsurances() {
  const InsuranceType = require('./models/InsuranceType')
  const Insurance = require('./models/Insurance')

  const count = await InsuranceType.countDocuments()
  if (count > 0) return

  const types = await InsuranceType.insertMany([
    { name: 'Medicare Advantage Plan', color: 'yellow' },
    { name: 'Medicare', color: 'green' },
    { name: 'Lots of Insurance & Charity', color: 'red' },
  ])
  const byName = Object.fromEntries(types.map((t) => [t.name, t._id]))

  await Insurance.insertMany([
    { location: 'Illinois', name: 'Aetna', type: byName['Medicare Advantage Plan'] },
    { location: 'Illinois', name: 'Medicare', type: byName.Medicare },
    { location: 'Illinois', name: 'BCBS Commercial', type: byName['Medicare Advantage Plan'] },
    { location: 'Illinois', name: 'MMAI', type: byName['Lots of Insurance & Charity'] },
    { location: 'Illinois', name: 'BCBS MCR', type: byName.Medicare },
    { location: 'Indiana', name: 'Aetna', type: byName['Medicare Advantage Plan'] },
    { location: 'Indiana', name: 'Humana', type: byName['Medicare Advantage Plan'] },
    { location: 'Indiana', name: 'United HC', type: byName['Medicare Advantage Plan'] },
    { location: 'Indiana', name: 'Medicare', type: byName.Medicare },
    { location: 'Indiana', name: 'Other', type: byName['Lots of Insurance & Charity'] },
    { location: 'Missouri', name: 'Aetna', type: byName['Medicare Advantage Plan'] },
    { location: 'Missouri', name: 'Humana', type: byName['Medicare Advantage Plan'] },
    { location: 'Missouri', name: 'United HC', type: byName['Medicare Advantage Plan'] },
    { location: 'Missouri', name: 'Medicare', type: byName.Medicare },
    { location: 'Missouri', name: 'Other', type: byName['Lots of Insurance & Charity'] },
    { location: 'Oklahoma', name: 'SoonerCare', type: byName['Lots of Insurance & Charity'] },
    { location: 'Oklahoma', name: 'BCBS OK', type: byName['Medicare Advantage Plan'] },
    { location: 'Oklahoma', name: 'Humana', type: byName['Medicare Advantage Plan'] },
    { location: 'Oklahoma', name: 'United HC', type: byName['Medicare Advantage Plan'] },
    { location: 'Oklahoma', name: 'Medicare', type: byName.Medicare },
    { location: 'Oklahoma', name: 'Other', type: byName['Lots of Insurance & Charity'] },
  ])

  console.log('Seeded default insurance types and insurances')
}

async function ensureSeedReasons() {
  const NotAcceptReason = require('./models/NotAcceptReason')

  const count = await NotAcceptReason.countDocuments()
  if (count > 0) return

  await NotAcceptReason.insertMany([
    { name: 'Out of Network' },
    { name: 'Out of Network / Staffing' },
    { name: 'Advocate at Home (PAN)' },
    { name: 'DULY ACO' },
    { name: 'Staffing Unavailable' },
    { name: 'Distance Too Far' },
  ])

  console.log('Seeded default not-accept reasons')
}

async function ensureSeedUsers() {
  const User = require('./models/User')
  const count = await User.countDocuments()
  if (count > 0) return

  const seedUsers = [
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

  for (const user of seedUsers) {
    const hashed = await bcrypt.hash(user.password, 10)
    await User.create({
      ...user,
      password: hashed,
      passwordPlain: user.password,
    })
  }

  console.log('Seeded default location logins')
}

/** After wipe: restore empty master catalogs (no referrals). */
async function reseedMasterData() {
  await ensureSeedReasons()
  await ensureSeedInsurances()
  await ensureSeedHouses()
}

module.exports = {
  ensureSeedUsers,
  ensureSeedReasons,
  ensureSeedInsurances,
  ensureSeedHouses,
  reseedMasterData,
}
