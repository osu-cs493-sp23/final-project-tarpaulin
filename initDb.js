/*
 * This file contains a simple script to populate the database with initial
 * data from the files in the data/ directory.
 */

require("dotenv").config()
const sequelize = require('./lib/sequelize')
const { Assignment, AssignmentsClientFields } = require('./models/assignment')
const { Course, CoursesClientFields } = require('./models/course')
const { Submission, SubmissionsClientFields } = require('./models/submission')
const { User, UserClientFields } = require('./models/user')


const assignmentsData = require('./data/assignments.json')
const coursesData = require('./data/courses.json')
const submissionData = require('./data/submissions.json')
const userData = require('./data/users.json')


sequelize.sync({ force: true}).then(async function () {
  await Assignment.bulkCreate(assignmentsData, { fields: AssignmentsClientFields })
  await Course.bulkCreate(coursesData, { fields: CoursesClientFields })
  await Submission.bulkCreate(submissionData, { fields: SubmissionsClientFields })
  await User.bulkCreate(userData, { fields: UserClientFields })
})