/**
 * Clase general para la representacion de calendarios
 * 
 * @package GCalFaces
 */

/**
 * Contructor de la clase
 * 
 * @param string startDate Fecha de inicio del timeview
 * @param string endDate Fecha de fin del timeview
 * @param HtmlNode container Elemento HTML que contendra el timeview
 */
function GCalFaces_TimeView(startDate, endDate, container){
	this.startDate=DateUtils.dateFromGCal(startDate)
	this.endDate=DateUtils.dateFromGCal(endDate);
	this.container=container;
	this.eventList=new Array();
	
	if (!this.startDate){
		this.startDate=new Date();
	}
	if (!this.endDate){
		this.endDate=new Date();
	}
	
	/* Estructura de eventos
	 * La lista de eventos es un array de elemenos de este tipo en el que
	 * el ultimo campo es una lista de eventos tal y como los devuelve
	 * el controlador.
	 * Los elementos sin tag, se añaden a un elementos con tagName=null
	 * y tagValue=null  
			{ tagName: "parciales",
			  tagValue: "MFIS",
			  events: []
			}

	 */

  //Eventos de ejemplo
  /*
  this.eventList=[{
	tagName: null,
	tagValue: null,
	events: [
		    {
		      id:"eventId1",
		      title:"titulo1",
		      content:"contenido1",
		      where:["lugar1"],
		      when:[{startDate:"s_fecha1", endDate:"e_fecha1"},{startDate:"s_fecha1", endDate:"e_fecha1"},{startDate:"s_fecha1", endDate:"e_fecha1"}]
		    },
		    {
		      id:"eventId2",
		      title:"titulo2",
		      content:"contenido2",
		      where:["lugar2"],
		      when:[{startDate:"s_fecha2", endDate:"e_fecha2"},{startDate:"s_fecha2", endDate:"e_fecha2"}]
		    },
		    {
		      id:"eventId3",
		      title:"titulo3",
		      content:"contenido3",
		      where:["lugar3"],
		      when:[{startDate:"s_fecha3", endDate:"e_fecha3"}]
		    }
		]}];
  */
}

/**
 * Cadena indentificadora del timeview
 */
GCalFaces_TimeView.prototype.tvId=null;

/**
 * Fecha de inicio del timeview en formato nativo
 */
GCalFaces_TimeView.prototype.startDate=null;

/**
 * Fecha de fin del timeview en formato nativo
 */
GCalFaces_TimeView.prototype.endDate=null;
/**
 * Elemento HTML que contendra el timeview
 */
GCalFaces_TimeView.prototype.container=null;
/**
 * Objeto gancho para la personalizacion de funciones
 */
GCalFaces_TimeView.prototype.hookObject=null;
/**
 * Estructura de datos para almacenar la lista de evento del timeview
 */
GCalFaces_TimeView.prototype.eventList=null;
/**
 * Fecha de ultima actualizacion de la lista de evento en formato nativo
 */
GCalFaces_TimeView.prototype.lastUpdated=null;
/**
 * Identificador del contador de refresco de evento
 */
GCalFaces_TimeView.prototype.refreshEventsId=null;
/**
 * Identificador del contador de refresco del rederizado del momento actual
 */
GCalFaces_TimeView.prototype.refreshDrawId=null;
/**
 * Cadena con el nombre de la etiqueta de agrupacion
 */
GCalFaces_TimeView.prototype.groupTag=null;

/**
 * Booleano que indica si la estructura principal ha sido dibujada
 */
GCalFaces_TimeView.prototype.structureInit=false;
/**
 * Elemnto HTML que contiene la lista de eventos renderizada
 */
GCalFaces_TimeView.prototype.rowsContainer=null;
/**
 * Elemento HTML que renderiza el momento actual
 */
GCalFaces_TimeView.prototype.currentTime=null;

/**
 * Establece la cadena de identificacion del TimeView
 * 
 * @param String id Identificador del Timeview
 */
GCalFaces_TimeView.prototype.setId=function(id){
	this.tvId=id;
}

