// general
const request 			= require('request');
const totp 				= require('totp-generator');
const express 			= require('express')
const path 				= require('path')
const bodyParser 		= require("body-parser");
const moment 			= require('moment');
const cTable 			= require('console.table');
const fs 				= require('fs');
const colors 			= require('colors');

const { getCurrentTime, 
		changeFontStyleToBold }	= require('./plugins');

const { startVKBot }	= require('./vk');


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
const VK_TOKEN 	= CONFIG.VK_TOKEN;


const maxPrices = {
	'Dark Artistry Cape': 112.01,
	'Mace of Aeons': 2,
	'Karambit | Autotronic (Well-Worn)': 2,
	'Plate Carrier - Black': 41,
	'Bladeform Legacy': 18.5,
	'Fiery Soul of the Slayer': 19,
	'Manifold Paradox': 18.91,

	'Rotten Stache': 102.01,
	'Exalted Manifold Paradox': 21.3,
	'Big Grin': 132,
	'Tempered Mask': 39,
	'Plate Carrier - Black': 55.5,
	'Glowing Skull': 24.51,
	'Alien Red': 23,
	'Christmas Lights': 21.1,
	
	'AK-47 | Neon Revolution (Field-Tested)': 15.5,
	'M4A4 | Neo-Noir (Field-Tested)': 16,
	'StatTrak™ AK-47 | Redline (Field-Tested)': 25,
	'Banana Eoka': 24.5
}

var _isCreating = true;
var _isWorking = true;
var _isOrderUpdated = {
	570: true,
	730: true,
	252490: true,
};


var ordersIDsList = [];
var sellOrdersList = []

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

				try {
			        respData = JSON.parse(body);
			    } catch(error) {
			    	return;
			        console.log('\x1b[36m[SkinBot] --> \x1b[0m', '\x1b[33m', error); // error in the above string (in this case, yes)!
			    }

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
					console.log('\x1b[36m[SkinBot] --> \x1b[0m', `\x1b[33m##### Status: failed: ${ respData.data.error_message } #####`)
				}
			}
		})
	}
}

function addAllMyOrdersToMonitoringList () {
	ordersIDsList = [];

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
					var VKMessage = "";

					for (var j = 0; j < respData.data.orders.length; j++) {
						ordersIDsList.push(respData.data.orders[j].buy_order_id)
						console.log('\x1b[36m[SkinBot] --> \x1b[0m', `\x1b[33m${respData.data.orders[j].market_hash_name}`.padStart(45), '\x1b[32m', `[${respData.data.orders[j].buy_order_id}]`, '\x1b[0m', ` added to monitoring list.`)
						VKMessage += `Отслеживаем: ${changeFontStyleToBold(respData.data.orders[j].market_hash_name)}` + '\n';
					}

					sendVkMessage((VKMessage.length == 0) ? `Нет данных для ${respData.data.app_id}` : VKMessage, 170877706);
					sendVkMessage((VKMessage.length == 0) ? `Нет данных для ${respData.data.app_id}` : VKMessage, 74331800);
				} else {
					console.log('\x1b[36m[SkinBot] --> \x1b[0m', `\x1b[33m##### Status: failed: ${ respData.data.error_message } #####`)
				}
			}
		})
	}
}

function deleteAllMyOrdersFromMonitoringList () {
	ordersIDsList = [];

	console.log('\x1b[36m[SkinBot] --> \x1b[0m', `\x1b[33mServer removed all orders from monitoring list`, ordersIDsList)
}

function clearSellOrdersListFile () {
	fs.writeFile('./tmp/sellOrdersList.json', '', function(){
		console.log('\n\x1b[36m[SkinBot] --> \x1b[0m', `\x1b[33mServer cleared the sellOrdersList.json file`)
	})
	
}

function encodeQueryData(data) {
   const ret = [];
   for (let d in data)
     ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
   return ret.join('&');
}

