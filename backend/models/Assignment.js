const mongoose = require('mongoose');

const rubricSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  maxMarks: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Assignment title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  teacher_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  due_date: {
    type: Date,
    required: [true, 'Due date is required']
  },
  attachments: [{
    type: String
  }],
  rubric: [rubricSchema],
  maxMarks: {
    type: Number,
    default: 100
  },
  isActive: {
    type: Boolean,
    default: true
  },
  allowLateSubmission: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true 
});

// Indexes
assignmentSchema.index({ teacher_id: 1, due_date: -1 });
assignmentSchema.index({ course_id: 1 });

// Virtual for checking if assignment is overdue
assignmentSchema.virtual('isOverdue').get(function() {
  return new Date() > this.due_date;
});

module.exports = mongoose.model('Assignment', assignmentSchema);
