const { DataTypes } = require('sequelize')

const sequelize = require('../lib/sequelize')
// Relevant types
const { Submission } = require("./submission.js")
const { Assignment }= require("./assignment.js")
const { User }= require("./user.js")


// Schema describing various fields
const fields = {
    courseNumber: { type: DataTypes.STRING, allowNull: false },
    subject: { type: DataTypes.STRING, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    term: { type: DataTypes.STRING, allowNull: false},
    instructorId: { type: DataTypes.INTEGER, allowNull: false},
}

const Course = sequelize.define('course', fields, {
    idx: [
        {
            unique: true,
            fields: ["subject", "number", "term"]
        }
    ]
})

exports.Course = Course
exports.courseClientFields = Object.keys(fields)
exports.courseClientFields.push("instructorId")
