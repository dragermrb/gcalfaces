/**
 * Clase para la comunicacion con el sistema GCalendar
 * 
 * @package GCalFaces
 */


/**
 * Constructor de la clase
 */
function GCalFaces(){}

/**
 * Configuracion del timeview con atributos y funciones de usuario
 */
GCalFaces.config=null;

/**
 * Inicializa el sistema pidendo la configuracion al servidor
 */
GCalFaces.init=function(){
	var urlSubmit='config.php';
	var formData=null;
	var successCallback=function(data, textStatus){
		if (data.status=='success'){
			//Configuracion JS recibida
			GCalFaces.config=data.config;
		}
		else {
			//Configuracion JS no encontrada
			GCalFaces.config.widthEvent=500;
			CalFaces.config.heightEvent=500;
			GCalFaces.config.widthGroup=700;
			CalFaces.config.heightGroup=500;
		}
	};
	
	var errorCallback=function(XMLHttpRequest, textStatus, errorThrown){
		alert("CNF: Ocurrió un error al contactar con GCalFaces. Inténtelo más tarde.");
	};
	
	//Enviar
	$.ajax({
		type: "POST",
		url: urlSubmit,
		data: formData,
		dataType: 'json',
		success: successCallback,
		error: errorCallback 
	});
}

/**
 * Muestra el formulario de inserción de eventos
 * 
 * @param Array params Array asociativo con opcione predefinidas de evento
 */
GCalFaces.addForm=function(params){
	var url='addEvent.php?action=form';
	if (params!=''){
		url+='&startDate='+escape(params);
	}
	
	url+="&height="+GCalFaces.config.heightEvent+"&width="+GCalFaces.config.widthEvent;
	
	var t = null; //Title
	var a = url;
	var g = false; //images group

	tb_show(t,a,g);
}

/**
 * Inserta un evento en GCalFaces a partir del identificador del formulario que almacena sus datos
 * 
 * @param String formId Identificador del formulario que alamcena los datos del evento
 */
GCalFaces.addEvent=function(formId){
	//Generar datos
	var urlSubmit='addEvent.php?action=json';
	var formData=$('#'+formId).serializeArray();
	var successCallback=function(data, textStatus){
		if (data.status=='success'){
			//alert('Evento creado');
			for (var i=0; i<data.result.length; i++){
				TimeViewManager.addEvent(data.result[i]);
				if (typeof GCalFaces.config.addEventSuccess=="function"){
					GCalFaces.config.addEventSuccess(data.result[i]);	
				}
			}
		}
		else {
			if (typeof GCalFaces.config.addEventError=="function"){
				GCalFaces.config.addEventError(data);	
			} else {
				alert('Evento no creado. '+data.errorMsg);
			}
		}
	};
	
	var errorCallback=function(XMLHttpRequest, textStatus, errorThrown){
		if (typeof GCalFaces.config.addEventErrorHttp=="function"){
			GCalFaces.config.addEventErrorHttp(XMLHttpRequest, textStatus);
		} else {
			alert("AEE: Ocurrió un error al contactar con GCalFaces. Inténtelo más tarde.");
		}
	};
	
	//Enviar
	$.ajax({
		type: "POST",
		url: urlSubmit,
		data: formData,
		dataType: 'json',
		success: successCallback,
		error: errorCallback 
	});
}

/**
 * Inserta un evento en GCalFaces a partir del identificador del formulario que almacena sus datos mediante el método de inserción rápida (QuickAdd)
 * 
 * @param String formId Identificador del formulario que alamcena los datos del evento
 */
GCalFaces.quickAdd=function(formId){
	var urlSubmit='addEvent.php?action=quickAdd';
	var formData=$('#'+formId).serializeArray();
	var successCallback=function(data, textStatus){
		//Volver a activar el input y resetear
		$('#'+formId+' >input:text').removeAttr('disabled');
		$('#'+formId+' >input:text').val('');
		
		if (data.status=='success'){
			//alert('Evento creado');
			for (var i=0; i<data.result.length; i++){
				TimeViewManager.addEvent(data.result[i]);
				if (typeof GCalFaces.config.addEventSuccess=="function"){
					GCalFaces.config.addEventSuccess(data.result[i]);	
				} 
			}
		}
		else {
			if (typeof GCalFaces.config.addEventError=="function"){
				GCalFaces.config.addEventError(data);	
			} else {
				alert('Evento no creado. '+data.errorMsg);
			}
		}
	};
	
	var errorCallback=function(XMLHttpRequest, textStatus, errorThrown){
		//Volver a activar el input y resetear
		$('#'+formId+' >input:text').removeAttr('disabled');
		$('#'+formId+' >input:text').val('');
		
		if (typeof GCalFaces.config.addEventErrorHttp=="function"){
			GCalFaces.config.addEventErrorHttp(XMLHttpRequest, textStatus);
		} else {
			alert("AEE: Ocurrió un error al contactar con GCalFaces. Inténtelo más tarde.");
		}
	};

	//Desactivar el input mientras enviamos
	$('#'+formId+' >input:text').attr("disabled","disabled");

	//Enviar
	$.ajax({
		type: "POST",
		url: urlSubmit,
		data: formData,
		dataType: 'json',
		success: successCallback,
		error: errorCallback 
	});
	
	return false;
}

