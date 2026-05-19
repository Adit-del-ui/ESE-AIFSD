const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET || 'please-change-this-secret'

function requireAuth(req, res, next) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing Authorization' })
  const token = auth.slice(7)
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Missing auth' })
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin required' })
  next()
}

module.exports = { requireAuth, requireAdmin }
