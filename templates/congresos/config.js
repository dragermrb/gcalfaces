{ 
	widthEvent: 450, 
	heightEvent: 250,
	widthGroup: 450, 
	heightGroup: 250,
	
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
		alert('Evento no modificado. '+responseD.errorMsg);
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
