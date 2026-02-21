const express = require('express');
const router = express.Router();
const multer = require('multer');

const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const { protect, authorize } = require('../middleware/auth');

const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
// Configure multer for file uploads


const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "smart-assign/submissions",
    allowed_formats: ["jpg", "jpeg", "png", "pdf", "doc", "docx", "txt", "zip"],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// @route   POST /api/v1/submissions/submit/:assignmentId
// @desc    Submit assignment (Student only)
// @access  Private/Student
router.post(
  "/submit/:assignmentId",
  protect,
  authorize("student"),
  upload.array("files", 5),
  async (req, res) => {
    try {
      const { assignmentId } = req.params;
      const { text_submission } = req.body;

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: "Assignment not found",
        });
      }

      const existingSubmission = await Submission.findOne({
        assignment_id: assignmentId,
        student_id: req.user._id,
      });

      if (existingSubmission) {
        return res.status(400).json({
          success: false,
          message: "You have already submitted this assignment",
        });
      }

      // ✅ THIS LINE IS REQUIRED
      const file_urls = (req.files || []).map(file => file.path);

      const submitted_at = new Date();
      const is_late = submitted_at > assignment.due_date;

      const submission = await Submission.create({
        assignment_id: assignmentId,
        student_id: req.user._id,
        text_submission: text_submission || "",
        file_urls: file_urls,   // explicit
        submitted_at,
        is_late,
      });

      res.status(201).json({
        success: true,
        message: "Assignment submitted successfully",
        submission,
      });

    } catch (error) {
      console.error("Submit assignment error:", error);
      res.status(500).json({
        success: false,
        message: "Error submitting assignment",
        error: error.message,
      });
    }
  }
);

// @route   GET /api/v1/submissions/my
// @desc    Get student's own submissions
// @access  Private/Student
router.get('/my', protect, authorize('student'), async (req, res) => {
  try {
    const submissions = await Submission.find({ student_id: req.user._id })
      .populate('assignment_id', 'title description due_date maxMarks')
      .sort({ submitted_at: -1 });

    res.json({
      success: true,
      count: submissions.length,
      submissions
    });
  } catch (error) {
    console.error('Get my submissions error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @route   GET /api/v1/submissions/assignment/:assignmentId
// @desc    Get all submissions for an assignment (Teacher only)
// @access  Private/Teacher
router.get('/assignment/:assignmentId', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const submissions = await Submission.find({ 
      assignment_id: req.params.assignmentId 
    })
      .populate('student_id', 'name email')
      .populate('assignment_id', 'title due_date maxMarks')
      .sort({ submitted_at: -1 });

    res.json({
      success: true,
      count: submissions.length,
      submissions
    });
  } catch (error) {
    console.error('Get submissions by assignment error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @route   GET /api/v1/submissions/:id
// @desc    Get single submission
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('assignment_id', 'title description due_date rubric maxMarks')
      .populate('student_id', 'name email')
      .populate('graded_by', 'name email');

    if (!submission) {
      return res.status(404).json({ 
        success: false,
        message: 'Submission not found' 
      });
    }

    // Check authorization
    const isOwner = submission.student_id._id.toString() === req.user._id.toString();
    const isTeacher = req.user.role === 'teacher';
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isTeacher && !isAdmin) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to view this submission' 
      });
    }

    res.json({
      success: true,
      submission
    });
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});


router.post(
  '/submit/:assignmentId',
  protect,
  authorize('student'),
  upload.array('files', 5),
  async (req, res) => {
    try {
      const { assignmentId } = req.params;
      const { text_submission } = req.body;

      // Find assignment
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found',
        });
      }

      // Check if already submitted
      const existingSubmission = await Submission.findOne({
        assignment_id: assignmentId,
        student_id: req.user._id,
      });

      if (existingSubmission) {
        return res.status(400).json({
          success: false,
          message: 'You have already submitted this assignment',
        });
      }

      // ✅ Process uploaded files (Cloudinary URLs)
      const file_urls = (req.files || []).map((file) => file.path);

      // Check if late
      const submitted_at = new Date();
      const is_late = submitted_at > assignment.due_date;

      // Create submission
      const submission = await Submission.create({
        assignment_id: assignmentId,
        student_id: req.user._id,
        text_submission: text_submission || '',
        file_urls,
        submitted_at,
        is_late,
      });

      await submission.populate('assignment_id', 'title due_date');

      res.status(201).json({
        success: true,
        message: 'Assignment submitted successfully',
        submission,
      });
    } catch (error) {
      console.error('Submit assignment error:', error);
      res.status(500).json({
        success: false,
        message: 'Error submitting assignment',
        error: error.message,
      });
    }
  }
);

// @route   GET /api/v1/submissions/assignment/:assignmentId/student
// @desc    Get student's submission for specific assignment
// @access  Private/Student
router.get('/assignment/:assignmentId/student', protect, authorize('student'), async (req, res) => {
  try {
    const submission = await Submission.findOne({
      assignment_id: req.params.assignmentId,
      student_id: req.user._id
    }).populate('assignment_id', 'title description due_date maxMarks');

    res.json({
      success: true,
      submission: submission || null,
      hasSubmitted: !!submission
    });
  } catch (error) {
    console.error('Get student submission error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

module.exports = router;
