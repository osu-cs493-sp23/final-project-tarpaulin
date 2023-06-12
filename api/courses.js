const { Router } = require('express')
const { ValidationError } = require('sequelize')
const { Readable } = require("node:stream")


//Helpers
const { generateHATEOASlinks, getOnly} = require("../lib/pagination.js")
const { validateAgainstSchema } = require("../lib/validation.js")
// const { generateRosterCSV } = require("../lib/csv.js")
const EXCLUDE_ATTRIBUTES_LIST = ["createdAt", "updatedAt"]
const EXCLUDE_USER_ATTRIBUTES_LIST = EXCLUDE_ATTRIBUTES_LIST.concat(["password"])





const { Assignment } = require('../models/assignment')
const { User } = require("../models/user")
const { Course, courseSchema, courseClientFields } = require('../models/course')

const router = Router()

/*
 * Link for all endpoints:    https://gist.github.com/robwhess/ec734c97a98868dbc1776718cd73b203
 */

// Post a new course
// Only an authenticated User with 'admin' role can create a new Course.

//// This section was in main, but not endpoints so I commented it out

// router.post('/', getRole, requireAuthentication, async function (req, res, next) {
//     try {
//       if (req.userRole == "admin") {
//         const course = await Course.create(req.body, courseClientFields)

//         if (course) {
//           res.status(201).send({
//             id: course.id
//           })
//         } else {
//           res.status(400).send({
//             error: "Invalid instructor."
//           })
//         }
//       } else {
//         res.status(400).send({
//           error: "Invalid admin authorization."
//         })
//       }
//     } catch (e) {
//       if (e instanceof ValidationError) {
//         res.status(400).send({ error: e.message })
//       } else {
//         next(e)
//       }
//     }
// })

// // Patch an course
// router.patch('/:courseId', async function (req, res, next) {
//     const assignmentId = req.params.assignmentId
//     try {
//       /*
//        * Update course without allowing client to update businessId or userId.
//        */
//       const result = await Course.update(req.body, {
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

// // Delete endpoint
// router.delete('/:courseId', async function (req, res, next) {
//     const assignmentId = req.params.assignmentId
//     try {
//       const result = await Course.destroy({ where: { id: assignmentId }})
//       if (result > 0) {
//         res.status(204).send()
//       } else {
//         next()
//       }
//     } catch (e) {
//       next(e)
//     }
// })


// Course roster download
// Download a CSV formatted roster for a specific course
// id,name,email
// router.get('/:courseId/roster', async function (req, res, next) {
// })

// Get all courses
router.get("/", async function (req, res, next){
    const coursesPerPage = 10

    var page = parseInt(req.query.page) || 1
    page = page < 1 ? 1 : page
    var offset = (page -1) * coursesPerPage

    var queryParams = getOnly(req.query, ["subject", "number", "term"])
    var result = null
    try {
        result = await Course.findAndCountAll({
            where: queryParams,
            limit: coursesPerPage,
            offset: offset,
            attributes: {},
            include: includeInstructorInResult()
        })
    } catch (err){
        next(err)
        return
    }
    resultsPage = []
    result.rows.forEach((course) => {
        resultsPage.push(courseResponseFormSequelizeModel(course))
    })

    var lastPage = Math.ceil(result.count / coursesPerPage)
    res.status(200).json({
        courses: resultsPage,
        links: generateHATEOASlinks(
            req.originalUrl.split("?")[0],
            page,
            lastPage,
            queryParams
        )
    })
})


// Post a new course
router.post('/', async function (req, res, next) {
    // if(!(req.user.role === "admin")){
    //     res.status(403).json({
    //         error: "The request was not made by an authenticated User satisfying the authorization criteria"
    //     })
    // }

    var newCourse = req.body
    if(!validateAgainstSchema(newCourse, courseSchema)){
        res.status(400).json({
                error: "The request body was either not present or did not contain a valid Course object."
        })
        return
    }

    var course = {}
    try {
        course = await Course.create(newCourse, courseClientFields)
        await course.addUser(newCourse.instructorId)
    } catch (err){
        if (err instanceof ValidationError){
            res.status(400).json({
                error: "The request body was either not present or did not contain a valid Course object."
            })
        } else {
            next(err)
        }
        return
    }
    res.status(201).json({id: course.id})  

})    
    
    
    
    
    
    


// Get an course by ID
router.get('/:courseId', async function (req, res, next) {
    const courseId = req.params.courseId


    var courseResult = null
    try {
        courseResult = await Course.findByPk(courseId, {
                            attributes: {exclude: EXCLUDE_ATTRIBUTES_LIST},
                            include: includeInstructorInCourseSearch})
        const course = await Course.findByPk(courseId)
      if (course) {
        res.status(200).send(course)
      } else {
        next()
      }
    } catch (e) {
      next(e)
    }
})

// Patch an course
// router.patch('/:courseId', async function (req, res, next) {
//     const assignmentId = req.params.assignmentId
//     try {
//       /*
//        * Update course without allowing client to update businessId or userId.
//        */
//       const result = await Course.update(req.body, {
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
// router.delete('/:courseId', async function (req, res, next) {
//     const assignmentId = req.params.assignmentId
//     try {
//       const result = await Course.destroy({ where: { id: assignmentId }})
//       if (result > 0) {
//         res.status(204).send()
//       } else {
//         next()
//       }
//     } catch (e) {
//       next(e)
//     }
// })


// Get all students enrolled in a course
// router.get('/:courseId/students', async function (req, res, next) {
// })


// Update enrolled students for a course, takes an object with add and remove arrays
// router.post('/:courseId/students', async function (req, res, next){
// })


// Unique ID of a Course, fetch a CSV file containing list of students enrolled in the course
// router.get('/:courseId/roster', async function (req, res, next) {
// })


// Get all assignments in a course
// router.get('/:courseId/assignments', async function (req, res, next) {
// })






function includeInstructorInResult(exclude){
	var xcldUsrAttrLst = EXCLUDE_USER_ATTRIBUTES_LIST
	if (exclude)
		xcldUsrAttrLst.concat(exclude)

	return {
		model: User,
		as: "users",
		where: {role: "instructor"},
		through: {attributes: []},
		attributes: {exclude: xcldUsrAttrLst}
	}
}








module.exports = router
