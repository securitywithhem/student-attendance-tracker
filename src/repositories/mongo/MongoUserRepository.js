const { isValidObjectId } = require('mongoose');
const { User } = require('../../models/User');
const { toUser } = require('./mappers');

class MongoUserRepository {
  async findByEmailWithPassword(email) {
    const doc = await User.findOne({ email: String(email).toLowerCase().trim() }).lean();
    return toUser(doc, true);
  }

  async findById(id) {
    if (!isValidObjectId(id)) return null;
    return toUser(await User.findById(id).lean());
  }

  async findByIds(ids) {
    const docs = await User.find({ _id: { $in: ids } })
      .sort({ rollNo: 1, name: 1 })
      .lean();
    return docs.map((d) => toUser(d));
  }

  async countByRole() {
    const rows = await User.aggregate([{ $group: { _id: '$role', n: { $sum: 1 } } }]);
    return Object.fromEntries(rows.map((r) => [r._id, r.n]));
  }
}

module.exports = { MongoUserRepository };
