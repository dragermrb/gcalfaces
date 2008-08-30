/**
 * Clase TimeViewMS para la representacion de calendarios
 * 
 * @package GCalFaces
 */

/**
 * Contructor de la clase
 * 
 * @param string startDate Fecha de inicio del timeview
 * @param string endDate Fecha de fin del timeview
 * @param HtmlNode container Elemento HTML que contendra el timeview
 * @param Object hookObject Objeto gancho para el renderizado o null
 * @param string groupTag Nombre de la etiqueta de agrupacion o null
 */
function GCalFaces_TimeViewMS(startDate, endDate, container, hookObject, groupTag){
	this.startDate=DateUtils.dateFromGCal(startDate)
	this.endDate=DateUtils.dateFromGCal(endDate);
	if (hookObject!=null){
		this.hookObject=hookObject;
	}
	
	this.container=container;
	this.eventList=new Array();
	
	if (!this.startDate){
		this.startDate=new Date();
	}
	if (!this.endDate){
		this.endDate=new Date();
	}
	if (groupTag!=''){
		this.groupTag=groupTag;
	}
	
	//Obligamos a representar meses completos
	this.startDate.setDate(1);
	this.endDate.setDate(DateUtils.getDaysInMonth(this.endDate.getFullYear(), this.endDate.getMonth()));
}

GCalFaces_TimeViewMS.prototype = new GCalFaces_TimeView();

/**
 * Renderiza la estructura principal del timeview
 */
GCalFaces_TimeViewMS.prototype.drawStructure=function(){
	//Si el objeto gancho define el método lo usamos
	if (this.hookObject!=null && typeof this.hookObject.drawStructure=="function"){
		this.hookObject.drawStructure(this);
		return;
	}
 
	//Dibujar la estructura
	var structure;
	var colheaders;

	//TODO: Añadir internacionalizacion 
	var monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
	
	this.container.innerHTML = "";
	
	var today = new Date();
	today = new Date(today.getFullYear(), today.getMonth(), today.getDate()); // clear time
	
	var numMonths=(this.endDate.getFullYear()-this.startDate.getFullYear())*12+this.endDate.getMonth()-this.startDate.getMonth();
	var tdWidth=(95/(numMonths+1)).toFixed(2);
	
	var html = '<div class="tvMS_one-month tvMS_new-row">' + 
			'<table class="tvMS" border="0" cellpadding="0" cellspacing="0"><thead>' + 
			'<tr class="tvMS_title-row">' + 
			'<td style="width: 5%">##</td>';
	
	var drawMonth = this.startDate.getMonth();
	var drawYear = this.startDate.getFullYear();
	for(var numMonth=0; numMonth<=numMonths; numMonth++){
		html += '<td style="width: ' + tdWidth + '%">';
		if (numMonth==0){
			html += '<a class="tvMS_goPrev" onclick="TimeViewManager.goPrev(\''+this.tvId+'\');">&laquo;</a> ';
		}
		html += monthNames[drawMonth]+(drawMonth==11?' '+drawYear:(drawMonth==0)?' '+drawYear:'');
		if (numMonth==numMonths){
			html += ' <a class="tvMS_goNext" onclick="TimeViewManager.goNext(\''+this.tvId+'\');">&raquo;</a>';
		} 
		html += '</td>';
		
		drawMonth++;
		if (drawMonth>11){
			drawMonth=0;
			drawYear++;
		}
	}
	
	printDate = new Date(this.startDate.getFullYear(), this.startDate.getMonth(), this.startDate.getDate());
	for (var row = 1; row <= 6; row++){
		printDate = new Date(this.startDate.getFullYear(), 
			this.startDate.getMonth(), 
			this.startDate.getDate()+row-1);
		
		html += '<tr class="tvMS_days-row">' +
				'<td class="tvMS_week-col"><div class="tvMS_cellfill">Sem ' + row + '</div></td>';
		
		drawMonth = this.startDate.getMonth();
		for(var numMonth=0; numMonth<=numMonths; numMonth++){
			printDate.setFullYear(drawYear);
			printDate.setMonth(drawMonth);
			printDate.setDate(DateUtils.getDaysInMonth(drawYear,drawMonth));
			var lastWeek=DateUtils.iso8601Week(printDate);
			printDate.setDate(1);
			var firstWeek=DateUtils.iso8601Week(printDate);
			var isToday=((firstWeek+row-1)==DateUtils.iso8601Week(today));
			var otherMonth = (row>(lastWeek-firstWeek));
			var unselectable = otherMonth;
			var dow = printDate.getDay();
			var tdId = this.tvId+printDate.getFullYear()+''+(drawMonth+1)+''+row;
			
			html += '<td id="' + tdId + '" class="tvMS_days-cell' +
					(otherMonth ? ' tvMS_otherMonth' : '') + // highlight days from other months
					(unselectable ? ' tvMS_unselectable' : '') +  // highlight unselectable days
					(isToday ? ' tvMS_today' : '') + '"' + // highlight today (if different)
					
					(unselectable ? '>' : ' onmouseover="jQuery(this).addClass(\'tvMS_days-cell-over\');"' +
					' onmouseout="jQuery(this).removeClass(\'tvMS_days-cell-over\');"'+
					'><a onclick="GCalFaces.addForm(\''+
					((row-1)*7+1)+'/'+(printDate.getMonth()+1)+'/'+printDate.getFullYear()+'\');">' + 
					((row-1)*7+1)+'</a>') + 
					'</td>'; // display for this month
					
			printDate.setMonth(printDate.getMonth() + 1);
			drawMonth++;
			if (drawMonth>11){
				drawMonth=0;
			}
		}
		html += '</tr>';
	}
	html += '</tbody></table></div>';
	html += '<div style="clear: both;"></div>';


	var tempDate=new Date(today.getFullYear(),today.getMonth(),1);
	var firstWeek=DateUtils.iso8601Week(tempDate)
	var todayWeek=DateUtils.iso8601Week(today)-firstWeek+1;
	this.currentTime=$("#"+this.tvId+today.getFullYear()+""+(today.getMonth()+1)+""+todayWeek).get(0);
	
	structure=document.createElement("div");
	structure.className="tvMS_structure";
	structure.innerHTML=html;

	this.container.appendChild(structure);
	this.structureInit=true;
	
	return;
}