/**
 * Inicializa el timeview pidiendo los evento al servidor y dibujando la estructura inicial
 */
GCalFaces_TimeView.prototype.init=function(){
	//Alguno de los parametros principales no son válidos
	if (!this.startDate || !this.endDate || !this.container){
		return null;
	}
	
	var pointer=this;
	var url="searchEvents.php";
	var data={action: "find_event_json", 
		startDate: DateUtils.dateToGCal(this.startDate),
		endDate: DateUtils.dateToGCal(this.endDate)
	};
	var callback=function(data){ 
		pointer.parseEvents(data);
		pointer.drawEvents();
	};
	  
	//Cargar eventos
	$.getJSON(url,data,callback);
	
	//Dibujar estructura principal
	this.drawStructure();
	
	//Refrescar eventos cada dos minutos
	this.refreshEventsId=setInterval(function(){ pointer.refreshEvents(); },
									 2*60*1000);
	
	//Refrescar dibujado cada minuto (por ejemplo para representar la hora actual
	this.refreshDrawId=setInterval(function(){ pointer.refreshDraw(); },
								   60*1000);
}

/**
 * Busca un evento en la lista de evento por su identificador
 * 
 * @param String eventId Identificador del evento
 * @return Object eventId Objeto que indica si existe el evento, asi como su indice de grupo y evento
 */
GCalFaces_TimeView.prototype.searchEventData=function(eventId){
	var groupIndex=null;
	var eventIndex=null;
  	var exist=false;
  	
	for(var i=0; i<this.eventList.length && !exist; i++){
		for(var j=0; j<this.eventList[i].events.length && !exist; j++){
			if (this.eventList[i].events[j].id==eventId){
				//Existe
				exist=true;
				groupIndex=i;
				eventIndex=j;
			}
		}
	}
	
	return { 
		exist:exist, 
		groupIndex:groupIndex, 
		eventIndex:eventIndex
	};
}

/**
 * Parsea los eventos obtenidos y los almacena en la lista de eventos
 * 
 * @param Object eventsData Objeto con la fecha de ultima actualizacion y un array de eventos
 */
GCalFaces_TimeView.prototype.parseEvents=function(eventsData){
	//Reset
	this.eventList=new Array();
	
	//Crear grupo nulo
	this.eventList.push({
		tagName: null,
		tagValue: null,
		events: new Array()
	});
	
	for(var i=0; i<eventsData.events.length; i++){
		this.addEventData(eventsData.events[i]);
	}
	
	this.lastUpdated=DateUtils.dateFromGCal(eventsData.lastUpdated);
}

/**
 * Procesa los eventos actualizados para insertarlos en la lista de eventos y renderizarlos
 * 
 * @param Object eventsData Objeto con la fecha de ultima actualizacion y un array de eventos
 */
GCalFaces_TimeView.prototype.parseUpdatedEvents=function(eventsData){
  	
  	for(var i=0; i<eventsData.events.length; i++){
  		//Buscamos si existe el evento
		var result=this.searchEventData(eventsData.events[i].id);
		
		
		if (eventsData.events[i].eventStatus=='canceled'){
			//Estado eliminado
			if (result.exist){
				this.deleteEvent(eventsData.events[i].id);
			}
		} else if (eventsData.events[i].eventStatus=='confirmed'){
			//Estado confirmado
			if (result.exist){
				this.updateEvent(eventsData.events[i]);
			} else {
				this.addEvent(eventsData.events[i]);
			}
		}
  	}
  	
  	//Actualizar lastUpdated
	this.lastUpdated=DateUtils.dateFromGCal(eventsData.lastUpdated);
}

/**
 * Inserta un evento en la lista de eventos
 * 
 * @param Object eventData Objeto que representa un evento
 */
