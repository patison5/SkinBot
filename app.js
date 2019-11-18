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

const myMaxPrice = 15;

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

var getMyOrdersURL = `https://bitskins.com/api/v1/get_active_buy_orders/?${encodeQueryData({
	"api_key": 				urlOptions.API_KEY,
	"code": 				urlOptions.code,
	"app_id": 				urlOptions.app_id,
	"page": 				1,
})}`;


var myData = {
	orders: [],
	balance: 0,
};

var _isWorking = true;



function encodeQueryData(data) {
   const ret = [];
   for (let d in data)
     ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
   return ret.join('&');
}

function setMyOrderNewPrice (order, myOrders) {

	var price = parseFloat(order.price) + 0.01
	console.log("updating order's price " + price)

	cancelMyOrders(myOrders, true, price)
}


function cancelMyOrders (myOrders, _isUpdated , price) {

	for (var i = 0; i < myOrders.length; i++) {
		var order = myOrders[i];

		var deleteURL = `https://bitskins.com/api/v1/cancel_buy_orders/?${encodeQueryData({
			"api_key": 				urlOptions.API_KEY,
			"code": 				urlOptions.code,
			"app_id": 				urlOptions.app_id,
			"buy_order_ids": 		order.buy_order_id,
		})}`;

		request.post(deleteURL, function (error, response, body) {
			if (!error) {
    			var respData = JSON.parse(body);

    			if (respData.status == 'success') {
    				var data = respData.data;
    				console.log(`${data.buy_order_ids} removed successfully!`)


    				// не забыть испарвить вероятность слияние массивов.. проверить работу кол-бэка и создание нового ордера
    				if ((_isUpdated && (myOrders.length != 0)))
						createNewMyOrder(price, myOrders.length, myOrders[0].market_hash_name);

    			} else {
    				console.log('##### Status: failed:', respData.data.error_message, "#####")
    			}
    		}
		});

	}

}

function createNewMyOrder (price, count, market_hash_name) {

	var newOrderSetting = {
		"price": 	price,
		"name": 	market_hash_name,
		"value": 	count,
		"app_id": 	570 							//надо обработать...
	}

	var updateURL = `https://bitskins.com/api/v1/create_buy_order/?${encodeQueryData({
		"api_key": 				urlOptions.API_KEY,
		"code": 				urlOptions.code,
		"app_id": 				newOrderSetting.app_id,
		"name": 				newOrderSetting.name,
		"price": 				newOrderSetting.price,
		"quantity": 			newOrderSetting.value,
	})}`;

	request.post(updateURL, function (error, response, body) {
		if (!error) {
			var respData = JSON.parse(body);

			if (respData.status == 'success') {
				var data = respData.data;
				console.log(`${data.orders[0].buy_order_id} added successfully!`)
				console.log("price of the product: ", data.orders[0].price)
			} else {
				console.log('##### Status: failed:', respData.data.error_message, "#####")
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
    		console.log("name: ", order.market_hash_name, "price: ", order.price, "is_mine: ", order.is_mine);
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


    	if (orders[0].price < myMaxPrice) {
    		setMyOrderNewPrice(orders[0], myOrders) 
    		return;
    	} else {

    		for (var i = 1; i < orders.length; i++) {
    			if ((orders[i].price >= myMaxPrice) && (!orders[i].is_mine))
    				continue;

    			if (orders[i].is_mine)
    				break;

    			setMyOrderNewPrice(orders[i], myOrders)
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
				console.log(`My balance is: ${respData.data.available_balance}$`)

				myData.balance = respData.data.available_balance;
			}
		}
	})


	request.post(getMarketOrders, checkMyOrders);


	request.post(getMyOrdersURL, function (error, response, body) {
		console.log('')

		if (!error) {
			var respData = JSON.parse(body);

			if (respData.status == 'success') {
				myData.orders = respData.data.orders
			}
		}
	})

	mainTimer = setTimeout(startTimer, delay);
}

let delay = 5000;
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
	console.log('stoping timer..... ')
	clearTimeout(mainTimer);
	_isWorking = false;

	res.redirect('/');
})

app.get('/start', function (req, res) {
	console.log('starting timer..... ')
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
				console.log(`${data.buy_order_ids} removed successfully!`)

				res.json({
					ok: true, 
					message: "Эта хуета удалена",
					id: id
				})
			} else {
				console.log('##### Status: failed:', respData.data.error_message, "#####")
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