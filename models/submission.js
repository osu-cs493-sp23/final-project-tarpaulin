const { DataTypes } = require('sequelize')
const sequelize = require('../lib/sequelize')

const { User } = require('./user')
const { Assignment } = require('./assignment')

// Schema describing various fields
const Submission = sequelize.define('submission', {
  assignmentId: {type: DataTypes.INTEGER, allowNull: false},
  studentId: {type: DataTypes.INTEGER, allowNull: false},
  time: { type: DataTypes.DATE, allowNull: false},
  grade: { type: DataTypes.FLOAT, allowNull: false },
  file: { type: DataTypes.STRING, allowNull: false }
})

// Relations
User.hasMany(Submission, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    foreignKey: {allowNull: false}
})
Submission.belongsTo(User)

exports.Submission = Submission
