const User = require('../models/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'civic-alert-secret-change-in-prod'

/**
 * POST /api/auth/signup
 */
async function signup(req, res, next) {
  try {
    const { name, email, password } = req.body

    if (!email || !password)
      return res.status(400).json({ error: 'email and password are required' })

    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' })

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing)
      return res.status(400).json({ error: 'An account with this email already exists' })

    const hash = await bcrypt.hash(password, 12)

    // First registered user becomes admin automatically
    const isFirst = (await User.countDocuments({})) === 0
    const role = isFirst ? 'admin' : 'user'

    const u = new User({ name, email: email.toLowerCase(), passwordHash: hash, role })
    await u.save()

    res.status(201).json({
      id: u._id,
      email: u.email,
      role: u.role,
      message: isFirst ? 'Admin account created successfully' : 'Account created successfully'
    })
  } catch (err) { next(err) }
}

/**
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body

    if (!email || !password)
      return res.status(400).json({ error: 'email and password are required' })

    const u = await User.findOne({ email: email.toLowerCase() })
    if (!u)
      return res.status(401).json({ error: 'Invalid email or password' })

    const ok = await bcrypt.compare(password, u.passwordHash)
    if (!ok)
      return res.status(401).json({ error: 'Invalid email or password' })

    const token = jwt.sign(
      { sub: u._id, email: u.email, role: u.role, name: u.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({ token, role: u.role, email: u.email, name: u.name })
  } catch (err) { next(err) }
}

module.exports = { signup, login }