/**
 * Renderiza la lista inicial de eventos recibidos
 */
GCalFaces_TimeViewMS.prototype.drawEvents=function(){
	//Si el objeto gancho define el método lo usamos
	if (this.hookObject!=null && typeof this.hookObject.drawEvents=="function"){
		this.hookObject.drawEvents(this);
		return;
	}
	
	if (this.structureInit){
		//Estructura lista, comenzar a dibujar
		for(var i=0; i<this.eventList.length; i++){
			for(var j=0; j<this.eventList[i].events.length; j++){
				this.drawEvent(this.eventList[i].events[j]);
			}
		}
	} else {
		//Estructura aun no dibujada
		alert("ERROR: Los eventos llegaron antes de montar la estructura");
	}
}

/**
 * Renderiza el evento indicado en la estructura
 * 
 * @param Object eventData Objeto que representa un evento
 */
GCalFaces_TimeViewMS.prototype.drawEvent=function(eventData){
	//Si el objeto gancho define el método lo usamos
	if (this.hookObject!=null && typeof this.hookObject.drawEvent=="function"){
		this.hookObject.drawEvent(this, eventData);
		return;
	}
	
	//No distinguimos si estan agrupados
	var eventDate=DateUtils.dateFromGCal(eventData.when[0].startDate);
	var tempDate=new Date(eventDate.getFullYear(),eventDate.getMonth(),1);
	var firstWeek=DateUtils.iso8601Week(tempDate)
	var eventDateWeek=DateUtils.iso8601Week(eventDate)-firstWeek+1;
	var divTarget=$("#"+this.tvId+eventDate.getFullYear()+""+(eventDate.getMonth()+1)+""+eventDateWeek).get(0);
	var divEvent=this.makeEventDOM(eventData);
	divTarget.appendChild(divEvent);	
}

/**
 * Crea el nodo HTML del evento para renderizarlo
 * 
 * @param Object eventData Objeto que representa un evento
 */
GCalFaces_TimeViewMS.prototype.makeEventDOM=function(eventData){
	//Si el objeto gancho define el método lo usamos
	if (this.hookObject!=null && typeof this.hookObject.makeEventDOM=="function"){
		return this.hookObject.makeEventDOM(this, eventData);
	}
	
	var row;
	var rowheader;
	var rowbody;
	var timecell;

	row=document.createElement("div");
	row.className="tvMS_event";
	row.setAttribute("id", this.tvId+eventData.id);
	row.onclick=function(){GCalFaces.editForm({id:eventData.id})};

	rowheader=document.createElement("div");
	rowheader.className="tvMS_eventname";
	rowheader.appendChild(document.createTextNode(eventData.title));

	row.appendChild(rowheader);

	rowbody=document.createElement("div");
	rowbody.className="tvMS_eventbody";
	rowbody.appendChild(document.createTextNode(eventData.content));

	row.appendChild(rowbody);
	$(row).tooltip({ 
	    track: true, 
	    delay: 0, 
	    showURL: false, 
	    opacity: 1, 
	    fixPNG: true, 
	    showBody: " - ", 
	    extraClass: "pretty", 
	    top: -15, 
	    left: 5,
	    bodyHandler: this.makeToolTip(eventData)
	});
	
	return row;
}

/**
 * Crea el nodo HTML del grupo de eventos para Renderizarlo
 * 
 * @param Object eventData Objeto que representa un evento
 */
