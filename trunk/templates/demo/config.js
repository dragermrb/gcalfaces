{ 
	widthEvent: 250, 
	heightEvent: 200,
	widthGroup: 250, 
	heightGroup: 200,
	
	addEventSuccess: function(eventData){
		alert('Evento creado correctamente');
		tb_remove();
	},
	addEventError: function(responseData){
		alert('Evento no creado. '+responseData.errorMsg);
	},
	addEventErrorHttp: function (XMLHttpRequest, textStatus){
		alert("AEE: Ocurrió un error al contactar con GCalFaces. Inténtelo más tarde.");
	},
	editEventSuccess: function(eventData){
		alert('Evento modificado');
		tb_remove();
	},
	editEventError: function(responseData){
		alert('Evento no modificado. '+responseData.errorMsg);
	},
	editEventErrorHttp: function (XMLHttpRequest, textStatus){
		alert("EEE: Ocurrió un error al contactar con GCalFaces. Inténtelo más tarde.");
	},
	deleteEventSuccess: function(eventData){
		alert('Evento eliminado');
		tb_remove();
	},
	deleteEventError: function(responseData){
		alert('Evento no eliminado. '+responseData.errorMsg);
	},
	deleteEventErrorHttp: function (XMLHttpRequest, textStatus){
		alert("DEE: Ocurrió un error al contactar con GCalFaces. Inténtelo más tarde.");
	}
}
