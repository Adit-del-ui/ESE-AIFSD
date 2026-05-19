const Complaint = require('../models/Complaint')

/**
 * POST /api/complaints
 * Add a new complaint. Public route.
 */
async function addComplaint(req, res, next) {
  try {
    const { name, email, title, description, category, location } = req.body

    // Basic validation
    if (!name || !email || !title || !description) {
      return res.status(400).json({
        error: 'Validation failed',
        details: 'name, email, title, and description are required'
      })
    }

    const c = new Complaint({ name, email, title, description, category, location })
    await c.save()
    res.status(201).json(c)
  } catch (err) {
    // Mongoose validation error — return clean message
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message)
      return res.status(400).json({ error: 'Validation failed', details: messages })
    }
    next(err)
  }
}

/**
 * GET /api/complaints
 * Get all complaints. Admin only.
 */
async function getAllComplaints(req, res, next) {
  try {
    const { category, status } = req.query
    const filter = {}
    if (category) filter.category = new RegExp(String(category), 'i')
    if (status)   filter.status   = status

    const items = await Complaint.find(filter).sort({ createdAt: -1 })
    res.json(items)
  } catch (err) { next(err) }
}

/**
 * GET /api/complaints/:id
 * Get a single complaint. Auth required.
 */
async function getComplaintById(req, res, next) {
  try {
    const c = await Complaint.findById(req.params.id)
    if (!c) return res.status(404).json({ error: 'Complaint not found' })
    res.json(c)
  } catch (err) { next(err) }
}

/**
 * PUT /api/complaints/:id
 * Update complaint (status, etc.). Auth required.
 */
async function updateComplaint(req, res, next) {
  try {
    const allowed = ['status', 'aiAnalysis']
    // Admins can update more fields
    if (req.user?.role === 'admin') allowed.push('title', 'description', 'category', 'location')

    const update = {}
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key]
    }

    const c = await Complaint.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
    if (!c) return res.status(404).json({ error: 'Complaint not found' })
    res.json(c)
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message)
      return res.status(400).json({ error: 'Validation failed', details: messages })
    }
    next(err)
  }
}

/**
 * DELETE /api/complaints/:id
 * Delete complaint. Admin only.
 */
async function deleteComplaint(req, res, next) {
  try {
    const c = await Complaint.findByIdAndDelete(req.params.id)
    if (!c) return res.status(404).json({ error: 'Complaint not found' })
    res.json({ ok: true, message: 'Complaint deleted successfully' })
  } catch (err) { next(err) }
}

/**
 * GET /api/complaints/search?location=Ghaziabad
 * Search by location (case-insensitive). Admin only.
 */
async function searchByLocation(req, res, next) {
  try {
    const { location } = req.query
    if (!location) return res.status(400).json({ error: 'location query param required' })
    const items = await Complaint.find({ location: new RegExp(String(location), 'i') }).sort({ createdAt: -1 })
    res.json(items)
  } catch (err) { next(err) }
}

module.exports = {
  addComplaint,
  getAllComplaints,
  getComplaintById,
  updateComplaint,
  deleteComplaint,
  searchByLocation
}
