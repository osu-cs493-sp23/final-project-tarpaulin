const { DataTypes } = require('sequelize')
const sequelize = require('../lib/sequelize')

// Relevant types
const { Submission } = require("./submission.js")

// Schema describing various fields
const Assignment = sequelize.define('assignment', {
  // courseId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  dueDate: { type: DataTypes.DATE, allowNull: true},
  pointValue: { type: DataTypes.INTEGER, allowNull: false}
})

// Relation to users
Assignment.hasMany(Submission, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    foreignKey: {allowNull: false}
})
Submission.belongsTo(Assignment)

exports.Assignment = Assignment

exports.AssignmentClientFields = [
  'courseId',
  'title',
  'dueDate',
  'pointValue'
]