const request 			= require('request');
const totp 	 			= require('totp-generator');
const CONFIG 			= require('../config')
const encodeQueryData	= require('../plugins').encodeQueryData;

exports.getAllActiveOrders = (id, callback) => {

	var getMyOrdersURL = `https://bitskins.com/api/v1/get_active_buy_orders/?${encodeQueryData({
		"api_key": 				CONFIG.API_KEY,
		"code": 				totp(CONFIG.SECRET_HASH),
		"app_id": 				id,
		"page": 				1,
	})}`;

	request.post(getMyOrdersURL, function (error, response, results) {
		callback(error, results)
	})
	
}
