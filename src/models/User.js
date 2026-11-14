const { Schema, model } = require('mongoose');

const ROLES = ['admin', 'faculty', 'student'];

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, required: true },
    rollNo: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = { User: model('User', userSchema), ROLES };
