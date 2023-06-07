const { DataTypes } = require('sequelize')
const sequelize = require('../lib/sequelize')

const Course = require('./course')
const Submission = require('./submission')
const User = require('./user')

const Assignment = sequelize.define('assignment', {
  title: { type: DataTypes.STRING, allowNull: false },
  dueDate: { type: DataTypes.DATE, allowNull: true}
})


Assignment.hasMany(Submission, {
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  foreignKey: 'submissionId'
})
Submission.belongsTo(Assignment)


exports.Assignment = Assignment

/*
 * Export an array containing the names of fields the client is allowed to set
 * on photos.
 */
exports.AssignmentClientFields = [
  'courseId',
  'title',
  'dueDate',
  'studentSubmissions'
]