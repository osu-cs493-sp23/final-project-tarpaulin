const jwt = require("jsonwebtoken")

const secretKey = "SuperSecret"

exports.generateAuthToken = function (user) {
    const payload = {
        sub: user.email,
        id: user.id,
        role: user.role
    }
    console.log(payload)
    return jwt.sign(payload, secretKey, { expiresIn: "24h" })
}

exports.requireAuthentication = function (req, res, next) {
    // console.log("== requireAuthentication()")
    const authHeader = req.get("Authorization") || ""
    const authHeaderParts = authHeader.split(" ")
    const token = authHeaderParts[0] === "Bearer" ?
        authHeaderParts[1] : null
    // console.log("  -- token:", token)
    try {
        const payload = jwt.verify(token, secretKey)
        // console.log("  -- payload:", payload)
        req.userEmail = payload.sub
        req.userId = payload.id
        req.userRole = payload.role
        // console.log(req.userEmail)
        next()
    } catch (err) {
        console.error("== Error verifying token:", err)
        res.status(401).send({
            error: "Invalid authentication token or no user is logged in."
        })
    }
}


/*
 * Get role from token
 */
exports.getRole = function(req, res, next) {
    const authHeader = req.get('Authorization') || '';
    const authHeaderParts = authHeader.split(' ');
    const token = authHeaderParts[0] === 'Bearer' ? authHeaderParts[1] : null;

    try {
      const payload = jwt.verify(token, secretKey);
      const userRole = payload.role;
    //   console.log(userRole)

    } catch (err) {
      req.userRole = "student";
    }

    next();
  }