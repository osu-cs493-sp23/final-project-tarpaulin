const { Router } = require('express')
const { ValidationError } = require('sequelize')
const { Readable } = require("node:stream")


//Helpers
const { generateHATEOASlinks, getOnly} = require("../lib/pagination.js")
const { validateAgainstSchema } = require("../lib/validation.js")
const { generateRosterCSV } = require("../lib/csv.js")
const EXCLUDE_ATTRIBUTES_LIST = ["createdAt", "updatedAt"]
const EXCLUDE_USER_ATTRIBUTES_LIST = EXCLUDE_ATTRIBUTES_LIST.concat(["password"])





const { Assignment } = require('../models/assignment')
const { User } = require("../models/user")
const { Course, courseSchema, courseClientFields } = require('../models/course')

const router = Router()

/*
 * Link for all endpoints:    https://gist.github.com/robwhess/ec734c97a98868dbc1776718cd73b203
 */

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
                error: "The course conflicts with an existing course."
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
                    include: includeInstructorInResult()
        })
        const course = await Course.findByPk(courseId)
      if (course) {
        res.status(200).send(course)
      } else {
        console.log("Course not found")
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
router.delete('/:courseId', async function (req, res, next) {
    const courseId = req.params.courseId
    try {
      const result = await Course.destroy({ where: { id: courseId }})
      if (result > 0) {
        res.status(204).send()
      } else {
        console.log("No such course found")
        next()
      }
    } catch (e) {
      next(e)
    }
})


// Get all students enrolled in a course
router.get('/:courseId/students', async function (req, res, next) {
    const courseId = parseInt(req.params.courseId) || 0

    var course = null
    try{
        course = await Course.findByPk(courseId, {
            attributes: {exclude: EXCLUDE_ATTRIBUTES_LIST},
            include: includeInstructorInResult
        })
    } catch (err){
        console.log("Course not found")
        next(err)
    }
    if(!course){
        next()
        return
    }

    if(!(req.user.role === "admin" || (req.user.role === "instructor" && req.user.id === course.dataValues.users[0].id))){
        res.status(403).json({
            error: "Unauthorized access to specified resource"
        })
        return
    }

    const courseRoster = await getCourseStudentsList(courseId)

    if (courseRoster.status !== 200){
        var errStr = undefined
        if (courseRoster.status !== 404){
            errStr = "Server error. Please try again later"
        }
        next(errStr)
        return
    }

    res.status(200).json({
        students: courseRoster.data
    })
})


// Update enrolled students for a course, takes an object with add and remove arrays
// router.post('/:courseId/students', async function (req, res, next){
// })


// Unique ID of a Course, fetch a CSV file containing list of students enrolled in the course
router.get('/:courseId/roster', async function (req, res, next) {
    const courseId = parseInt(req.params.courseId) || 0

    var course = null
	try {
		course = await Course.findByPk(courseId, {
			attributes: {exclude: EXCLUDE_ATTRIBUTES_LIST},
			include: includeInstructorInResult()
		})
	} catch (err){
		next(err)
		return
	}

	if (!course){
		next()
		return
	}

	if (!(req.user.role === "admin" || (req.user.role === "instructor" && req.user.id === course.dataValues.users[0].id))){
		res.status(403).json({
			error: "Unauthorized access to specified resource."
		})
		return
	}

	const courseRosterObj = await getCourseStudentsList(courseId)

	if (courseRosterObj.status !== 200){
		var errStr = undefined
		if (courseRosterObj.status !== 404){
			errStr = "server error"
		}
		next(errStr)
		return
	}

	var csv = null
	try {
		csv = await generateRosterCSV(courseRosterObj.data)
	} catch (err){
		next(err)
	}
	
	//convert csv buffer to stream and send to user
	Readable.from(csv).pipe(res.status(200).contentType("text/csv"))

})


// Get all assignments in a course
router.get('/:courseId/assignments', async function (req, res, next) {
    var courseId = parseInt(req.params.courseId) || 0

    var results = null
    try{
        results = await Assignment.findAll({
            where: { courseId: courseId },
            attributes: {exclude: EXCLUDE_ATTRIBUTES_LIST.concat("courseId")}
        })
    } catch (err){
        next(err)
        return
    }

    if(results.length < 1){
        next()
        return
    }

    res.status(200).json({
        assignment: results
    })
})



//Helper functions


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


async function getCourseStudentsList(courseId){
	var rosterObj = {
		data: [],
		status: 200
	}
	
	//check first if the requested course exists
	try {
		if (!courseExistsInDb(courseId)){
			rosterObj.status = 404
			return rosterObj
		}
	} catch (err){
		rosterObj.status = 500
		return rosterObj
	}

	//query the database
	var courseListResult = null
	try {
		courseListResult = await User.findAll({
			where: {role: "student"},
			attributes: {exclude: EXCLUDE_USER_ATTRIBUTES_LIST.concat(["role", "admin"])},
			include: {
				model: Course,
				as: "courses",
				where: {id: courseId},
				through: {attributes: []},
				attributes: {exclude: EXCLUDE_ATTRIBUTES_LIST}
			}
		})
	} catch (err){
		rosterObj.status = 500
		return rosterObj
	}

	//restructure the data from the database into rosterObj.data
	courseListResult.forEach(student => {
		rosterObj.data.push({
			...student.dataValues,
			courses: undefined
		})
	})
	rosterObj.status = 200

	// return courseList
	return rosterObj
}





module.exports = router
