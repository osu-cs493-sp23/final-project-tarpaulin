const { DataTypes } = require('sequelize')
const sequelize = require('../lib/sequelize')

const { Submission } = require('./submission')
const { User } = require('./user')

const Assignment = sequelize.define('assignment', {
  title: { type: DataTypes.STRING, allowNull: false },
  dueDate: { type: DataTypes.DATE, allowNull: true}
})


Assignment.hasMany(Submission, {
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  foreignKey: { allowNull: false }
})
// User.belongsToMany(Submission)


exports.Assignment = Assignment
