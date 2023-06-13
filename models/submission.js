const { DataTypes } = require('sequelize')
const sequelize = require('../lib/sequelize')



// Schema describing various fields
const Submission = sequelize.define('submission', {
  assignmentId: {type: DataTypes.INTEGER, allowNull: false},
  studentId: {type: DataTypes.INTEGER, allowNull: false},
  dueDate: { type: DataTypes.DATE, allowNull: false},
  grade: { type: DataTypes.FLOAT, allowNull: false },
  fileName: { type: DataTypes.STRING, allowNull: false }
})


exports.Submission = Submission

exports.SubmissionClientFields = [
  'assignmentId',
  'studentId',
  'dueDate',
  'grade',
  'fileName'
]
