const { VK, Keyboard }  = require('vk-io');
const { containsMat }	= require('./plugins');

exports.startVKBot = (callback) => {

	const baseBuilder = Keyboard.builder();

	// Maybe user is not register
	const userIsNotRegistered = true;

	// для получения сообщения из группы и выполнения команды..
	const vk = new VK({
		token: "08e45bca5d5ad7fdad59cbd4292191f014080909ba335cfa92ab8023f48087eccaa4b56d34160fef06653"
	});

	vk.updates.hear(/([Пп][иИ][дД][оО][рР])/i, context => {

		context.send('Слыш, сам пидор!')
	});
	vk.updates.hear(/([Пп][иИ][дД][рР])/i, context => {

		context.send('Ахуел? сам пидр!')
	});
	vk.updates.hear(/нахуй/i, context => {

		context.send('Может сам нахуй сядешь?!')
	});
	vk.updates.hear(/бля/i, context => {

		context.send('Поддерживаю')
	});
	vk.updates.hear(/пиздец/i, context => {

		context.send('Полностью с тобой солидарен')
	});
	vk.updates.hear(/Здарова/i, context => {

		context.send('Пошел нахуй')
	});

	if (userIsNotRegistered) {
		baseBuilder
		.textButton({
			label: 'Запустить',
			color: Keyboard.POSITIVE_COLOR,
			payload: {
				command: 'start',
			}
		})
		.textButton({
			label: 'Остановить',
			// color: "bd1c49",
			color: Keyboard.NEGATIVE_COLOR,
			payload: {
				command: 'stop',
			}
		})
		.row()
		.textButton({
			label: 'Все активные',
			// color: "4a76a8",
			color: Keyboard.PRIMARY_COLOR,
			payload: {
				command: 'all_active'
			}
		})
		.textButton({
			label: 'Сбросить всех',
			// color: "4a76a8",
			color: Keyboard.SECONDARY_COLOR,
			payload: {
				command: 'no_active'
			}
		})

		.row()
		.textButton({
			label: 'Очистить файл',
			// color: "4a76a8",
			color: Keyboard.PRIMARY_COLOR,
			payload: {
				command: 'clear_file'
			}
		})
		.row()
		.textButton({
			label: 'Удалить Order',
			// color: "4a76a8",
			color: Keyboard.PRIMARY_COLOR,
			payload: {
				command: 'delete_active_order'
			}
		});
	}

	function answerFromServer (message, _isBroadcast, type = null, data = null) {

		var tmpBuilder = Keyboard.builder();
		
		if (type == "delete_active_order") {
			var orders = data.orders;

			for (var i = 0; i < orders.length; i++) {

				var name = orders[i].market_hash_name.slice(0, 33)
				var price = orders[i].price.slice(0,5)

				tmpBuilder
					.textButton({
						label: `${name} ${price}$`,
						payload: {
							command: 'delete_active_order_by_id',
							data: {
								buy_order_id: orders[i].buy_order_id,
								app_id: orders[i].app_id
							}
						}
					})
					.row()
			}

			tmpBuilder
				.textButton({
					label: "Вернуться",
					color: Keyboard.PRIMARY_COLOR,
					payload: {
						command: 'come_back'
					}
				})
				.row()
		} else {
			var tmpBuilder = baseBuilder.clone();
		}


		if (_isBroadcast) {
			vk.api.messages.send({
				user_ids: [170877706, 74331800],
				message: message,
				keyboard: String(tmpBuilder)
			});
		} else {
			vk.api.messages.send({
				user_ids: [170877706],
				message: message,
				keyboard: String(tmpBuilder)
			});
		}
	}

	vk.updates.on('message', async (context, next) => {

		if (context.messagePayload) {
			callback(context.messagePayload, true, answerFromServer);
		} else {
			callback(context.text, false, answerFromServer);
		}
		

		await next();

	});


	vk.api.messages.send({
		user_ids: [170877706, 74331800],
		// user_ids: [170877706],
		message: "[BOT] --> Бот начал свою работу",
		keyboard: String(baseBuilder)
	});


	vk.updates.start().catch(console.error);

}



