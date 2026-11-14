const { Schema, model } = require('mongoose');

const courseSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    faculty: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    students: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
  },
  { timestamps: true }
);

module.exports = { Course: model('Course', courseSchema) };
