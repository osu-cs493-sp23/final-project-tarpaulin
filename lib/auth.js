const jwt = require("jsonwebtoken")

const secretKey = "SuperSecret"

exports.generateAuthToken = function (email) {
    const payload = { sub: (email) }
    return jwt.sign(payload, secretKey, { expiresIn: "24h" })
}

exports.requireAuthentication = function (req, res, next) {
    console.log("== requireAuthentication()")
    const authHeader = req.get("Authorization") || ""
    const authHeaderParts = authHeader.split(" ")
    const token = authHeaderParts[0] === "Bearer" ?
        authHeaderParts[1] : null
    console.log("  -- token:", token)
    try {
        const payload = jwt.verify(token, secretKey)
        console.log("  -- payload:", payload)
        req.user = payload.sub
        next()
    } catch (err) {
        console.error("== Error verifying token:", err)
        res.status(401).send({
            error: "Invalid authentication token or no user is logged in."
        })
    }
}


/*
 * Checks from admin credentials to use on endpoints
 */
exports.isAdminLoggedIn = async function (email) {
    // use admin email to get info from DB
    const user = await getUserByEmail2(email, true)
    // pull admin field from info from DB
    const dbAdmin = await user.get('admin')

    // use this in endpoints??
    if (dbAdmin == true) {
      console.log('TEST IF CONDITION', dbAdmin)
    }


    return dbAdmin
  }