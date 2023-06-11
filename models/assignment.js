const { DataTypes } = require('sequelize')
const sequelize = require('../lib/sequelize')

// Relevant types
const { Submission } = require("./submission.js")
const { Course } = require("./course.js")

// Schema describing various fields
const Assignment = sequelize.define('assignment', {
  courseId:{ type: DataTypes.INTEGER, allowNull: false},
  title: { type: DataTypes.STRING, allowNull: false },
  points: { type: DataTypes.INTEGER, allowNull: false},
  dueDate: { type: DataTypes.DATE, allowNull: false}  
})

// Relations
Assignment.hasMany(Submission, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    foreignKey: {allowNull: false}
})
Submission.belongsTo(Assignment)

Course.hasMany(Assignment, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    foreignKey: {allowNull: false}
})

exports.Assignment = Assignment

exports.AssignmentClientFields = [
  'courseId',
  'title',
  'dueDate',
  'pointValue'
]