const { Router } = require('express')
const path = require('path')
// const { ValidationError } = require('sequelize')
// const { Assignment } = require('../models/assignment')
// const { Course } = require('../models/course')
const { Submission } = require('../models/submission')
// const { User } = require('../models/user')
const router = Router()


router.get('/:fileName', async function (req, res, next) {
	try {
			const filePath = path.join(__dirname, 'uploads', req.params.fileName)
			console.log(" -- filePath", filePath)
			res.sendFile(filePath)
		} catch (e) {
			next(e)
		}
	})

// Routes for debugging purposes only
// Please note that submissions are all dependent on other endpoints, and should not be accessed seperately
////////////////////////////////



// Post a new submission
/*
 * Only an authenticated User with 'student' role who is enrolled in the
 * Course corresponding to the Assignment's `courseId` can create a Submission.
 */
// router.post('/', async function (req, res, next) {
//     try {
//       const submission = await Submission.create(req.body, AssignmentClientFields)
//       res.status(201).send({ id: submission.id })
//     } catch (e) {
//       if (e instanceof ValidationError) {
//         res.status(400).send({ error: e.message })
//       } else {
//         next(e)
//       }
//     }
// })

// Get an submission by ID
// router.get('/:submissionId', async function (req, res, next) {
//     const assignmentId = req.params.assignmentId
//     try {
//       const submission = await Submission.findByPk(assignmentId)
//       if (submission) {
//         res.status(200).send(submission)
//       } else {
//         next()
//       }
//     } catch (e) {
//       next(e)
//     }
// })

// Patch an submission
// router.patch('/:submissionId', async function (req, res, next) {
//     const assignmentId = req.params.assignmentId
//     try {
//       /*
//        * Update submission without allowing client to update businessId or userId.
//        */
//       const result = await Submission.update(req.body, {
//         where: { id: assignmentId },
//         fields: AssignmentClientFields.filter(
//           field => field !== 'coursesId' && field !== 'userId' && field !== 'submissionsId'
//         )
//       })
//       if (result[0] > 0) {
//         res.status(204).send()
//       } else {
//         next()
//       }
//     } catch (e) {
//       next(e)
//     }
// })

// Delete endpoint
// router.delete('/:submissionId', async function (req, res, next) {
//     const assignmentId = req.params.assignmentId
//     try {
//       const result = await Submission.destroy({ where: { id: assignmentId }})
//       if (result > 0) {
//         res.status(204).send()
//       } else {
//         next()
//       }
//     } catch (e) {
//       next(e)
//     }
// })




module.exports = router