const ordersController  = require('../controllers/orders')
const express = require('express');

const router = express.Router();

router.get('/', ordersController.getAllActiveOrders)

module.exports = router;