/**
 * Muestra el formulario de modificación de eventos
 * 
 * @param Array params Array asociativo con opcione predefinidas de evento
 */
GCalFaces.editForm=function(params){
	if (params.tagName==undefined){
		params.tagName='';
		params.tagValue='';
		width=GCalFaces.config.widthEvent;
		height=GCalFaces.config.heightEvent;
	} else {
		width=GCalFaces.config.widthGroup;
		height=GCalFaces.config.heightGroup;
	}
	var url='editEvent.php?action=form&eventId='+params.id+'&tagName='+escape(params.tagName)+'&tagValue='+escape(params.tagValue);
	
	url+="&height="+height+"&width="+width;
	
	var t = null; //Title
	var a = url;
	var g = false; //images group

	tb_show(t,a,g);
}

/**
 * Modifica un evento en GCalFaces a partir del identificador del formulario que almacena sus datos
 * 
 * @param String formId Identificador del formulario que alamcena los datos del evento
 */
GCalFaces.editEvent=function(formId){
	//Generar datos
	var urlSubmit='editEvent.php?action=json';
	var formData=$('#'+formId).serializeArray();
	var successCallback=function(data, textStatus){
		if (data.status=='success'){
			//alert('Evento modificado');
			for (var i=0; i<data.result.length; i++){
				TimeViewManager.updateEvent(data.result[i]);
				if (typeof GCalFaces.config.editEventSuccess=="function"){
					GCalFaces.config.editEventSuccess(data.result[i]);	
				}
			}
		}
		else {
			if (typeof GCalFaces.config.editEventError=="function"){
				GCalFaces.config.editEventError(data);	
			} else {
				alert('Evento no modificado. '+data.errorMsg);
			}
		}
	};
	
	var errorCallback=function(XMLHttpRequest, textStatus, errorThrown){
		if (typeof GCalFaces.config.editEventErrorHttp=="function"){
			GCalFaces.config.editEventErrorHttp(XMLHttpRequest, textStatus);
		} else {
			alert("EEE: Ocurrió un error al contactar con GCalFaces. Inténtelo más tarde.");
		}
	};
	
	//Enviar
	$.ajax({
		type: "POST",
		url: urlSubmit,
		data: formData,
		dataType: 'json',
		success: successCallback,
		error: errorCallback 
	});
}

/**
 * Elimina un evento de GCalFaces a partir del identificador del formulario que almacena sus datos
 * 
 * @param String formId Identificador del formulario que alamcena los datos del evento
 */
GCalFaces.deleteEvent=function(formId){
	//Generar datos
	var urlSubmit='deleteEvent.php?action=json';
	var formData=$('#'+formId).serializeArray();
	var successCallback=function(data, textStatus){
		if (data.status=='success'){
			//alert('Evento eliminado');
			for (var i=0; i<data.result.length; i++){
				TimeViewManager.deleteEvent(data.result[i].id);
				if (typeof GCalFaces.config.deleteEventSuccess=="function"){
					GCalFaces.config.deleteEventSuccess(data.result[i]);	
				}
			}
		}
		else {
			if (typeof GCalFaces.config.deleteEventError=="function"){
				GCalFaces.config.deleteEventError(data);	
			} else {
				alert('Evento no eliminado. '+data.errorMsg);
			}
		}
	};
	
	var errorCallback=function(XMLHttpRequest, textStatus, errorThrown){
		if (typeof GCalFaces.config.deleteEventErrorHttp=="function"){
			GCalFaces.config.deleteEventErrorHttp(XMLHttpRequest, textStatus);
		} else {
			alert("DEE: Ocurrió un error al contactar con GCalFaces. Inténtelo más tarde.");
		}
	};
	
	//Enviar
	$.ajax({
		type: "POST",
		url: urlSubmit,
		data: formData,
		dataType: 'json',
		success: successCallback,
		error: errorCallback 
	});
}

GCalFaces.init();