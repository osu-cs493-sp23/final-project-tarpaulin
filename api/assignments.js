const { Router } = require('express')
const { ValidationError } = require('sequelize')

const { Assignment, AssignmentClientFields } = require('../models/assignment')
const { Submission, SubmissionsClientFields } = require('../models/submission')

const router = Router()

const subTypes = {
    "application/pdf": "pdf"
}
const multer = require('multer')
const crypto = require('node:crypto')
const fs = require("node:fs/promises")

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
router.post('/', upload.single("file"), async function (req, res, next) {
  if(req.file && req.body.title && req.body.points && req.body.dueDate){
    const pdf = {
      contentType: req.file.mimetype,
      filename: req.file.filename,
      path: req.file.path
    }
    try {
      // const id = await savePdfFile(pdf)
      // await fs.unlink(req.file.path)
      // res.status(200).send({
      //   id: id
      // })
      const assignment = await Assignment.create(req.body, AssignmentClientFields)
      res.status(201).send({ id: assignment.id })
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
router.patch('/:assignmentId', async function (req, res, next) {
    const assignmentId = req.params.assignmentId
    try {
      /*
       * Update assignment without allowing client to update businessId or userId.
       */
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
    } catch (e) {
      next(e)
    }
})

// Delete endpoint
router.delete('/:assignmentId', async function (req, res, next) {
    const assignmentId = req.params.assignmentId
    try {
      const result = await Assignment.destroy({ where: { id: assignmentId }})
      if (result > 0) {
        res.status(204).send()
      } else {
        next()
      }
    } catch (e) {
      next(e)
    }
})

// Get all submissions for an assignment, paginated, authenticated via instructorId
router.get('/:assignmentId/submissions', async function (req, res, next) {
  const assignmentId = req.params.assignmentId
  try {
    const submissions = await Submission.findAll({
      where: {
        assignmentId: assignmentId
      }
    })
    if (submissions) {
      res.status(200).send(submissions)
    } else {
      next()
    }
  } catch (e) {
    next(e)
  }
})

// Post a new submission to an assignment, adds data to database, only student with role in courseId can submit
router.post('/:assignmentId/submissions', upload.single('sub'), async (req, res, next) => {
  console.log("  -- req.sub:", req.sub)
  console.log("  -- req.body:", req.body)
  if (req.sub && req.body) {
    try {
      var newSubmission = {
        assignmentId: req.params.assignmentId,
        studentId: req.body.studentId,
        dueDate: req.body.dueDate,
        grade: req.body.grade,
        path: req.sub.path
      }
      res.status(201).json(newSubmission)
    } catch (e) {
      next(e)
    }
  } else {
    res.status(400).send({
        err: "Invalid file"
    })      
  }
})



module.exports = router
