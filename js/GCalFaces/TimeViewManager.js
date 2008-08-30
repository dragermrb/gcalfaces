/**
 * Clase general para la representacion de calendarios
 * 
 * @package GCalFaces
 */

/**
 * Lista de timeView de la pagina
 */
var TV_timeViewList=new Array();

/**
 * Contructor de la clase
 */
function TimeViewManager(){}

/**
 * Inserta un evento en todos los timeview de la página
 * 
 * @param Object eventData Objeto que representa un evento
 */
TimeViewManager.addEvent=function(eventData){
	for (var i=0; i<TV_timeViewList.length; i++){
		TV_timeViewList[i].addEvent(eventData);
	}
}

/**
 * Modifica un evento en todos los timeview de la página
 * 
 * @param Object eventData Objeto que representa un evento
 */
TimeViewManager.updateEvent=function(eventData){
	for (var i=0; i<TV_timeViewList.length; i++){
		TV_timeViewList[i].updateEvent(eventData);
	}
}

/**
 * Elimina un evento de todos los timeview de la página
 * 
 * @param String eventId Identificador del evento a eliminar
 */
TimeViewManager.deleteEvent=function(eventId){
	for (var i=0; i<TV_timeViewList.length; i++){
		TV_timeViewList[i].deleteEvent(eventId);
	}
}

/**
 * Avanza el intervalo del timeview indicado un mes, semana o día, dependiendo del tipo de timeview
 * 
 * @param String tvId Identificador del timeview
 */
TimeViewManager.goNext=function(tvId){
	for (var i=0; i<TV_timeViewList.length; i++){
		if (TV_timeViewList[i].tvId==tvId){
			TV_timeViewList[i].goNext();
			break;
		}
	}
}

/**
 * Avanza el intervalo del timeview indicado un mes, semana o día, dependiendo del tipo de timeview
 * 
 * @param String tvId Identificador del timeview
 */
TimeViewManager.goPrev=function(tvId){
	for (var i=0; i<TV_timeViewList.length; i++){
		if (TV_timeViewList[i].tvId==tvId){
			TV_timeViewList[i].goPrev();
			break;
		}
	}
}

/**
 * Busca en la página los elementos definidos como Timeview y llama al constructor cada uno de ellos
 */
TimeViewManager.init=function(){
	var regExp1 = /horAxis-([DSME])/g;
	var regExp2 = /vertAxis-([DSME])/g;
	var regExp3 = /startDate-(\d\d\d\d-\d\d-\d\d)/g;
	var regExp4 = /endDate-(\d\d\d\d-\d\d-\d\d)/g;
	var regExp5 = /customClass-([_A-Za-z][_A-Za-z0-9]*)/g;
	var regExp6 = /hookClass-([_A-Za-z][_A-Za-z0-9]*)/g;
	var regExp7 = /groupTag-([_A-Za-z][_A-Za-z0-9]*)/g;
  	
  	$(".timeview").each(function (i){	  
		var elt=this;
		var eltClassName=this.className;
		var options = {
	  		horAxis:"M",
			vertAxis:"E",
			startDate:"2008-01-01",
			endDate:"2008-12-31",
			customClass:"",
			hookClass:"",
			groupTag:"",
			container: null
		};
		
		//Horizontal Axis
		if(eltClassName.search(regExp1) != -1) {
			options.horAxis = eltClassName.match(regExp1)[0].replace(/horAxis-/, '');
			if(!options.horAxis) {
			        options.horAxis = '';
			}
		}
		
		//vertAxis
		if(eltClassName.search(regExp2) != -1) {
			options.vertAxis = eltClassName.match(regExp2)[0].replace(/vertAxis-/, '');
			if(!options.vertAxis) {
			        options.vertAxis = '';
			}
		}
		
		//StartDate
		if(eltClassName.search(regExp3) != -1) {
			options.startDate = eltClassName.match(regExp3)[0].replace(/startDate-/, '');
			if(!options.startDate) {
			        options.startDate = '';
			}
		}
		
		//endDate
		if(eltClassName.search(regExp4) != -1) {
			options.endDate = eltClassName.match(regExp4)[0].replace(/endDate-/, '');
			if(!options.endDate) {
			        options.endDate = '';
			}
		}
		
		//customClass
		if(eltClassName.search(regExp5) != -1) {
			options.customClass = eltClassName.match(regExp5)[0].replace(/customClass-/, '');
			if(!options.customClass) {
			        options.customClass = '';
			}
		}
		
		//hookClass
		if(eltClassName.search(regExp6) != -1) {
			options.hookClass = eltClassName.match(regExp6)[0].replace(/hookClass-/, '');
			if(!options.hookClass) {
			        options.hookClass = '';
			}
		}
		
		//groupTag
		if(eltClassName.search(regExp7) != -1) {
			options.groupTag = eltClassName.match(regExp7)[0].replace(/groupTag-/, '');
			if(!options.groupTag) {
			        options.groupTag = '';
			}
		}
		
		options.container=this;
		TimeViewManager.makeTimeView(options);
	});
}

