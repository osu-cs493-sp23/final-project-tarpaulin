const { DataTypes } = require('sequelize')
const sequelize = require('../lib/sequelize')

const Assignment = require('./assignment')
const Course = require('./course')
const Submission = require('./submission')

const User = sequelize.define('user', {
	role: {
		type: DataTypes.STRING,
		defaultValue: 'student',
		allowNull: true,
		validate: {
			isIn: ['instructor', 'admin', 'student']
		}
	}
})
exports.User= User

exports.UserClientFields = [
	'role'
]