// general
const request 			= require('request');
const totp 				= require('totp-generator');
const express 			= require('express')
const path 				= require('path')
const bodyParser 		= require("body-parser");
const moment 			= require('moment');
const cTable 			= require('console.table');
const getCurrentTime	= require('./plugins').getCurrentTime;


const easyvk = require('easyvk')


// custom
const CONFIG 		= require('./config')
const routes 		= require('./routes')

const app = express() 


// settings
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set("view engine", "ejs");


// main constants
const API_KEY 	= CONFIG.API_KEY;
const MY_GAMES  = CONFIG.MY_GAMES;
const VK_TOKEN 	= "1823f6aea985edc620f600267473d1ae8277f69418f2c479dc54104fb608eb0d76fd4e88b8b3b2b694828";


const maxPrices = {
	'Dark Artistry Cape': 107.01,
	'Mace of Aeons': 2,
	'Karambit | Autotronic (Well-Worn)': 2,
	'Plate Carrier - Black': 41,
	'Bladeform Legacy': 18.5,
	'Fiery Soul of the Slayer': 19,
	'Manifold Paradox': 18.91,

	'Rotten Stache': 102.6,
	'Exalted Manifold Paradox': 21.3,
	'Big Grin': 128,
	'Tempered Mask': 40,
	'Plate Carrier - Black': 56,
	'Glowing Skull': 23.5,
	'Alien Red': 23,
	
	'AK-47 | Neon Revolution (Field-Tested)': 15.5,
	'M4A4 | Neo-Noir (Field-Tested)': 16,
	'StatTrak™ AK-47 | Redline (Field-Tested)': 25,
}

var _isCreating = true;
var _isWorking = true;
var _isOrderUpdated = {
	570: true,
	730: true,
	252490: true,
};


var ordersIDsList = [];

console.table('\x1b[33m', [CONFIG], '\x1b[0m')


function sendVkMessage (message, user_ids) {
	easyvk({
	  access_token: VK_TOKEN
	}).then(vk => {
	  	// console.log(vk.session.group_id);
		vk.call("messages.send", {
			user_id: user_ids,
	  		message: message
		})
	}).catch(console.error)
}



