const { Schema, model } = require('mongoose');

const STATUSES = ['present', 'late', 'absent'];

const attendanceSchema = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    /** Calendar date as YYYY-MM-DD (no time zone ambiguity). */
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    status: { type: String, enum: STATUSES, required: true },
    markedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// One record per student per course per day — the database-level guard against duplicates.
attendanceSchema.index({ course: 1, student: 1, date: 1 }, { unique: true });
// Student history and dashboard queries.
attendanceSchema.index({ student: 1, date: -1 });
// "Was this course already marked on this date?" and course summaries.
attendanceSchema.index({ course: 1, date: 1 });

module.exports = { Attendance: model('Attendance', attendanceSchema), STATUSES };
