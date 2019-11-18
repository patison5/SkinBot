const request 		= require('request');
const totp 			= require('totp-generator');
const express 		= require('express')
const bodyParser 	= require("body-parser");
const moment 		= require('moment');

const app = express() 

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set("view engine", "ejs");


const CONFIG = require('./config')

var API_KEY = CONFIG.API_KEY;
var code 	= totp(CONFIG.SECRET_HASH);



function updateCodeKey () {
	code = totp(CONFIG.SECRET_HASH);
	updateCodeKeyTimer = setTimeout(updateCodeKey, 30000);
}

let updateCodeKeyTimer = setTimeout(updateCodeKey, 30);


const maxPrices = {
	'Dark Artistry Cape': 15,
	'Mace of Aeons': 2,
	'Karambit | Autotronic (Well-Worn)': 2,
	'Plate Carrier - Black': 41
}

const urlOptions = {
	"API_KEY": API_KEY,
	"code": code,
	"market_hash_name": 'Dark Artistry Cape',
	"page": 1,
	"app_id": 570
}

var getMyBalance = {
	url: `https://bitskins.com/api/v1/get_account_balance/?${encodeQueryData({
		"api_key": 	API_KEY,
		"code": 	code
	})}`
};

var getMarketOrders = {
	url: `https://bitskins.com/api/v1/get_market_buy_orders/?${encodeQueryData({
		"api_key": 				urlOptions.API_KEY,
		"code": 				urlOptions.code,
		"market_hash_name": 	urlOptions.market_hash_name,
		"page": 				urlOptions.page,
		"app_id": 				urlOptions.app_id,
	})}`
}


var myData = {
	orders: [],
	balance: 0,
};

var _isWorking = true;


const MY_GAMES = [570, 730, 252490];


function getAllMyOrders () {
	for (var i = 0; i < MY_GAMES.length; i++) {

		var getMyOrdersURL = `https://bitskins.com/api/v1/get_active_buy_orders/?${encodeQueryData({
			"api_key": 				urlOptions.API_KEY,
			"code": 				urlOptions.code,
			"app_id": 				MY_GAMES[i],
			"page": 				1,
		})}`;

		request.post(getMyOrdersURL, function (error, response, body) {

			if (!error) {
				var respData = JSON.parse(body);

				myData.orders = respData.data.orders;

				if (respData.status == 'success') {

					for (var j = 0; j < respData.data.orders.length; j++) {

						var getMarketOrders = `https://bitskins.com/api/v1/get_market_buy_orders/?${encodeQueryData({
								"api_key": 				urlOptions.API_KEY,
								"code": 				urlOptions.code,
								"market_hash_name": 	respData.data.orders[j].market_hash_name,
								"app_id": 				respData.data.app_id,
								"page": 				1,
						})}`;

						request.post(getMarketOrders, checkMyOrders);
					}

				}
			}
		})
	}
}

function encodeQueryData(data) {
   const ret = [];
   for (let d in data)
     ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
   return ret.join('&');
}

function setMyOrderNewPrice (order, myOrders, app_id) {

	var price = parseFloat(order.price) + 0.01;

	price = Math.ceil((price)*100)/100;

	console.log(`new price of product: ${price}`)

	cancelMyOrders(myOrders, true, price, app_id)
}


function cancelMyOrders (myOrders, _isUpdated , price, app_id) {

	for (var i = 0; i < myOrders.length; i++) {
		var order = myOrders[i];

		console.log(order)

		var deleteURL = `https://bitskins.com/api/v1/cancel_buy_orders/?${encodeQueryData({
			"api_key": 				urlOptions.API_KEY,
			"code": 				urlOptions.code,
			"app_id": 				app_id,
			"buy_order_ids": 		order.buy_order_id,
		})}`;

		console.log(deleteURL)

		request.post(deleteURL, function (error, response, body) {
			if (!error) {
    			var respData = JSON.parse(body);

    			if (respData.status == 'success') {
    				var data = respData.data;
    				console.log('\x1b[36m%s\x1b[0m', `${data.buy_order_ids} removed successfully!`)


    				// не забыть испарвить вероятность слияние массивов.. проверить работу кол-бэка и создание нового ордера
    				if ((_isUpdated && (myOrders.length != 0)))
						createNewMyOrder(price, myOrders.length, myOrders[0].market_hash_name, data.app_id);

    			} else {
    				console.log('\x1b[33m%s\x1b[0m', '##### Status: failed:', respData.data.error_message, "#####")
    			}
    		}
		});

	}

}