GCalFaces_TimeView.prototype.addEventData=function(eventData){
	if (!DateUtils.isGCalDateTime(eventData.when[0].startDate) || DateUtils.dateFromGCal(eventData.when[0].startDate)<this.startDate ||
		!DateUtils.isGCalDateTime(eventData.when[0].endDate) || DateUtils.dateFromGCal(eventData.when[0].endDate)>this.endDate){
		//El evento no pertenece al rango de fechas
		return false;
	}
	
	if (this.groupTag==null){
		//Eventos no agrupados
		this.eventList[0].events.push(eventData);
	} else {
		//Eventos agrupados por tag
		var eventTagValue=null;
			
		//Buscamos si el evento tiene un tag con el nombre del groupTag
		for (var j=0; j<eventData.extendedProperty.length; j++){
			if (eventData.extendedProperty[j].name==this.groupTag){
				eventTagValue=eventData.extendedProperty[j].value;
				break;
			}
		}
		
		//Buscamos si existe un grupo con el valor del tagValue obtenido 		
		var groupIndex=null;
		var exist=false;
	  	
		for(var i=0; i<this.eventList.length && !exist; i++){
			if (this.eventList[i].tagValue==eventTagValue){
				exist=true;
				groupIndex=i;
			}
		}

		if (exist){
			//Si existe el tag => a�adirlo
			this.eventList[groupIndex].events.push(eventData);
		} else {
			//Si no existe el tag => crearlo
			this.eventList.push({
				tagName: this.groupTag,
				tagValue: eventTagValue,
		  		events: new Array(eventData)
		  	});
		}
	}
}

/**
 * Inserta un evento en la lista de eventos y lo dibuja en su lugar
 * 
 * @param Object eventData Objeto que representa un evento
 */
GCalFaces_TimeView.prototype.addEvent=function(eventData){
	if (!DateUtils.isGCalDateTime(eventData.when[0].startDate) || DateUtils.dateFromGCal(eventData.when[0].startDate)<this.startDate ||
		!DateUtils.isGCalDateTime(eventData.when[0].endDate) || DateUtils.dateFromGCal(eventData.when[0].endDate)>this.endDate){
		//El evento no pertenece al rango de fechas
		return false;
	}
	
	this.addEventData(eventData);
	this.drawEvent(eventData);
}

/**
 * Actualiza un evento en la lista de eventos
 * 
 * @param Object eventData Objeto que representa un evento
 */
GCalFaces_TimeView.prototype.updateEventData=function(eventData){
	if (!DateUtils.isGCalDateTime(eventData.when[0].startDate) || DateUtils.dateFromGCal(eventData.when[0].startDate)<this.startDate ||
		!DateUtils.isGCalDateTime(eventData.when[0].endDate) || DateUtils.dateFromGCal(eventData.when[0].endDate)>this.endDate){
		//El evento no pertenece al rango de fechas
		return false;
	}
	
  	//Buscamos si existe el evento
	var result=this.searchEventData(eventData.id);
	
	if (result.exist){
		//Actualizamos los datos
		this.eventList[result.groupIndex].events[result.eventIndex].title=eventData.title;
		this.eventList[result.groupIndex].events[result.eventIndex].content=eventData.content;
		this.eventList[result.groupIndex].events[result.eventIndex].where=eventData.where;
		this.eventList[result.groupIndex].events[result.eventIndex].when=eventData.when;
		this.eventList[result.groupIndex].events[result.eventIndex].extendedProperty=eventData.extendedProperty;		
	} else {
		//No existe...�? no deberiamos estar aqui
	}
}

/**
 * Actualiza un evento en la lista de eventos y en la representacion
 * 
 * @param Object eventData Objeto que representa un evento
 */
GCalFaces_TimeView.prototype.updateEvent=function(eventData){
	if (!DateUtils.isGCalDateTime(eventData.when[0].startDate) || DateUtils.dateFromGCal(eventData.when[0].startDate)<this.startDate ||
		!DateUtils.isGCalDateTime(eventData.when[0].endDate) || DateUtils.dateFromGCal(eventData.when[0].endDate)>this.endDate){
		//El evento no pertenece al rango de fechas
		return false;
	}
	
	this.updateEventData(eventData);
	this.drawUpdatedEvent(eventData);
}

