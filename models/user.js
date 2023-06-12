const { DataTypes } = require('sequelize')
const sequelize = require('../lib/sequelize')
const bcrypt = require("bcryptjs")


const User = sequelize.define('user', {
	name: { type: DataTypes.TEXT, allowNull: false },
	email: { type: DataTypes.STRING, allowNull: false, unique: true,
	  validate: {
		isEmail: {
		  msg: "Email already exists!",
		}
	  },
	},
	password: {
	  type: DataTypes.STRING,
	  allowNull: false,
	  set(value) {
		const hash = bcrypt.hashSync(value, 8)
		this.setDataValue('password', hash)
	  },
	},
	role: {
		type: DataTypes.STRING,
		defaultValue: 'student',
		allowNull: false,
		validate: {
			isIn: [['instructor', 'admin', 'student']]
		}
	},
},
{
defaultScope: {
	attributes: {
	exclude: ['password']
	}
},
// No special options for admin scope. No exclusion.
scopes: {
	admin: {},
	instructor: {}
}
})

exports.User = User


exports.UserClientFields = [
	'name',
	'email',
	'password',
	'role'
]

exports.User = User

/*
 * Find user by email
 */
async function getUserByEmail2(email, includePassword) {
	const userEmail = await User.unscoped().findOne({ where: { email: email }})
	return userEmail
  }
  exports.getUserByEmail2 = getUserByEmail2


/*
 * Validate user in database
 */
exports.validateUser = async function (email, password) {
	const user = await getUserByEmail2(email, true)
	const dbPassword = await user.getDataValue('password')
	return user && await bcrypt.compare(password, dbPassword)
  }

