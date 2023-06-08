const { DataTypes } = require('sequelize')
const sequelize = require('../lib/sequelize')

const { Assignment } = require('./assignment')
const { Course } = require('./course')
const { Submission } = require('./submission')

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

// User.hasMany(Assignment, {
// 	onDelete: 'CASCADE',
// 	onUpdate: 'CASCADE',
// 	foreignKey: { allowNull: false }
// })
// Assignment.belongsTo(User)

// User.hasMany(Course, {
// 	onDelete: 'CASCADE',
// 	onUpdate: 'CASCADE',
// 	foreignKey: { allowNull: false }
// })
// // Course.belongsToMany(User)

// User.hasMany(Submission, {
// 	onDelete: 'CASCADE',
// 	onUpdate: 'CASCADE',
// 	foreignKey: { allowNull: false }
// })
// Submission.belongsTo(User)

exports.User = User
