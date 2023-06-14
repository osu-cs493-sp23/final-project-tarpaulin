const { Router } = require('express')
const { ValidationError } = require('sequelize')

const { Assignment, AssignmentClientFields } = require('../models/assignment')
const { Submission, SubmissionsClientFields } = require('../models/submission')
const { Course } = require('../models/course')
const { User } = require("../models/user")
// const { includeInstructorInResult } = require("../api/courses")
const { requireAuthentication } = require('../lib/auth')
const { generateHATEOASlinks, getOnly} = require("../lib/pagination.js")

const EXCLUDE_ATTRIBUTES_LIST = ["createdAt", "updatedAt"]
const EXCLUDE_USER_ATTRIBUTES_LIST = EXCLUDE_ATTRIBUTES_LIST.concat(["password"])

const router = Router()

const subTypes = {
    "application/pdf": "pdf"
}
const multer = require('multer')
const crypto = require('node:crypto')
const fs = require("node:fs/promises")
const { containsAtLeastOneSchemaField } = require('../lib/validation')

const upload = multer({
  storage: multer.diskStorage({
    destination: `${__dirname}/uploads`,
    filename: (req, file, callback) => {
        const filename = crypto.pseudoRandomBytes(16).toString("hex")
        const extension = subTypes[file.mimetype]
        callback(null, `${filename}.${extension}`)
    }
  }),
  fileFilter: (req, file, callback) => {
      callback(null, !!subTypes[file.mimetype])
  },
}) 


// Post a new assignment
/*
 * Only an authenticated User with 'admin' role or an authenticated 
 * 'instructor' User whose ID matches the `instructorId` of the Course 
 * corresponding to the Assignment's `courseId` can create an Assignment.
 */
router.post('/', upload.single("file"), requireAuthentication, async function (req, res, next) {
  if(req.file && req.body.title && req.body.points && req.body.dueDate){
    // const pdf = {
    //   contentType: req.file.mimetype,
    //   filename: req.file.filename,
    //   path: req.file.path
    // }
    try {
      // const id = await savePdfFile(pdf)
      // await fs.unlink(req.file.path)
      // res.status(200).send({
      //   id: id
      // })
      const assignment = await Assignment.create(req.body, AssignmentClientFields)

      const assignment2 = await Assignment.findByPk(assignment.id)
      const courseIdFromAssignment = assignment2.courseId
      const course = await Course.findByPk(courseIdFromAssignment, {
        attributes: {exclude: EXCLUDE_ATTRIBUTES_LIST},
        include: includeInstructorInResult()
      })
      const instructorId = course.dataValues.users[0].id
      // console.log(instructorId)

      if(!(req.userRole === "admin" || (req.userRole === "instructor" && req.userId === instructorId))){
        res.status(403).json({
            error: "Unauthorized access to specified resource"
        })
      } else {
        res.status(201).send({ id: assignment.id })
      }

    } catch (e) {
      if (e instanceof ValidationError) {
        res.status(400).send({ error: e.message })
      } else {
        next(e)
      }
    }

  } else{
    res.status(400).send({
      err: "Invalid file"
    })
  }
})

// Get an assignment by ID
router.get('/:assignmentId', async function (req, res, next) {
    const assignmentId = req.params.assignmentId
    try {
      const assignment = await Assignment.findByPk(assignmentId)
      if (assignment) {
        res.status(200).send(assignment)
      } else {
        next()
      }
    } catch (e) {
      next(e)
    }
})

// Patch an assignment
/*
 * Only an authenticated User with 'admin' role or an
 * authenticated 'instructor' User whose ID matches the `instructorId`
 * of the Course corresponding to the Assignments `courseId` can update an Assignment.
 */
router.patch('/:assignmentId', requireAuthentication, async function (req, res, next) {
    const assignmentId = req.params.assignmentId
    try {
      /*
       * Update assignment without allowing client to update businessId or userId.
       */
      const assignment2 = await Assignment.findByPk(assignmentId)
      const courseIdFromAssignment = assignment2.courseId
      const course = await Course.findByPk(courseIdFromAssignment, {
        attributes: {exclude: EXCLUDE_ATTRIBUTES_LIST},
        include: includeInstructorInResult()
      })

      if (course) {
        const instructorId = course.dataValues.users[0].id
        // console.log(instructorId)
        if(!(req.userRole === "admin" || (req.userRole === "instructor" && req.userId === instructorId))) {
          res.status(403).json({
              error: "Unauthorized access to specified resource or Instructor is not allowed to modify Assignment."
          })
        } else {
          const result = await Assignment.update(req.body, {
            where: { id: assignmentId },
            fields: AssignmentClientFields.filter(
              field => field !== 'coursesId' && field !== 'userId' && field !== 'submissionsId'
            )
          })
          if (result[0] > 0) {
            res.status(204).send()
          } else {
            next()
          }
        }
      }

    } catch (e) {
      res.status(400).send({
        err: "Course does not exist."
      })
      next(e)
    }
})

