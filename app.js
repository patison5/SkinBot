const request = require('request');
const totp = require('totp-generator');
const express = require('express')
const bodyParser = require("body-parser");

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



var myBalance = 0;


function encodeQueryData(data) {
   const ret = [];
   for (let d in data)
     ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
   return ret.join('&');
}

function setMyOrderNewPrice (order, myOrders) {

	var price = parseFloat(order.price) + 0.01
	console.log("updating order's price " + price)

	cancelMyOrder(myOrders, true, price)
}


function cancelMyOrder (myOrders, _isUpdated , price) {

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
   //  	myOrders.push({
			// "buy_order_id": 566595253,
			// "market_hash_name": 'Dark Artistry Cape',
			// "price": '102.02',
			// "suggested_price": '164.10',
			// "is_mine": false,
			// "created_at": 1574030993,
			// "place_in_queue": 0 
   //  	})

    	console.log("my", myOrders)
    	console.log("")



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


// request.post(getMarketOrders, checkMyOrders);



let mainTimer = setTimeout(function tick() {

	request.post(getMyBalance, function (error, response, body) {
		if (!error) {
			var respData = JSON.parse(body);
			if (respData.status == 'success') {
				console.log(`My balance is: ${respData.data.available_balance}$`)

				myBalance = respData.data.available_balance;
			}
		}
	})

  mainTimer = setTimeout(tick, 60000);
}, 10);




app.get('/', function (req, res) {

	var data = [];

	var getMyOrders = `https://bitskins.com/api/v1/get_active_buy_orders/?${encodeQueryData({
		"api_key": 				urlOptions.API_KEY,
		"code": 				urlOptions.code,
		"app_id": 				urlOptions.app_id,
		"page": 				1,
	})}`;


	request.post(getMyOrders, function (error, response, body) {
		if (!error) {
			var respData = JSON.parse(body);

			if (respData.status == 'success') {
				res.render('index', {
					data: 	 respData.data.orders,
					balance: myBalance
				})
			}
		}
	})

	console.log('someone get here..... ')
})

app.listen(3000)
console.log(`Starting server on localhost:${3000}`)