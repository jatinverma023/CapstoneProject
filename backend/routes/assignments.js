const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const { protect, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// @route   POST /api/v1/assignments
// @desc    Create a new assignment (Teacher only)
// @access  Private/Teacher
router.post('/', protect, authorize('teacher', 'admin'), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('due_date').isISO8601().withMessage('Valid due date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const assignmentData = {
      ...req.body,
      teacher_id: req.user._id
    };

    const assignment = await Assignment.create(assignmentData);

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      assignment
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(400).json({ 
      success: false,
      message: 'Error creating assignment',
      error: error.message 
    });
  }
});

// @route   GET /api/v1/assignments
// @desc    Get all assignments (filtered by role)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = { isActive: true };

    // Teachers see only their assignments
    if (req.user.role === 'teacher') {
      query.teacher_id = req.user._id;
    }

    // Apply filters from query params
    if (req.query.course_id) {
      query.course_id = req.query.course_id;
    }

    const assignments = await Assignment.find(query)
      .populate('teacher_id', 'name email')
      .populate('course_id', 'title code')
      .sort({ due_date: -1 });

    res.json({
      success: true,
      count: assignments.length,
      assignments
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @route   GET /api/v1/assignments/:id
// @desc    Get single assignment by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('teacher_id', 'name email')
      .populate('course_id', 'title code');

    if (!assignment) {
      return res.status(404).json({ 
        success: false,
        message: 'Assignment not found' 
      });
    }

    res.json({
      success: true,
      assignment
    });
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @route   PUT /api/v1/assignments/:id
// @desc    Update assignment (Teacher only)
// @access  Private/Teacher
router.put('/:id', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    let assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ 
        success: false,
        message: 'Assignment not found' 
      });
    }

    // Check ownership
    if (assignment.teacher_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to update this assignment' 
      });
    }

    assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Assignment updated successfully',
      assignment
    });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(400).json({ 
      success: false,
      message: 'Error updating assignment',
      error: error.message 
    });
  }
});

// @route   DELETE /api/v1/assignments/:id
// @desc    Delete assignment (Teacher only)
// @access  Private/Teacher
router.delete('/:id', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ 
        success: false,
        message: 'Assignment not found' 
      });
    }

    // Check ownership
    if (assignment.teacher_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to delete this assignment' 
      });
    }

    // Soft delete
    assignment.isActive = false;
    await assignment.save();

    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @route   GET /api/v1/assignments/:id/submissions
// @desc    Get all submissions for an assignment (Teacher only)
// @access  Private/Teacher
router.get('/:id/submissions', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ 
        success: false,
        message: 'Assignment not found' 
      });
    }

    const submissions = await Submission.find({ assignment_id: req.params.id })
      .populate('student_id', 'name email')
      .sort({ submitted_at: -1 });

    res.json({
      success: true,
      count: submissions.length,
      submissions
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

module.exports = router;