/**
 * Decide que tipo de timeview utilizar, lo crea y lo inicializa
 * 
 * @param Array options Array asociativo con las opciones del timeview a construir
 */
TimeViewManager.makeTimeView=function(options){
	var timeViewClass=null;
	var hookObject=null;
	
	if (options.customClass!=''){
		timeViewClass=options.customClass;
	}
	else if (options.horAxis=="D" && options.vertAxis=="S"){
		timeViewClass='GCalFaces_TimeViewDS';
	}
	else if (options.horAxis=="S" && options.vertAxis=="D"){
		timeViewClass='GCalFaces_TimeViewSD';
	}
	else if (options.horAxis=="S" && options.vertAxis=="M"){
		timeViewClass='GCalFaces_TimeViewSM';
	}
	else if (options.horAxis=="S" && options.vertAxis=="E"){
		timeViewClass='GCalFaces_TimeViewSE';
	}
	else if (options.horAxis=="M" && options.vertAxis=="D"){
		timeViewClass='GCalFaces_TimeViewMD';
	}
	else if (options.horAxis=="M" && options.vertAxis=="S"){
		timeViewClass='GCalFaces_TimeViewMS';
	}
	else if (options.horAxis=="M" && options.vertAxis=="E"){
		timeViewClass='GCalFaces_TimeViewME';
	}
	
	//Creacion del objeto
	if (timeViewClass!=null){
		var tv=null;
		
		//Cargamos el objeto hook si es necesario
		if (options.hookClass!=''){
			//Si no existe la clase intentamos cargarla dinamicamente
			if (eval('typeof '+options.hookClass)=='undefined'){
				$.ajax({
					type: "GET",
					url: 'js/GCalFaces/'+options.hookClass+'.js',
					dataType: "script",
					success: function(msg){
						//Comprobamos si se cargo la clase correcta
						if (eval('typeof '+options.hookClass)!='undefined'){
							hookObject=eval('new '+options.hookClass+'();');

							//Si no existe la clase intentamos cargarla dinamicamente
							if (eval('typeof '+timeViewClass)=='undefined'){			 
								$.ajax({
									type: "GET",
									url: 'js/GCalFaces/'+timeViewClass+'.js',
									dataType: "script",
									success: function(msg){
										//Comprobamos si se cargo la clase correcta
										if (eval('typeof '+timeViewClass)!='undefined'){
											tv = eval('new '+timeViewClass+'(options.startDate, options.endDate, options.container, hookObject, options.groupTag);');
											tv.setId('tv'+TV_timeViewList.length+'_');
											tv.init();
											TV_timeViewList.push(tv);
										} else {
											//La clase no existe y no pudo cargarse
											alert('La clase '+timeViewClass+' no existe.');
										}
									},
									error: function(XMLHttpRequest, textStatus, errorThrown){
										alert('La clase '+timeViewClass+' no existe.');
									}
								});
							} else {
								//La clase existe
								tv = eval('new '+timeViewClass+'(options.startDate, options.endDate, options.container, hookObject, options.groupTag);');
								tv.setId('tv'+TV_timeViewList.length+'_');
								tv.init();
								TV_timeViewList.push(tv);
							}
						} else {
							//La clase no existe y no pudo cargarse
							alert('HookClass: La clase '+options.hookClass+' no existe.');
						}
					},
					error: function(XMLHttpRequest, textStatus, errorThrown){
						alert('HookClass: La clase '+options.hookClass+' no existe.');
					}
				});
			} else {
				//La clase existe
				hookObject=eval('new '+options.hookClass+'();');
			}		
		} else {
			//Si no existe la clase intentamos cargarla dinamicamente
			if (eval('typeof '+timeViewClass)=='undefined'){			 
				$.ajax({
					type: "GET",
					url: 'js/GCalFaces/'+timeViewClass+'.js',
					dataType: "script",
					success: function(msg){
						//Comprobamos si se cargo la clase correcta
						if (eval('typeof '+timeViewClass)!='undefined'){
							tv = eval('new '+timeViewClass+'(options.startDate, options.endDate, options.container, hookObject, options.groupTag);');
							tv.init();
							TV_timeViewList.push(tv);
						} else {
							//La clase no existe y no pudo cargarse
							alert('La clase '+timeViewClass+' no existe.');
						}
					},
					error: function(XMLHttpRequest, textStatus, errorThrown){
						alert('La clase '+timeViewClass+' no existe.');
					}
				});
			} else {
				//La clase existe
				tv = eval('new '+timeViewClass+'(options.startDate, options.endDate, options.container, hookObject, options.groupTag);');
				tv.setId('tv'+TV_timeViewList.length+'_');
				tv.init();
				TV_timeViewList.push(tv);
			}
		}
	} else {
		alert('Las opciones indicadas no corresponden con un tipo válido\nHorizontal: '+options.horAxis+'\nVertical: '+options.vertAxis);
	}
}

             
$(document).ready(function() {
 	//Dibuja los timeview especificados en el documento
 	TimeViewManager.init();
});