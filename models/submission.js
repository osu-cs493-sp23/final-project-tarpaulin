const { DataTypes } = require('sequelize')
const sequelize = require('../lib/sequelize')

const { User } = require('./user')
const { Assignment } = require('./assignment')

// Schema describing various fields
const Submission = sequelize.define('submission', {
  score: { type: DataTypes.INTEGER, allowNull: false },
  content: { type: DataTypes.STRING, allowNull: false },
  time: { type: DataTypes.DATE, allowNull: false}
})

// Relations
User.hasMany(Submission, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    foreignKey: {allowNull: false}
})
Submission.belongsTo(User)

exports.Submission = Submission