function createNewMyOrder (price, count, market_hash_name, app_id) {

	var updateURL = `https://bitskins.com/api/v1/create_buy_order/?${encodeQueryData({
		"api_key": 				urlOptions.API_KEY,
		"code": 				urlOptions.code,
		"app_id": 				app_id,
		"name": 				market_hash_name,
		"price": 				price,
		"quantity": 			count,
	})}`;

	console.log(updateURL)

	request.post(updateURL, function (error, response, body) {
		if (!error) {
			var respData = JSON.parse(body);

			if (respData.status == 'success') {
				var data = respData.data;
				console.log('\x1b[36m%s\x1b[0m', `${data.orders[0].market_hash_name}  ${data.orders[0].buy_order_id} added successfully!`)
				console.log("price of the product: ", data.orders[0].price)
			} else {
				console.log('\x1b[33m%s\x1b[0m', '##### Status: failed:', respData.data.error_message, "#####")
			}
		}
	});
}

function checkMyOrders(error, response, body) {
  if (!error) {
    var respData = JSON.parse(body);

    if (respData.status == 'success') {
    	var data = respData.data;
    	var orders = data.orders;


    	for (var i = 0; i < orders.length; i++) {
    		var order = orders[i];
    		console.log('\x1b[32m%s\x1b[0m', "name: ", order.market_hash_name, '\x1b[32m', "    price: ", '\x1b[0m', order.price,  '$\x1b[32m', "    is_mine: ", '\x1b[0m', order.is_mine);
    	}
    	console.log("")


    	var myOrders = [];
    	for (var i = 0; i < orders.length; i++) {
    		var order = orders[i];
    		if (order.is_mine)
    			myOrders.push(order)
    	}

    	if (orders[0].is_mine){
    		console.log('выход по первому условию')
    		return;
    	}


    	if (orders[0].price < maxPrices[orders[0].market_hash_name]) {
    		setMyOrderNewPrice(orders[0], myOrders, data.app_id) 
    		return;
    	} else {

    		for (var i = 1; i < orders.length; i++) {
    			if ((orders[i].price >= maxPrices[orders[0].market_hash_name]) && (!orders[i].is_mine))
    				continue;

    			if (orders[i].is_mine)
    				break;

    			setMyOrderNewPrice(orders[i], myOrders, data.app_id)
    			break;
    		}

    	}
    }
  }
}


function startTimer () {
	request.post(getMyBalance, function (error, response, body) {
		if (!error) {
			var respData = JSON.parse(body);
			if (respData.status == 'success') {
				console.log('\x1b[32m%s\x1b[0m', `My balance is: ${respData.data.available_balance}$`)

				myData.balance = respData.data.available_balance;
			}
		}
	})

	getAllMyOrders();

	mainTimer = setTimeout(startTimer, delay);
}

let delay = 15000;
let mainTimer = setTimeout(startTimer, 10);


app.get('/', function (req, res) {

	res.render('index', {
		data: 	 	myData.orders,
		balance: 	myData.balance,
		isWorking: _isWorking,
		moment: 	moment
	})

})

app.get('/stop', function (req, res) {
	console.log('\x1b[33m%s\x1b[0m', 'stoping timer..... ')
	clearTimeout(mainTimer);
	_isWorking = false;

	res.redirect('/');
})

app.get('/start', function (req, res) {
	console.log('\x1b[33m%s\x1b[0m', 'starting timer..... ')
	mainTimer = mainTimer = setTimeout(startTimer, 10);
	_isWorking = true;

	res.redirect('/');
})


app.post('/removeSingleOrder', function (req, res) {
	const id = req.body.id;

	var deleteURL = `https://bitskins.com/api/v1/cancel_buy_orders/?${encodeQueryData({
		"api_key": 				urlOptions.API_KEY,
		"code": 				urlOptions.code,
		"app_id": 				urlOptions.app_id,
		"buy_order_ids": 		id,
	})}`;

	request.post(deleteURL, function (error, response, body) {
		if (!error) {
			var respData = JSON.parse(body);

			if (respData.status == 'success') {
				var data = respData.data;
				console.log('\x1b[36m%s\x1b[0m', `${data.buy_order_ids} removed successfully!`)

				res.json({
					ok: true, 
					message: "Эта хуета удалена",
					id: id
				})
			} else {
				console.log('\x1b[33m%s\x1b[0m', `##### Status: failed: ${respData.data.error_message} #####`)
				res.json({
					ok: false, 
					error: respData.data.error_message
				})
			}
		}
	});
})

app.listen(3000)
console.log(`Starting server on localhost:${3000}`)