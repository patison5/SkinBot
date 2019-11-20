var Orders = require('../models/orders');

const MY_GAMES = [570, 730, 252490];

exports.getAllActiveOrders = (req, res) => {
	var wasSent 	 = 0;
	var wasDelivered = 0;
	var data = {
		status: false,
		orders: []
	}


	for (var i = 0; i < MY_GAMES.length; i++) {

		Orders.getAllActiveOrders(MY_GAMES[i], (error, docs) => {
			
			wasSent++;

			if (!error) {

				var respData = JSON.parse(docs);

				if (respData.status == 'success') {
					respData.data.orders.forEach(element => {
						element.app_id = respData.data.app_id;
						data.orders.push(element)
					});

					wasDelivered++;

					if ((wasDelivered == MY_GAMES.length) && (wasSent == MY_GAMES.length)) {
						data.status = true;
						res.send(data)
					} else if (wasSent == MY_GAMES.length) {
						data.status = false;
						res.send(data)
					}

				} else {
					console.log('\x1b[33m%s\x1b[0m', `##### Status: failed: ${ respData.data.error_message } ##### (tried to send all orders by url)`)
				}
			}

		});
	}
}