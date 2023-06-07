const { DataTypes } = require('sequelize')
const sequelize = require('../lib/sequelize')


// Schema describing various fields
const Submission = sequelize.define('submission', {
  studentId: { type: DataTypes.INTEGER, allowNull: false },
  score: { type: DataTypes.INTEGER, allowNull: false },
  content: { type: DataTypes.STRING, allowNull: false },
  time: { type: DataTypes.DATE, allowNull: false}
})

// Relations
exports.Submission = Submission
