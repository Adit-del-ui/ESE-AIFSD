const express = require('express')

const router = express.Router()
const h = require('../handlers/complaintHandler')
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware')

// Public: add complaint
router.post('/', h.addComplaint)

// Admin: list and search
router.get('/', requireAuth, requireAdmin, h.getAllComplaints)
router.get('/search', requireAuth, requireAdmin, h.searchByLocation)

// Authenticated: get and update
router.get('/:id', requireAuth, h.getComplaintById)
router.put('/:id', requireAuth, h.updateComplaint)

// Admin only: delete
router.delete('/:id', requireAuth, requireAdmin, h.deleteComplaint)

module.exports = router
