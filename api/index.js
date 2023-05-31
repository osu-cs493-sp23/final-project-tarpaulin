const { Router } = require('express')
const router = Router();

router.use('/assignments', require('./assignments'))
router.use('/courses', require('./courses'))
router.use('/submissions', require('./submissions'))
router.use('/users', require('./users'))

module.exports = router