function setMyOrderNewPrice (order, myOrders, app_id) {

	console.log('\x1b[36m[SkinBot] --> \x1b[0m', `\x1b[33mSOMEONE IS TRYING TO FUCK US UP - TAKING THE NECESSARY MEASURES:`)

	//для отправки сообщения с сервера
	// sendVkMessage('КТО-ТО ПЫТАЕТСЯ НАС НАЕБАТЬ! ПРЕДПРИНИМАЕМ МЕРЫ!', 170877706)
	// sendVkMessage('КТО-ТО ПЫТАЕТСЯ НАС НАЕБАТЬ! ПРЕДПРИНИМАЕМ МЕРЫ!', 74331800)

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
				console.log(`\x1b[36m[SkinBot] -->\x1b[0m  removing from dataset ${ordersIDsList[j]}`)
				ordersIDsList.splice(j, 1);

				break;
			}	
		}


		request.post(deleteURL, function (error, response, body) {
			if (!error) {
    			var respData = JSON.parse(body);

    			if (respData.status == 'success') {
    				var data = respData.data;
    				console.log('\x1b[36m[SkinBot] --> \x1b[0m', `\x1b[36m${data.buy_order_ids} removed successfully!`)
					// sendVkMessage(`${data.buy_order_ids} был удален!`, 170877706)
					// sendVkMessage(`${data.buy_order_ids} был удален!`, 74331800)

    				// не забыть испарвить вероятность слияние массивов.. проверить работу кол-бэка и создание нового ордера
    				if ((_isUpdated && (myOrders.length != 0)))
						createNewMyOrder(price, myOrders.length, myOrders[0].market_hash_name, data.app_id);

    			} else {
    				console.log('\x1b[36m[SkinBot] --> \x1b[0m', '\x1b[33m##### Status: failed:', respData.data.error_message, "#####")
    			}
    		} else {
    			console.log('\x1b[36m[SkinBot] --> \x1b[0m', '\x1b[33m', error)
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

				console.log('\x1b[36m[SkinBot] --> \x1b[33m', `Update time: ${getCurrentTime()}\x1b[0m`)
				console.log('\x1b[36m%s\x1b[0m', `${data.orders[0].market_hash_name}  ${data.orders[0].buy_order_id} added successfully!`)
				console.log("[SkinBot] --> Price of the product: ", data.orders[0].price)

				// sendVkMessage(`Дата изменения: ${getCurrentTime()}\n${data.orders[0].market_hash_name}  ${data.orders[0].buy_order_id}  был добавлен в таблицу!\nЦена: ${data.orders[0].price}$/${maxPrices[data.orders[0].market_hash_name]}$`, 170877706)
				// sendVkMessage(`Дата изменения: ${getCurrentTime()}\n${data.orders[0].market_hash_name}  ${data.orders[0].buy_order_id}  был добавлен в таблицу!\nЦена: ${data.orders[0].price}$/${maxPrices[data.orders[0].market_hash_name]}$`, 74331800)

				sendVkMessage(
					`${changeFontStyleToBold(data.orders[0].market_hash_name)} был обновлен!\n` +
					`${changeFontStyleToBold("ID")}:&#8196;&#8195;&#8195;&#8195;${ data.orders[0].buy_order_id }\n` +
					`${changeFontStyleToBold("Name:")}&#8196;&#8196;&#8195;${ data.orders[0].market_hash_name }\n` +
					`${changeFontStyleToBold("Date")}: &#8196;&#8196;&#8196;&#8195;${ getCurrentTime()}\n` + 
					`${changeFontStyleToBold("R Price")}: &#8195;${ data.orders[0].price }$\n` + 
					`${changeFontStyleToBold("M Price")}:&#8196;&#8196;&#8196;${ maxPrices[data.orders[0].market_hash_name] }$`,
				170877706);

				sendVkMessage(
					`${changeFontStyleToBold(data.orders[0].market_hash_name)} был обновлен!\n` +
					`${changeFontStyleToBold("ID")}:&#8196;&#8195;&#8195;&#8195;${ data.orders[0].buy_order_id }\n` +
					`${changeFontStyleToBold("Name:")}&#8196;&#8196;&#8195;${ data.orders[0].market_hash_name }\n` +
					`${changeFontStyleToBold("Date")}: &#8196;&#8196;&#8196;&#8195;${ getCurrentTime()}\n` + 
					`${changeFontStyleToBold("R Price")}: &#8195;${ data.orders[0].price }$\n` + 
					`${changeFontStyleToBold("M Price")}:&#8196;&#8196;&#8196;${ maxPrices[data.orders[0].market_hash_name] }$`,
				74331800);

				ordersIDsList.push(data.orders[0].buy_order_id)

			} else {
				console.log('\x1b[36m[SkinBot] --> \x1b[0m', '\x1b[33m##### Status: failed:', respData.data.error_message, "#####")
			}
		} else {
			console.log('\x1b[36m[SkinBot] --> \x1b[0m', '\x1b[33m', error)
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
	        console.log('\x1b[36m[SkinBot] --> \x1b[0m', '\x1b[33m', error); // error in the above string (in this case, yes)!
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
				// console.log('\x1b[33m%s\x1b[0m', '[SkinBot] --> выход по первому условию')
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
		console.log('\x1b[36m[SkinBot] --> \x1b[0m', '\x1b[33m', error)
	}
}

