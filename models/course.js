const { DataTypes } = require('sequelize')
const sequelize = require('../lib/sequelize')
// Relevant types
const { Assignment } = require("./assignment.js")
const { User } = require("./user.js")



// Schema describing various fields
const fields = {
    number: { type: DataTypes.STRING, allowNull: false, unique: false },
    subject: { type: DataTypes.STRING, allowNull: false, unique: false },
    title: { type: DataTypes.STRING, allowNull: false, unique: false },
    term: { type: DataTypes.STRING, allowNull: false, unique: false}
    // instructorId: { type: DataTypes.INTEGER, allowNull: false},
}

const Course = sequelize.define('course', fields, {
    indexes: [
        {
            unique: true,
            fields: ["subject", "number", "term"]
        }
    ]
})

exports.Course = Course
exports.courseSchema = fields
exports.courseClientFields = Object.keys(fields)

Course.hasMany(Assignment, {
	onDelete: "CASCADE",
	onUpdate: "CASCADE",
	foreignKey: {allowNull: false}
})
Assignment.belongsTo(Course)

const UserCourse = sequelize.define("usercourse", {}, {
	timestamps: false,
	indexes: [
		{
			unique: true,
			fields: ["courseId", "userId"]
		}
	]
})
Course.belongsToMany(User, {
	through: UserCourse,
	as: "users",
	foreignKey: "courseId",
	onDelete: "CASCADE",
	onUpdate: "CASCADE",
})
User.belongsToMany(Course, {
	through: UserCourse,
	as: "courses",
	foreignKey: "userId",
	onDelete: "CASCADE",
	onUpdate: "CASCADE",
})
exports.UserCourse = UserCourse
exports.courseSchema.instructorId = {type: DataTypes.INTEGER, allowNull: false, unique: false}