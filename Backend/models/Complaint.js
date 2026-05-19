const mongoose = require('mongoose')

/**
 * Complaint Schema
 * Matches the exam requirement exactly.
 */
const ComplaintSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters']
  },
  category: {
    type: String,
    trim: true,
    enum: {
      values: ['Water Supply', 'Electricity', 'Sanitation', 'Roads & Infrastructure', 'Public Safety', 'Noise Complaint', 'Garbage Collection', 'Other', ''],
      message: 'Invalid category'
    },
    default: 'Other'
  },
  location: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
    default: 'Pending'
  },
  // AI analysis result stored alongside the complaint
  aiAnalysis: {
    priority: String,
    department: String,
    summary: String,
    autoResponse: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

// Index for location search
ComplaintSchema.index({ location: 1 })
ComplaintSchema.index({ status: 1 })
ComplaintSchema.index({ category: 1 })

module.exports = mongoose.model('Complaint', ComplaintSchema)