let delay = 15000;
function startTimer () {
	getAllMyOrders();

	mainTimer = setTimeout(startTimer, delay);
}
let mainTimer = setTimeout(startTimer, 10);






function appendToFile(src, newData) {
	fs.readFile(src, 'utf8', function readFileCallback(err, data) {
	    if (err){
	        console.log('\x1b[36m[SkinBot] --> \x1b[0m', `Error reading file: ${err}`);
	        sendVkMessage(err, 170877706)
	    } else {
	    	var respData;

	    	if (data.length != 0) {
	    		try {
			        respData = JSON.parse(data);
					
			        respData.push(newData);


			        fs.writeFile(src, JSON.stringify(respData), function(err) {
					    if(err) {
					    	sendVkMessage(err, 170877706)

					        return console.log('\n\x1b[36m[SkinBot] --> \x1b[0m', `Error additing to file: ${err}`);
					    }

					    console.log('\n\x1b[36m[SkinBot] --> \x1b[0m', "Added new data to sellOrdersList.json")
					    sendVkMessage("The data was saved to file!", 170877706)
					}); 

			    } catch(error) {
			    	return;
			        console.log('\x1b[36m[SkinBot] --> \x1b[0m', '\x1b[33m', error); // error in the above string (in this case, yes)!
			    }
			}
		}
	});
}

function writeToFile (src, data) {
	fs.writeFile(src, JSON.stringify(data), function(err) {
	    if(err) {
	    	sendVkMessage(err, 170877706)

	        return console.log('\n\x1b[36m[SkinBot] --> \x1b[0m', `Error additing to file: ${err}`);
	    }

	    console.log('\n\x1b[36m[SkinBot] --> \x1b[0m', "Added new data to sellOrdersList.json")
	    sendVkMessage("The data was saved to file!", 170877706)
	}); 
}

function updateFile (src, data) {
	fs.writeFileSync(src, '')

	fs.writeFile(src, JSON.stringify(data), function(err) {
	    if(err) {
	    	sendVkMessage(err, 170877706)

	        return console.log('\x1b[36m[SkinBot] --> \x1b[0m', `Error updating file: ${err}`);
	    }

	    console.log('\x1b[36m[SkinBot] --> \x1b[0m', "sellOrdersList.json was updated")
	    sendVkMessage("The data was updated!", 170877706)
	}); 
}

