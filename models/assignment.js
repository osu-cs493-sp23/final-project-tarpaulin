const { DataTypes } = require('sequelize')
const sequelize = require('../lib/sequelize')
const Assignment = sequelize.define('assignment', {
  courseId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  dueDate: { type: DataTypes.DATE, allowNull: true}
})


Assignment.hasMany(users, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    foreignKey: {allowNull: false}
})


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