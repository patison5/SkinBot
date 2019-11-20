const request 			= require('request');
const totp 	 			= require('totp-generator');
const CONFIG 			= require('../config')
const encodeQueryData	= require('../plugins').encodeQueryData;

exports.getBalance = (callback) => {

	var getMyBalance = `https://bitskins.com/api/v1/get_account_balance/?${encodeQueryData({
		"api_key": 	CONFIG.API_KEY,
		"code": 	totp(CONFIG.SECRET_HASH)
	})}`;

	request.post(getMyBalance, function (error, response, results) {
		callback(error, results)
	})
	
}
