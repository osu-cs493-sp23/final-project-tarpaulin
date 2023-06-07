const { DataTypes } = require('sequelize')
const sequelize = require('../lib/sequelize')

const Assignment = require('./assignment')
const Submission = require('./submission')
const User = require('./user')

const Course = sequelize.define('course', {
	subCode: { type: DataTypes.STRING, allowNull: false },
	number: { type: DataTypes.STRING, allowNull: false },
	tite: { type: DataTypes.STRING, allowNull: false }
})

Course.hasMany(Assignment, {
	onDelete: 'CASCADE',
	onUpdate: 'CASCADE',
	foreignKey: 'courseId'
})
Assignment.belongsTo(Course)

exports.Course = Course