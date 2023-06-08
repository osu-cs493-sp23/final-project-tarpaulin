const { DataTypes } = require('sequelize')
const sequelize = require('../lib/sequelize')

const { Assignment } = require('./assignment')
const { User } = require('./user')

const Submission = sequelize.define('submission', {
  grade: { type: DataTypes.STRING, allowNull: false },
  timeStamp: { type: DataTypes.DATE, allowNull: false },
  file: {type: DataTypes.STRING, allowNull: false}
})

// Submission.hasOne(Assignment, {
// 	onDelete: 'CASCADE',
// 	onUpdate: 'CASCADE',
// 	foreignKey: { allowNull: false }
// })
// Assignment.belongsTo(Submission)

// Submission.hasOne(User, {
// 	onDelete: 'CASCADE',
// 	onUpdate: 'CASCADE',
// 	foreignKey: { allowNull: false }
// })
// User.hasMany(Submission)

exports.Submission = Submission
