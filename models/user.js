const { DataTypes } = require('sequelize')
const sequelize = require('../lib/sequelize')
const bcrypt = require("bcryptjs")

const { Assignment } = require('./assignment')
const { Course } = require('./course')
const { Submission } = require('./submission')


const User = sequelize.define('user', {
	name: { type: DataTypes.TEXT, allowNull: false},
	email: { type: DataTypes.STRING, allowNull: false, unique: true,
		validate: {
			isEmail: {
				msg: "Email already exists!",
			}
		}},
	password: { type: DataTypes.STRING, allowNull: false,
		set(value) {
			const hash = bcrypt.hashSync(value, 8)
			this.setDataValue('password', hash)
		}},
	role: {
		type: DataTypes.STRING,
		defaultValue: 'student',
		allowNull: true,
		validate: {
			isIn: [['instructor', 'admin', 'student']]
		}
	}
})
exports.User= User

exports.UserClientFields = [
	'name',
	'email',
	'password',
	'role'
]

exports.User = User



// MONGO VERSIONS OF FUNCTIONS
// exports.insertNewUser = async function (user) {
//     const userToInsert = extractValidFields(user, UserSchema)

//     const hash = await bcrypt.hash(userToInsert.password, 8)
//     userToInsert.password = hash
//     console.log("  -- userToInsert:", userToInsert)

//     const db = getDb()
//     const collection = db.collection('users')
//     const result = await collection.insertOne(userToInsert)
//     return result.insertedId
// }

// async function getUserById (id, includePassword) {
//     const db = getDb()
//     const collection = db.collection('users')
//     if (!ObjectId.isValid(id)) {
//         return null
//     } else {
//         const results = await collection
//             .find({ _id: new ObjectId(id) })
//             .project(includePassword ? {} : { password: 0 })
//             .toArray()
//         return results[0]
//     }
// }
// exports.getUserById = getUserById
// 
// exports.validateUser = async function (id, password) {
//     const user = await getUserById(id, true)
//     return user && await bcrypt.compare(password, user.password)
// }
