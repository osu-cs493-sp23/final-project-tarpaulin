require('dotenv').config()

const express = require('express')
const morgan = require('morgan')

const api = require('./api')
const { connectToDb } = require('./lib/mongo')

const app = express()
const port = process.env.PORT || 8000

const imageTypes = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif"
}

// app.use(express.json())

const upload = multer({
    storage: multer.diskStorage({
        destination: `${__dirname}/uploads`,
        filename: (req, file, callback) => {
            const filename = crypto.pseudoRandomBytes(16).toString("hex")
            const extension = imageTypes[file.mimetype]
            callback(null, `${filename}.${extension}`)
        }
    }),
    fileFilter: (req, file, callback) => {
        callback(null, !!imageTypes[file.mimetype])
    }
})


/*
 * Morgan is a popular logger.
 */
app.use(morgan('dev'))

app.use(express.json())

app.use("/media/images", express.static("uploads/"))

app.get('/', (req, res, next) => {
    res.status(200).sendFile(__dirname + '/index.html')
})

app.post("/images", upload.single("image"), async function (req, res, next) {
    console.log("  -- req.file:", req.file)
    console.log("  -- req.body:", req.body)
    if (req.file && req.body && req.body.userId) {
        const image = {
            contentType: req.file.mimetype,
            filename: req.file.filename,
            path: req.file.path,
            userId: req.body.userId
        }
        const id = await saveImageInfo(image)
        res.status(200).send({
            id: id
        })
    } else {
        res.status(400).send({
            err: "Invalid file"
        })
    }
})


app.get('/images/:id', async (req, res, next) => {
    try {
        const image = await getImageInfoById(req.params.id)
        if (image) {
            delete image.path
            image.url = `/media/images/${image.filename}`
            res.status(200).send(image)
        } else {
            next()
        }
    } catch (err) {
        next(err)
    }
})

app.use('*', (req, res, next) => {
    res.status(404).send({
        err: "Path " + req.originalUrl + " does not exist"
    })
})

/*
 * This route will catch any errors thrown from our API endpoints and return
 * a response with a 500 status to the client.
 */
app.use('*', (err, req, res, next) => {
    console.error("== Error:", err)
    res.status(500).send({
        err: "Server error.  Please try again later."
    })
})

connectToDb(() => {
    app.listen(port, () => {
        console.log("== Server is running on port", port)
    })
})