GCalFaces_TimeViewMS.prototype.makeEventGroupDOM=function(eventGroup){
	//Si el objeto gancho define el método lo usamos
	if (this.hookObject!=null && typeof this.hookObject.makeEventGroupDOM=="function"){
		this.hookObject.makeEventGroupDOM(this, eventGroup);
		return;
	}
	
	//Este tipo no permite agrupaciones
	return null;
}

/**
 * Crea una funcion que devuelve el cuerto del tooltip de cada evento
 * 
 * @param Object eventData Objeto que representa un evento
 * @return Function Funcion que crea el cuerpo del tooltip
 */
GCalFaces_TimeViewMS.prototype.makeToolTip=function(eventData){
	//Si el objeto gancho define el método lo usamos
	if (this.hookObject!=null && typeof this.hookObject.makeToolTip=="function"){
		return this.hookObject.makeToolTip(this, eventData);
	}
	
	var bodyHandler= function(){
		var startDate=DateUtils.dateFromGCal(eventData.when[0].startDate);
		var printStartDate=startDate.getDate()+"/"+(startDate.getMonth()+1)+"/"+startDate.getFullYear();
		var endDate=DateUtils.dateFromGCal(eventData.when[0].endDate);
		var printEndDate=endDate.getDate()+"/"+(endDate.getMonth()+1)+"/"+endDate.getFullYear();
		
		return '<div class="tvMS_tooltip">'+
		  '<div class="tvMS_tooltip_name">'+eventData.title+'</div>'+
		  '<div class="tvMS_tooltip_startDate">'+printStartDate+'</div>'+
		  '<div class="tvMS_tooltip_endDate">'+printEndDate+'</div>'+
		  '<div class="tvMS_tooltip_where">'+(eventData.where.length>0?eventData.where[0]:'')+'</div>'+
		'</div>';
	}
	
	return bodyHandler;
}

/**
 * Actualiza la representacion del evento indicado en la estructura
 * 
 * @param Object eventData Objeto que representa un evento
 */
GCalFaces_TimeViewMS.prototype.drawUpdatedEvent=function(eventData){
	//Si el objeto gancho define el método lo usamos
	if (this.hookObject!=null && typeof this.hookObject.drawUpdatedEvent=="function"){
		this.hookObject.drawUpdatedEvent(this, eventData);
		return;
	}
	
	//No distinguimos si estan agrupados
	var eventDate=DateUtils.dateFromGCal(eventData.when[0].startDate);
	var tempDate=new Date(eventDate.getFullYear(),eventDate.getMonth(),1);
	var firstWeek=DateUtils.iso8601Week(tempDate)
	var eventDateWeek=DateUtils.iso8601Week(eventDate)-firstWeek+1;
	var divTarget=$("#"+this.tvId+eventDate.getFullYear()+""+(eventDate.getMonth()+1)+""+eventDateWeek).get(0);
	var divEvent=$("#"+this.tvId+eventData.id);
	var divEventUpdated=this.makeEventDOM(eventData);
	
	divEvent.remove();
	divTarget.appendChild(divEventUpdated);
}

/**
 * Elimina un evento de la representacion
 * 
 * @param String eventId Identificador del evento a eliminar
 */
GCalFaces_TimeViewMS.prototype.drawDeletedEvent=function(eventId){
	//Si el objeto gancho define el método lo usamos
	if (this.hookObject!=null && typeof this.hookObject.drawDeletedEvent=="function"){
		this.hookObject.drawDeletedEvent(this, eventId);
		return;
	}
	
	//No distinguimos si estan agrupados
	$("#"+this.tvId+eventId).remove();
}

/**
 * Actualiza la representacion de acuerdo al momento actual
 */
GCalFaces_TimeViewMS.prototype.refreshDraw=function(){
	//Si el objeto gancho define el método lo usamos
	if (this.hookObject!=null && typeof this.hookObject.refreshDraw=="function"){
		this.hookObject.refreshDraw(this);
		return;
	}
	
	var now = new Date();
	var tempDate=new Date(now.getFullYear(),now.getMonth(),1);
	var firstWeek=DateUtils.iso8601Week(tempDate)
	var todayWeek=DateUtils.iso8601Week(now)-firstWeek+1;

	$(this.currentTime).removeClass("tvMS_today");
	this.currentTime=$("#"+this.tvId+now.getFullYear()+""+(now.getMonth()+1)+""+todayWeek).get(0);
	$(this.currentTime).addClass("tvMS_today");
}

/**
 * Avanza el intervalo de representacion un mes, semana o día, dependiendo del tipo de timeview
 */
GCalFaces_TimeViewMS.prototype.goNext=function(){
	this.startDate.setMonth(this.startDate.getMonth()+1);
	this.endDate.setMonth(this.endDate.getMonth()+1);
	this.init();
}

/**
 * Retrocede el intervalo de representacion un mes, semana o día, dependiendo del tipo de timeview
 */
GCalFaces_TimeViewMS.prototype.goPrev=function(){
	this.startDate.setMonth(this.startDate.getMonth()-1);
	this.endDate.setMonth(this.endDate.getMonth()-1);
	this.init();
}