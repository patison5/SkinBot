const balanceController  = require('../controllers/balance')
const express = require('express');

const router = express.Router();

router.get('/', balanceController.getBalance)

module.exports = router;