startVKBot((res, _isBTN, answerBackToVk) => {

	if (_isBTN) {
		var command = res.command.split(' ');

		if (command[0].length == 0)
			return;

		switch (command[0]) {
			case "start":
				console.log('\x1b[36m[SkinBot] --> \x1b[0m', '\x1b[32mserver is starting ckecking')
				mainTimer = mainTimer = setTimeout(startTimer, 10);
				_isWorking = true;

				answerBackToVk("Бот проверок запущен", true)
				break;

			case "stop":
				console.log('\x1b[36m[SkinBot] --> \x1b[0m', '\x1b[32mserver is stoping checking')
				clearTimeout(mainTimer);
				_isWorking = false;

				answerBackToVk("Бот проверок остановлен", true)
				break;

			case "all_active":
				addAllMyOrdersToMonitoringList();

				answerBackToVk("Все заказы успешно добавлены в список мониторинга", true)
				console.log('\x1b[36m[SkinBot] --> \x1b[0m','server is additing all orders to monitoring list\n')
				break;

			case "no_active":
				deleteAllMyOrdersFromMonitoringList();

				answerBackToVk("Все заказы успешно удалены из списка мониторинга", true)
				break;

			case "clear_file":
				clearSellOrdersListFile();

				answerBackToVk("Файл очищен", true)
				break;

			case "delete_active_order":
				var wasSent 	 = 0;
				var wasDelivered = 0;
				var data = {
					status: false,
					orders: []
				}

				for (var i = 0; i < MY_GAMES.length; i++) {

					var getMyOrdersURL = `https://bitskins.com/api/v1/get_active_buy_orders/?${encodeQueryData({
						"api_key": 				API_KEY,
						"code": 				totp(CONFIG.SECRET_HASH),
						"app_id": 				MY_GAMES[i],
						"page": 				1,
					})}`;

					request.post(getMyOrdersURL, function (error, response, body) {
						wasSent++;

						if (!error) {

							try {
						        respData = JSON.parse(body);
						    } catch(error) {
						    	return;
						        console.log('\x1b[36m[VK_BOT] --> \x1b[0m', '\x1b[33m', error); // error in the above string (in this case, yes)!
						    }

							if (respData.status == 'success') {
								respData.data.orders.forEach(element => {
									element.app_id = respData.data.app_id;
									element.last_updated = getCurrentTime();
									data.orders.push(element)
								});

								wasDelivered++;

								if ((wasDelivered == MY_GAMES.length) && (wasSent == MY_GAMES.length)) {
									data.status = true;

									answerBackToVk("Выберите из списка..", true, "delete_active_order", data)

								} else if (wasSent == MY_GAMES.length) {
									data.status = false;
									answerBackToVk("Произошла ошибка на сервере..", true)
								}

							} else {
								console.log('\x1b[33m%s\x1b[0m', `##### Status: failed: ${ respData.data.error_message } ##### (tried to send all orders by url)`)
							}
						}
					})
				}

				break;

			case "delete_active_order_by_id":

				console.log(res.data)

				cancelMyOrders([res.data], false, 0, res.data.app_id)

				break;


			case "come_back":
				answerBackToVk("Возврат в главное меню", true)
				break;

			default:
				answerBackToVk(`Ошибка. [ ${command[0]} ] Команда не найдена..`, true)
				console.log('\x1b[36m[SkinBot] --> \x1b[0m', "no command found...")
		}
	} else {
		var command = res.split(' ');

		if (command[0][0] == "/") {
			var cmd = command[0].slice(1);
			var args = command.splice(1)

			if (cmd == "add_market") {

				var price = args.pop();
				var title = args.join(' ');

				if (!isNaN(price) && (title.length != 0)) {

					// sellOrdersList.push()

					fs.readFile('./tmp/sellOrdersList.json', 'utf8', function readFileCallback(err, data) {
					    if (err){
					        console.log('\x1b[36m[SkinBot] --> \x1b[0m', `Error reading file: ${err}`);
					        sendVkMessage(err, 170877706)
					    } else {
					    	var respData;

					    	if (data.length != 0) {
					    		try {
							        respData = JSON.parse(data);

							        var _writeToFileflag = true;
							        var _updateFlag	     = false;

							        for (var i = 0; i < respData.length; i++) {

							        	if ((respData[i].market_hash_name == title) && (respData[i].price == price)) {
							        		_writeToFileflag = false;

							        		break;
							        	}

							        	if ((respData[i].market_hash_name == title) && (respData[i].price != price)) {
							        		_updateFlag = true;
							        		_writeToFileflag = false;
							        		respData[i].price = price;

							        		break;
							        	}
							        }

							        if (_writeToFileflag){
							        	appendToFile("./tmp/sellOrdersList.json", {
											market_hash_name: title,
											price: price,
										})
							        } else if (_updateFlag){
							        	updateFile("./tmp/sellOrdersList.json", respData)
							        } else{
							        	console.log('\x1b[36m[SkinBot] --> \x1b[0m', "Trying to add data to sellOrdersList.json, but data already exists");
							        	sendVkMessage("Эта хуйня уже существует!", 170877706)
							        }

							    } catch(error) {
							    	return;
							        console.log('\x1b[36m[SkinBot] --> \x1b[0m', '\x1b[33m', error); // error in the above string (in this case, yes)!
							    }
					    	} else {
					    		writeToFile("./tmp/sellOrdersList.json", [
						    		{
										market_hash_name: title,
										price: price,
									}
								])
					    	}
						    
						}});

				} else {
					sendVkMessage("ERROR: /add_market market_hash_name price", 170877706)
				}
			}			
		}
	}
})



