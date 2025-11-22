const mongoose = require('mongoose');

const rubricScoreSchema = new mongoose.Schema({
  criterionName: {
    type: String,
    required: true
  },
  marksAwarded: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const submissionSchema = new mongoose.Schema({
  assignment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text_submission: {
    type: String,
    trim: true
  },
  file_urls: [{
    type: String
  }],
  submitted_at: {
    type: Date,
    default: Date.now
  },
  is_late: {
    type: Boolean,
    default: false
  },
  grade: {
    type: Number,
    min: 0
  },
  graded: {
    type: Boolean,
    default: false
  },
  feedback: {
    type: String,
    trim: true
  },
  rubric_scores: [rubricScoreSchema],
  graded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  graded_at: {
    type: Date
  }
}, { 
  timestamps: true 
});

// Compound index to ensure one submission per student per assignment
submissionSchema.index({ assignment_id: 1, student_id: 1 }, { unique: true });
submissionSchema.index({ student_id: 1, submitted_at: -1 });

module.exports = mongoose.model('Submission', submissionSchema);
