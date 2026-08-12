const jwt = require('jsonwebtoken')

const JWT_SECRET =
  process.env.JWT_SECRET || 'luxe-discharge-ops-secret-key-change-in-production'

function authMiddleware(req, res, next) {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' })
  }

  try {
    const token = header.split(' ')[1]
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

function requireSuperAdmin(req, res, next) {
  if (req.user?.role !== 'super_admin') {
    return res.status(403).json({ message: 'Super Admin access required' })
  }
  next()
}

module.exports = { authMiddleware, requireSuperAdmin, JWT_SECRET }
