// controllers/analyticsController.js
const mongoose = require('mongoose');
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const User = require('../models/User');

/**
 * GET /api/v1/analytics/class-average/:assignmentId
 * Returns class average, median, stdev, pass rate for one assignment
 * Access: teacher (owner) or admin
 */
exports.classStatsForAssignment = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const teacherId = req.user._id;

    const assignment = await Assignment.findOne({ _id: assignmentId, teacher_id: teacherId });
    if (!assignment) return res.status(404).json({ success:false, message:'Assignment not found or not yours' });

    const agg = await Submission.aggregate([
        { $match: { assignment_id: new mongoose.Types.ObjectId(assignmentId), graded: true } },
        {
        $group: {
          _id: null,
          avgGrade: { $avg: '$grade' },
          minGrade: { $min: '$grade' },
          maxGrade: { $max: '$grade' },
          count: { $sum: 1 },
          passCount: { $sum: { $cond: [ { $gte: [ '$grade', assignment.maxMarks * 0.5 ] }, 1, 0 ] } } // pass threshold 50%
        }
      }
    ]);

    const raw = agg[0] || { avgGrade: 0, minGrade: 0, maxGrade: 0, count: 0, passCount: 0 };
    // For median & stdev we do extra steps
    const grades = await Submission.find({ assignment_id: assignmentId, graded: true }).select('grade -_id').lean();
    const gradeList = grades.map(g => g.grade).sort((a,b)=>a-b);

    const median = (arr => {
      if (!arr.length) return null;
      const mid = Math.floor(arr.length/2);
      return arr.length % 2 === 0 ? (arr[mid-1]+arr[mid])/2 : arr[mid];
    })(gradeList);

    const mean = raw.avgGrade || 0;
    const variance = gradeList.reduce((acc,g) => acc + Math.pow(g-mean,2), 0) / (gradeList.length || 1);
    const stdev = Math.sqrt(variance);

    const passRate = raw.count ? (raw.passCount / raw.count) : 0;

    res.json({
      success: true,
      assignment: { id: assignment._id, title: assignment.title, maxMarks: assignment.maxMarks },
      stats: {
        average: mean,
        median,
        min: raw.minGrade,
        max: raw.maxGrade,
        stdev,
        count: raw.count,
        passRate
      }
    });
  } catch (err) { next(err); }
};

/**
 * GET /api/v1/analytics/student-trend/:studentId
 * Returns a student's grades over assignments (optionally for a teacher's class)
 * Access: teacher (owner of assignments) OR the student themself OR admin
 */
exports.studentTrend = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const requester = req.user;

    // if requester is student, enforce same id
    if (requester.role === 'student' && requester._id.toString() !== studentId) {
      return res.status(403).json({ success:false, message:'Not allowed' });
    }

    // If teacher, limit to assignments owned by teacher (optional)
    const matchStage = { student_id: mongoose.Types.ObjectId(studentId), graded: true };

    if (requester.role === 'teacher') {
      // get assignments by this teacher
      const teacherAssignments = await Assignment.find({ teacher_id: requester._id }).select('_id').lean();
      const ids = teacherAssignments.map(a => a._id);
      matchStage.assignment_id = { $in: ids };
    }

    const agg = await Submission.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'assignments',
          localField: 'assignment_id',
          foreignField: '_id',
          as: 'assignment'
        }
      },
      { $unwind: '$assignment' },
      { $project: { assignmentId: '$assignment._id', assignmentTitle: '$assignment.title', grade: 1, graded_at: 1 } },
      { $sort: { graded_at: 1 } }
    ]);

    res.json({ success:true, studentId, trend: agg });
  } catch (err) { next(err); }
};

/**
 * GET /api/v1/analytics/rubric-breakdown/:assignmentId
 * Returns average marks per rubric criterion for an assignment
 * Access: teacher (owner) or admin
 */
exports.rubricBreakdown = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const teacherId = req.user._id;

    const assignment = await Assignment.findOne({ _id: assignmentId, teacher_id: teacherId });
    if (!assignment) return res.status(404).json({ success:false, message:'Assignment not found or not yours' });

    // unwind rubric_scores array in submissions
    const agg = await Submission.aggregate([
        { $match: { assignment_id: new mongoose.Types.ObjectId(assignmentId), graded: true } },
      { $unwind: '$rubric_scores' },
      {
        $group: {
          _id: '$rubric_scores.criterionName',
          avgMarks: { $avg: '$rubric_scores.marksAwarded' },
          count: { $sum: 1 },
          maxMarksGiven: { $max: '$rubric_scores.marksAwarded' }
        }
      },
      { $project: { criterion: '$_id', avgMarks: 1, count: 1, maxMarksGiven:1, _id:0 } }
    ]);

    res.json({ success:true, assignment: { id: assignment._id, title: assignment.title }, breakdown: agg });
  } catch (err) { next(err); }
};

/**
 * GET /api/v1/analytics/class-summary/:teacherId
 * Overview across all assignments for a teacher: avg per assignment
 * Access: teacher (self) or admin
 */
exports.classSummaryForTeacher = async (req, res, next) => {
  try {
    const teacherId = req.params.teacherId || req.user._id.toString();
    if (req.user.role === 'teacher' && req.user._id.toString() !== teacherId) {
      return res.status(403).json({ success:false, message:'Not allowed' });
    }

    const agg = await Submission.aggregate([
      // join assignment to filter by teacher
      {
        $lookup: {
          from: 'assignments',
          localField: 'assignment_id',
          foreignField: '_id',
          as: 'assignment'
        }
      },
      { $unwind: '$assignment' },
      { $match: { 'assignment.teacher_id': new mongoose.Types.ObjectId(teacherId), graded: true } },
      {
        $group: {
          _id: '$assignment._id',
          assignmentTitle: { $first: '$assignment.title' },
          avgGrade: { $avg: '$grade' },
          maxMarks: { $first: '$assignment.maxMarks' },
          count: { $sum: 1 }
        }
      },
      { $sort: { assignmentTitle: 1 } }
    ]);

    res.json({ success:true, summary: agg });
  } catch (err) { next(err); }
};
