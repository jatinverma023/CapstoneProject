// controllers/assignmentController.js
const Assignment = require('../models/Assignment'); // adjust path
// Assumes req.user is set by your auth middleware and contains id (string)

exports.updateAssignment = async (req, res, next) => {
  try {
    const assignmentId = req.params.id;
    const teacherId = req.user.id || req.user._id;

    // Only allow certain fields to be updated
    const allowed = ['title', 'description', 'due_date', 'maxMarks', 'isActive', 'allowLateSubmission', 'rubric', 'attachments'];
    const updates = {};
    Object.keys(req.body).forEach(k => {
      if (allowed.includes(k)) updates[k] = req.body[k];
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided to update' });
    }

    const assignment = await Assignment.findOneAndUpdate(
      { _id: assignmentId, teacher_id: teacherId }, // enforce ownership
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('teacher_id', 'name email'); // optional, matches your GET

    if (!assignment) {
      // resource not found or not owned by this teacher
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    return res.json({ success: true, assignment });
  } catch (err) {
    next(err);
  }
};
