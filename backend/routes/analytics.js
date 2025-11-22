// routes/analytics.js
const express = require('express');
const router = express.Router();
const analytics = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

// teacher or admin access where described; student allowed for own trends
router.get('/class-average/:assignmentId', protect, authorize('teacher','admin'), analytics.classStatsForAssignment);
router.get('/rubric-breakdown/:assignmentId', protect, authorize('teacher','admin'), analytics.rubricBreakdown);
router.get('/student-trend/:studentId', protect, analytics.studentTrend); // auth inside controller
router.get('/class-summary/:teacherId?', protect, authorize('teacher','admin'), analytics.classSummaryForTeacher);

module.exports = router;