function getAllMyOrders () {

	for (var i = 0; i < MY_GAMES.length; i++) {

		var getMyOrdersURL = `https://bitskins.com/api/v1/get_active_buy_orders/?${encodeQueryData({
			"api_key": 				API_KEY,
			"code": 				totp(CONFIG.SECRET_HASH),
			"app_id": 				MY_GAMES[i],
			"page": 				1,
		})}`;

		request.post(getMyOrdersURL, function (error, response, body) {

			if (!error) {

				var respData = JSON.parse(body);

				if (respData.status == 'success') {

					// для красоты даты обновления
					if ((_isOrderUpdated[respData.data.app_id]) && (respData.data.orders.length != 0)) {	

						// для первоначальной отрисовки даты...
						if (_isCreating) {
							respData.data.orders.forEach(order => {
								order.updated_at = getCurrentTime();
							});
							_isCreating = false;
						}
							

						console.table('\x1b[33m', respData.data.orders, '\x1b[0m')
						_isOrderUpdated[respData.data.app_id] = false;
					}

					for (var j = 0; j < respData.data.orders.length; j++) {

						var getMarketOrders = `https://bitskins.com/api/v1/get_market_buy_orders/?${encodeQueryData({
								"api_key": 				API_KEY,
								"code": 				totp(CONFIG.SECRET_HASH),
								"market_hash_name": 	respData.data.orders[j].market_hash_name,
								"app_id": 				respData.data.app_id,
								"page": 				1,
						})}`;

						request.post(getMarketOrders, checkMyOrders);
					}
				} else {
					console.log('\x1b[33m%s\x1b[0m', `##### Status: failed: ${ respData.data.error_message } #####`)
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

	console.log('\x1b[33m%s\x1b[0m', `SOMEONE IS TRYING TO FUCK US UP - TAKING THE NECESSARY MEASURES:`)

	//для отправки сообщения с сервера
	sendVkMessage('КТО-ТО ПЫТАЕТСЯ НАС НАЕБАТЬ! ПРЕДПРИНИМАЕМ МЕРЫ!', 170877706)
	sendVkMessage('КТО-ТО ПЫТАЕТСЯ НАС НАЕБАТЬ! ПРЕДПРИНИМАЕМ МЕРЫ!', 74331800)

	var price = parseFloat(order.price) + 0.01;

	price = Math.ceil((price)*100)/100;

	cancelMyOrders(myOrders, true, price, app_id)
}


function cancelMyOrders (myOrders, _isUpdated , price, app_id) {

	for (var i = 0; i < myOrders.length; i++) {
		var order = myOrders[i];

		var deleteURL = `https://bitskins.com/api/v1/cancel_buy_orders/?${encodeQueryData({
			"api_key": 				API_KEY,
			"code": 				totp(CONFIG.SECRET_HASH),
			"app_id": 				app_id,
			"buy_order_ids": 		order.buy_order_id,
		})}`;


		for (var j = 0; j < ordersIDsList.length; j++) {
			if (ordersIDsList[j] == order.buy_order_id){
				console.log(`removingfrom dataset ${ordersIDsList[j]}`)
				ordersIDsList.splice(j, 1);

				break;
			}	
		}


		request.post(deleteURL, function (error, response, body) {
			if (!error) {
    			var respData = JSON.parse(body);

    			if (respData.status == 'success') {
    				var data = respData.data;
    				console.log('\x1b[36m%s\x1b[0m', `${data.buy_order_ids} removed successfully!`)

					sendVkMessage(`${data.buy_order_ids} был удален!`, 170877706)
					sendVkMessage(`${data.buy_order_ids} был удален!`, 74331800)


    				// не забыть испарвить вероятность слияние массивов.. проверить работу кол-бэка и создание нового ордера
    				if ((_isUpdated && (myOrders.length != 0)))
						createNewMyOrder(price, myOrders.length, myOrders[0].market_hash_name, data.app_id);

    			} else {
    				console.log('\x1b[33m%s\x1b[0m', '##### Status: failed:', respData.data.error_message, "#####")
    			}
    		} else {
    			console.log('\x1b[33m%s\x1b[0m', '##### Status: failed:', error, "#####")
    		}
		});

	}

}

function createNewMyOrder (price, count, market_hash_name, app_id) {

	var updateURL = `https://bitskins.com/api/v1/create_buy_order/?${encodeQueryData({
		"api_key": 				API_KEY,
		"code": 				totp(CONFIG.SECRET_HASH),
		"app_id": 				app_id,
		"name": 				market_hash_name,
		"price": 				price,
		"quantity": 			count,
	})}`;

	request.post(updateURL, function (error, response, body) {
		if (!error) {
			var respData = JSON.parse(body);

			if (respData.status == 'success') {
				var data = respData.data;
					data.orders[0].updated_at = getCurrentTime();
					_isOrderUpdated[respData.data.app_id] = true;

				console.table('\x1b[33m', `Update time: ${getCurrentTime()}`, '\x1b[0m')
				
				sendVkMessage(`Дата изменения: ${getCurrentTime()}`, 170877706)
				sendVkMessage(`Дата изменения: ${getCurrentTime()}`, 74331800)

				console.log('\x1b[36m%s\x1b[0m', `${data.orders[0].market_hash_name}  ${data.orders[0].buy_order_id} added successfully!`)

				ordersIDsList.push(data.orders[0].buy_order_id)
				console.log("price of the product: ", data.orders[0].price)

				sendVkMessage(`${data.orders[0].market_hash_name}  ${data.orders[0].buy_order_id}  был добавлен в таблицу!`, 170877706)
				sendVkMessage(`${data.orders[0].market_hash_name}  ${data.orders[0].buy_order_id}  был добавлен в таблицу!`, 74331800)

			} else {
				console.log('\x1b[33m%s\x1b[0m', '##### Status: failed:', respData.data.error_message, "#####")
			}
		} else {
			console.log('\x1b[33m%s\x1b[0m', '##### Status: failed:', error, "#####")
		}
	});
}

function checkMyOrders(error, response, body) {
	if (!error) {
		var respData;

		try {
	        respData = JSON.parse(body);
	    } catch(error) {
	    	return;
	        console.log('\x1b[33m%s\x1b[0m', '##### Status: failed:', error, "#####"); // error in the above string (in this case, yes)!
	    }

		if (respData.status == 'success') {
			var data = respData.data;
			var orders = data.orders;

			var myOrders = [];
			for (var i = 0; i < orders.length; i++) {
				var order = orders[i];
				if (order.is_mine){

					ordersIDsList.forEach(ids => {

						if (ids == order.buy_order_id){
							myOrders.push(order)
						}
					});
				}
			}

			if (myOrders.length == 0){
				return;
			}

			if (orders[0].is_mine){
				// console.log('\x1b[33m%s\x1b[0m', 'выход по первому условию')
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
	} else {
		console.log('\x1b[33m%s\x1b[0m', '##### Status: failed:', error, "#####")
	}
}

let delay = 15000;
function startTimer () {
	getAllMyOrders();

	mainTimer = setTimeout(startTimer, delay);
}
let mainTimer = setTimeout(startTimer, 10);





// ##### CONTROL ROUTES #####

app.get('/', function (req, res) {

	res.render('index', {
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


app.post('/monitorAll', function (req, res) {

	const list = req.body.list;

	console.log('\x1b[33m%s\x1b[0m', 'Отслеживаем всех..... ')
	
	ordersIDsList = list;

	res.redirect('/');
})


app.post('/removeSingleOrder', function (req, res) {
	const id 	 = req.body.id;
	const app_id = req.body.app_id;

	var deleteURL = `https://bitskins.com/api/v1/cancel_buy_orders/?${encodeQueryData({
		"api_key": 				API_KEY,
		"code": 				totp(CONFIG.SECRET_HASH),
		"app_id": 				app_id,
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

app.post('/addOrdersToOrdersIDsList', function (req, res) {
	const id = req.body.id;

	console.log('Попытка добавить в список для слежки ', id)

	for (var i = 0; i < ordersIDsList.length; i++) {
		if (ordersIDsList[i] == id) {
			res.send({
				status: true,
				message: "уже отслеживается"
			})

			return;
		}
	}

	ordersIDsList.push(id)
	res.send({
		status: true,
		message: "Начали отслеживать"
	})
	// console.table(ordersIDsList)
})



app.use('/api/balance', routes.balance)
app.use('/api/orders/', routes.orders)


// ##### STARTING SERVER #####
app.listen(3000)
console.log(`Starting server on localhost:${3000}`)