// Delete endpoint
/*
 * Only an authenticated User with 'admin' role or an
 * authenticated 'instructor' User whose ID matches the `instructorId`
 * of the Course corresponding to the Assignments `courseId` can delete an Assignment.
 */
router.delete('/:assignmentId', requireAuthentication, async function (req, res, next) {
    const assignmentId = req.params.assignmentId
    try {
      const assignment2 = await Assignment.findByPk(assignmentId)
      const courseIdFromAssignment = assignment2.courseId
      const course = await Course.findByPk(courseIdFromAssignment, {
        attributes: {exclude: EXCLUDE_ATTRIBUTES_LIST},
        include: includeInstructorInResult()
      })

      if (course) {
        const instructorId = course.dataValues.users[0].id
        // console.log(instructorId)
        if(!(req.userRole === "admin" || (req.userRole === "instructor" && req.userId === instructorId))) {
          res.status(403).json({
              error: "Unauthorized access to specified resource or Instructor is not allowed to delete Assignment."
          })
        } else {
          const result = await Assignment.destroy({ where: { id: assignmentId }})
          if (result > 0) {
            res.status(204).send()
          } else {
            next()
          }
        }
      } else {
        res.status(400).send({
          err: "Unauthorized access to resource."
        })
      }
    } catch (e) {
      next(e)
    }
})

// Get all submissions for an assignment, paginated, authenticated via instructorId
/*
 * Only an authenticated User with 'admin' role or an
 * authenticated 'instructor' User whose ID matches the `instructorId`
 * of the Course corresponding to the Assignments `courseId` can fetch the Submissions
 * for an Assignment.
 * Code 403: Request was not made by an authenticated User.
 */
router.get('/:assignmentId/submissions', requireAuthentication, async function (req, res, next) {
  const submissionsPerPage = 10
  const assignmentId = req.params.assignmentId

  const assignment2 = await Assignment.findByPk(assignmentId)
  const courseIdFromAssignment = assignment2.courseId
  const course = await Course.findByPk(courseIdFromAssignment, {
    attributes: {exclude: EXCLUDE_ATTRIBUTES_LIST},
    include: includeInstructorInResult()
  })

  if (course) {
    const instructorId = course.dataValues.users[0].id
    // console.log(instructorId)
    // console.log(req.userId)
    if(!(req.userRole === "admin" || (req.userRole === "instructor" && req.userId === instructorId))) {
      res.status(403).json({
          error: "Unauthorized access to specified resource or Instructor is not allowed to fetch Assignment."
      })
    } else {
      var page = parseInt(req.query.page) || 1
  page = page < 1 ? 1 : page
  var offset = (page - 1) * submissionsPerPage

  var queryParams = getOnly(req.query, [
    "assignmentId", "studentId", "dueDate", "grade", "fileName"
  ])
  var result = null
  try {
    result = await Submission.findAndCountAll({
      where: {
        assignmentId: assignmentId,
      },
      limit: submissionsPerPage,
      offset: offset
    })
  } catch (e) {
    next(e)
    return
  }

  resultsPage = []
  result.rows.forEach((submission) => {
    resultsPage.push(submission)
  })

  var lastPage = Math.ceil(result.count / submissionsPerPage)
  res.status(200).json({
    submissions: resultsPage,
    links: generateHATEOASlinks(
      req.originalUrl.split("?")[0],
      page,
      lastPage,
      queryParams
    )
  })

    }
  } else {
    res.status(400).send({
      err: "Unauthorized access to resource."
    })
  }
})

// Post a new submission to an assignment, adds data to database, only student with role in courseId can submit
/*
 * Only an authenticated User with 'student' role who is enrolled
 * in the Course corresponding to the Assignment's `courseId` can
 * create a Submission.
 * Code 403: Request was not made by an authenticated User.
 */
router.post('/:assignmentId/submissions', requireAuthentication, upload.single('file'), async function (req, res, next) {
  console.log("  -- req.file:", req.file)
  console.log("  -- req.body:", req.body)

  if (req.file &&
    req.params.assignmentId &&
    req.body.studentId &&
    req.body.dueDate &&
    req.body.grade &&
    req.file.filename) {
    try {
      if (req.userRole == "student" && req.userId == req.body.studentId) {
        var submissionBody = {
          assignmentId: req.params.assignmentId,
          studentId: req.body.studentId,
          dueDate: req.body.dueDate,
          grade: req.body.grade,
          fileName: req.file.filename
        }
        const newSubmission = await Submission.create(submissionBody, SubmissionsClientFields)
        res.status(201).json({
          id: newSubmission.id
        })
      } else {
        res.status(403).send({
          err: "Unauthorized to access resource."
        })
      }

    } catch (e) {
      next(e)
    }
  } else {
    res.status(400).send({
        err: "Invalid file"
    })
  }
})


// Helper Functions

function includeInstructorInResult(exclude){
	var excludeList = EXCLUDE_USER_ATTRIBUTES_LIST
	if (exclude)
		excludeList.concat(exclude)

	return {
		model: User,
		as: "users",
		where: {role: "instructor"},
		through: {attributes: []},
		attributes: {exclude: excludeList}
	}
}

module.exports = router
