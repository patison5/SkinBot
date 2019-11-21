exports.encodeQueryData = (data) => {

	const ret = [];
	
	for (let d in data)
		ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));

	return ret.join('&');

}

exports.getCurrentTime = () => {
	var date = new Date();

	var minutes = date.getMinutes();
	var seconds = date.getSeconds();

	if (minutes.toString().length == 1)
		minutes = "0" + minutes;

	if (seconds.toString().length == 1)
		seconds = "0" + seconds;

	return `${date.toJSON().slice(0, 10).replace(/[-T]/g, '/')} ${date.getHours()}:${minutes}:${seconds}`;
}