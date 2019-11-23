const { VK, Keyboard } = require('vk-io');

const baseBuilder = Keyboard.builder();
const { containsMat }	= require('./plugins');

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
		payload: {
			command: 'start',
		}
	})
	.textButton({
		label: 'Остановить',
		payload: {
			command: 'stop',
		}
	})
	.row()
	.textButton({
		label: 'Все активные',
		payload: {
			command: 'all_active'
		}
	})
	.textButton({
		label: 'Сбросить всех',
		payload: {
			command: 'no_active'
		}
	});
}


// console.log('Base builder', String(baseBuilder));

vk.updates.on('message', async (context, next) => {

	// console.log(context)

	switch (context.messagePayload.command) {
		case "start":
			console.log("start");
			break;

		case "stop":
			console.log("stop");
			break;

		case "all_active":
			console.log("all_active");
			break;

		case "no_active":
			console.log("no_active");
			break;
	}

	await next();

});


vk.api.messages.send({
	user_ids: [170877706, 74331800],
	message: "Hello",
	keyboard: String(baseBuilder)
});




vk.updates.start().catch(console.error);