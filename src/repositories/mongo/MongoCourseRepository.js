const { Course } = require('../../models/Course');
const { toCourse } = require('./mappers');

class MongoCourseRepository {
  async findById(id) {
    return toCourse(await Course.findById(id).lean());
  }

  async findAll() {
    return (await Course.find().sort({ code: 1 }).lean()).map(toCourse);
  }

  async findByFaculty(facultyId) {
    return (await Course.find({ faculty: facultyId }).sort({ code: 1 }).lean()).map(toCourse);
  }

  async findByStudent(studentId) {
    return (await Course.find({ students: studentId }).sort({ code: 1 }).lean()).map(toCourse);
  }
}

module.exports = { MongoCourseRepository };
