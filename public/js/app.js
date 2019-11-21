window.onload = function () {
	
	var deleteBTN = document.getElementsByClassName('removeSingleOrder');

	for (var i = 0; i < deleteBTN.length; i++) {

		deleteBTN[i].addEventListener('click', function () {
			$.ajax({
				type: 'POST',
				data: JSON.stringify({
					"id": 	  this.dataset.id,
					"app_id": this.dataset.app_id					
				}),
				contentType: 'application/json',
				url: '/removeSingleOrder'
			}).done(function(data) {		
				console.log(data)

				if (!data.ok) {

				} else {
					var el = document.getElementById(data.id);

					el.parentNode.removeChild(el);
				}
			})
		})
	}



	function updateTable () {
		$.ajax({
			type: 'GET',
			contentType: 'application/json',
			url: '/api/orders/'
		}).done(function(data) {		

			if (!data.status) {
				console.log('false')
			} else {

				var tbodyOrders = document.getElementById('orders__tbody-js');
				tbodyOrders.innerHTML = "";

				var orders = data.orders;

				for (var i = 0; i < orders.length; i++) {
					var tr = document.createElement('tr')

					console.log(orders[i].updated_at)

					tr.setAttribute('id', orders[i].buy_order_id)

					var tdID = document.createElement('td')
						tdID.innerHTML = orders[i].buy_order_id;

					var tdMarket = document.createElement('td')
						tdMarket.innerHTML = orders[i].market_hash_name;	

					var tdPrice = document.createElement('td')
						tdPrice.innerHTML = orders[i].price + '$';

					var tdPlaceInQueue = document.createElement('td')
						tdPlaceInQueue.innerHTML = orders[i].place_in_queue;

					var tdAppId = document.createElement('td')
						tdAppId.innerHTML = orders[i].app_id;

					var tdLastUpdated = document.createElement('td')
						tdLastUpdated.innerHTML = orders[i].last_updated;

					var tdActions = document.createElement('td')
						tdActions.innerHTML = `<a href="#" class="removeSingleOrder" data-id="${orders[i].buy_order_id}" data-app_id="${orders[i].app_id}">удалить</a></td>`;			

					tr.appendChild(tdID)
					tr.appendChild(tdMarket)
					tr.appendChild(tdPrice)
					tr.appendChild(tdPlaceInQueue)
					tr.appendChild(tdAppId)
					tr.appendChild(tdLastUpdated)
					tr.appendChild(tdActions)

					tbodyOrders.appendChild(tr)
				}
			}
		})
	}

	function getBalance() {

		$.ajax({
			type: 'GET',
			contentType: 'application/json',
			url: '/api/balance/'
		}).done(function (data) {
			var balanceSpan = document.getElementById('balance-js')

			balanceSpan.innerHTML = data.balance + "$";
		})
	}

	function updateDataSync () {
		updateTable();
		getBalance();

		updateDataSyncTimer = setTimeout(updateDataSync, 5000)
	}

	let updateDataSyncTimer = setTimeout(updateDataSync, 0);

}