// ##### SETTING ROUTES #####

app.get('/', function (req, res) {

	res.render('index', {
		isWorking: _isWorking,
		moment: 	moment
	})

})

app.get('/stop', function (req, res) {
	console.log('\x1b[36m[SkinBot] --> \x1b[0m', '\x1b[33mstoping timer..... ')
	clearTimeout(mainTimer);
	_isWorking = false;

	res.redirect('/');
})

app.get('/start', function (req, res) {
	console.log('\x1b[36m[SkinBot] --> \x1b[0m', '\x1b[33mstarting timer..... ')
	mainTimer = mainTimer = setTimeout(startTimer, 10);
	_isWorking = true;

	res.redirect('/');
})


app.post('/monitorAll', function (req, res) {

	const list = req.body.list;

	console.log('\x1b[36m[SkinBot] --> \x1b[0m', '\x1b[33mОтслеживаем всех..... ')
	
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
				console.log('\x1b[36m[SkinBot] --> \x1b[0m', `\x1b[36m${data.buy_order_ids} removed successfully!`)

				res.json({
					ok: true, 
					message: "Эта хуета удалена",
					id: id
				})
			} else {
				console.log('\x1b[36m[SkinBot] --> \x1b[0m', `\x1b[33m##### Status: failed: ${respData.data.error_message} #####`)
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
// console.log('\x1b[36m[SkinBot] --> \x1b[0m', `Starting server on \x1b[32mlocalhost:${3000}`)
// console.log('\x1b[36m[VK_BOT]  --> \x1b[0m', `Starting VK bot`);


console.log(colors.cyan('[SkinBot] -->'), `Starting server on \x1b[32mlocalhost:${3000}`)
console.log(colors.cyan('[VK_BOT]  -->'), `Starting VK bot`);



// sendVkMessage(
// 	`${changeFontStyleToBold("Christmas Lights")} был обновлен!\n` +
// 	`${changeFontStyleToBold("ID")}:&#8196;&#8195;&#8195;&#8195;570633793\n` +
// 	`${changeFontStyleToBold("Name:")}&#8196;&#8196;&#8195;Christmas Lights\n` +
// 	`${changeFontStyleToBold("Date")}: &#8196;&#8196;&#8196;&#8195;2019/11/29 13:04:35\n` + 
// 	`${changeFontStyleToBold("R Price")}: &#8195;20.12$\n` + 
// 	`${changeFontStyleToBold("M Price")}:&#8196;&#8196;&#8196;21.1$`,
// 74331800);