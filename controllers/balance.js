var Balance = require('../models/balance');

exports.getBalance = (req, res) => {
	Balance.getBalance((error, docs) => {
		
		if (!error) {
			var respData = JSON.parse(docs);

			if (respData.status == 'success') {
				res.send({
					status: true,
					balance: respData.data.available_balance
				})
			} else {
				res.send({
					status: false,
					balance: respData.data.error_message
				})
			}
		} else {
			res.send({
				status: false,
				balance: error
			})
		}
	});
}