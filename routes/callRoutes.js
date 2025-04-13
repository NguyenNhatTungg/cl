const express = require('express');
const router = express.Router();
const callController = require('../controllers/callController');

router.get('/', callController.index);

module.exports = router;