/**
 * Elimina un evento de la lista de eventos
 * 
 * @param String eventId Identificador del evento a eliminar
 */
GCalFaces_TimeView.prototype.deleteEventData=function(eventId){
  	//Buscamos si existe el evento
	var result=this.searchEventData(eventId);
	
	if (result.exist){
		this.eventList[result.groupIndex].events.splice(result.eventIndex,1);
		if (this.eventList[result.groupIndex].events.length==0 && 
			this.eventList[result.groupIndex].tagName!=null){
			//Si el grupo queda vacio y no es el grupo nulo lo eliminamos
			this.eventList.splice(result.groupIndex,1);
		}
	}/* else {
		//No existe, debido a que este fuera del intervalo de fechas.
		alert("No existe el id del elemento a eliminar.");
	}*/
}

/**
 * Elimina un evento de la lista de eventos y de la representacion
 * 
 * @param String eventId Identificador del evento a eliminar
 */
GCalFaces_TimeView.prototype.deleteEvent=function(eventId){
	//Primero lo eliminamos de la representacion
	this.drawDeletedEvent(eventId);
	
	//Despues de la cache de datos
	this.deleteEventData(eventId);
}

/**
 * Actualiza la lista de eventos para comprobar actualizaciones
 */
GCalFaces_TimeView.prototype.refreshEvents=function(){
	//Pedir eventos actualizados
	var pointer=this;
	var url="searchEvents.php";

	var data={action: "find_event_json", 
		startDate: DateUtils.dateToGCal(this.startDate),
		endDate: DateUtils.dateToGCal(this.endDate),
		updated_min: DateUtils.dateTimeToGCal(this.lastUpdated)+'Z'
	};
	var callback=function(data){
		pointer.parseUpdatedEvents(data);
	};

	$.getJSON(url,data,callback);	
}

/**
 * Renderiza la estructura principal del timeview
 */
GCalFaces_TimeView.prototype.drawStructure=function(){}

/**
 * Renderiza la lista inicial de eventos recibidos
 */
GCalFaces_TimeView.prototype.drawEvents=function(){}

/**
 * Renderiza el evento indicado en la estructura
 * 
 * @param Object eventData Objeto que representa un evento
 */
GCalFaces_TimeView.prototype.drawEvent=function(eventData){}

/**
 * Crea el nodo HTML del evento para renderizarlo
 * 
 * @param Object eventData Objeto que representa un evento
 */
GCalFaces_TimeView.prototype.makeEventDOM=function(eventData){}

/**
 * Crea el nodo HTML del grupo de eventos para Renderizarlo
 * 
 * @param Object eventData Objeto que representa un evento
 */
GCalFaces_TimeView.prototype.makeEventGroupDOM=function(eventGroup){}

/**
 * Crea una funcion que devuelve el cuerto del tooltip de cada evento
 * 
 * @param Object eventData Objeto que representa un evento
 * @return Function Funcion que crea el cuerpo del tooltip
 */
GCalFaces_TimeView.prototype.makeToolTip=function(eventData){}

/**
 * Actualiza la representacion del evento indicado en la estructura
 * 
 * @param Object eventData Objeto que representa un evento
 */
GCalFaces_TimeView.prototype.drawUpdatedEvent=function(eventData){}

/**
 * Elimina un evento de la representacion
 * 
 * @param String eventId Identificador del evento a eliminar
 */
GCalFaces_TimeView.prototype.drawDeletedEvent=function(eventId){}

/**
 * Actualiza la representacion de acuerdo al momento actual
 */
GCalFaces_TimeView.prototype.refreshDraw=function(){}

/**
 * Avanza el intervalo de representacion un mes, semana o día, dependiendo del tipo de timeview
 */
GCalFaces_TimeView.prototype.goNext=function(){}

/**
 * Retrocede el intervalo de representacion un mes, semana o día, dependiendo del tipo de timeview
 */
GCalFaces_TimeView.prototype.goPrev=function(){}

