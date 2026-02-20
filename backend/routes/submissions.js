const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const { protect, authorize } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'submissions');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `submission-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only images, PDFs, documents, and ZIP files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// @route   POST /api/v1/submissions/submit/:assignmentId
// @desc    Submit assignment (Student only)
// @access  Private/Student
router.post('/submit/:assignmentId', protect, authorize('student'), upload.array('files', 5), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { text_submission } = req.body;

    // Find assignment
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ 
        success: false,
        message: 'Assignment not found' 
      });
    }

    // Check if already submitted
    const existingSubmission = await Submission.findOne({
      assignment_id: assignmentId,
      student_id: req.user._id
    });

    if (existingSubmission) {
      return res.status(400).json({ 
        success: false,
        message: 'You have already submitted this assignment' 
      });
    }

    // Process uploaded files
const baseUrl =
  process.env.BASE_URL ||
  `${req.protocol}://${req.get("host")}`;

const file_urls = (req.files || []).map(
  f => `${baseUrl}/uploads/submissions/${f.filename}`
);
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
      is_late
    });

    await submission.populate('assignment_id', 'title due_date');

    res.status(201).json({
      success: true,
      message: 'Assignment submitted successfully',
      submission
    });
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error submitting assignment',
      error: error.message 
    });
  }
});

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

// @route   POST /api/v1/submissions/:id/grade
// @desc    Grade a submission (Teacher only)
// @access  Private/Teacher
router.post('/:id/grade', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { grade, feedback, rubric_scores } = req.body;

    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ 
        success: false,
        message: 'Submission not found' 
      });
    }

    // Update submission with grade
    submission.grade = grade;
    submission.feedback = feedback || '';
    submission.rubric_scores = rubric_scores || [];
    submission.graded = true;
    submission.graded_by = req.user._id;
    submission.graded_at = new Date();

    await submission.save();

    await submission.populate([
      { path: 'assignment_id', select: 'title maxMarks' },
      { path: 'student_id', select: 'name email' }
    ]);

    res.json({
      success: true,
      message: 'Submission graded successfully',
      submission
    });
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error grading submission',
      error: error.message 
    });
  }
});

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
