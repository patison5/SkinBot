window.onload = function () {
	
	var deleteBTN = document.getElementsByClassName('removeSingleOrder');

	for (var i = 0; i < deleteBTN.length; i++) {
		console.log(deleteBTN[i])

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
}