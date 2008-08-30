/**
 * Clase TimeViewSM para la representacion de calendarios
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
function GCalFaces_TimeViewSM(startDate, endDate, container, hookObject, groupTag){
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

GCalFaces_TimeViewSM.prototype = new GCalFaces_TimeView();

/**
 * Renderiza la estructura principal del timeview
 */
GCalFaces_TimeViewSM.prototype.drawStructure=function(){
 	//Si el objeto gancho define el método lo usamos
	if (this.hookObject!=null && typeof this.hookObject.refreshDraw=="function"){
		this.hookObject.refreshDraw(this);
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
	
	//var firstMonth = this.startDate.getMonth();
	//var lastMonth = this.endDate.getMonth();
	var numMonths=(this.endDate.getFullYear()-this.startDate.getFullYear())*12+this.endDate.getMonth()-this.startDate.getMonth();
	var tdWidth=(95/6).toFixed(2);
	
	var html = '<div class="tvSM_one-month tvSM_new-row">' + 
			'<table class="tvSM" border="0" cellpadding="0" cellspacing="0"><thead>' + 
			'<tr class="tvSM_title-row">' + 
			'<td style="width: 5%">##</td>';
			
	for (var week = 1; week <= 6; week++){
		html += '<td style="width: ' + tdWidth + '%">Semana' + week  + '</td>';
	}
	
	printDate = new Date(this.startDate.getFullYear(), this.startDate.getMonth(), this.startDate.getDate());
	
	var drawMonth = this.startDate.getMonth();
	var drawYear = this.startDate.getFullYear();
	for(var numMonth=0; numMonth<=numMonths; numMonth++){
		printDate.setFullYear(drawYear);
		printDate.setMonth(drawMonth);
		printDate.setDate(DateUtils.getDaysInMonth(drawYear,drawMonth));
		
		var tmpDate=new Date()
		tmpDate.setTime(printDate.valueOf());
		printDate.setDate(1);
		var numWeeks=Math.floor(((tmpDate - printDate) / 86400000) / 7) + 1;
		
		html += '<tr class="tvSM_days-row">' +
				'<td class="tvSM_week-col"><div class="tvSM_cellfill">';
		if (numMonth==0){
			html += '<a class="tvSM_goPrev" onclick="TimeViewManager.goPrev(\''+this.tvId+'\');">&laquo;</a><br />';
		} 
		html += monthNames[drawMonth]+(drawMonth==11?' '+drawYear:(drawMonth==0)?' '+drawYear:'');
		if (numMonth==numMonths){
			html += '<br /><a class="tvSM_goNext" onclick="TimeViewManager.goNext(\''+this.tvId+'\');">&raquo;</a>';
		}  
		html += '</div></td>';
				
		for (var week = 1; week <= 6; week++){
			var isToday=(DateUtils.iso8601Week(printDate)==DateUtils.iso8601Week(today));
			var otherMonth = (week> numWeeks);
			var unselectable = otherMonth;
			var tdId = this.tvId+drawYear+''+(drawMonth+1)+''+week;
			
			html += '<td id="' + tdId + '" class="tvSM_days-cell' +
					(otherMonth ? ' tvSM_otherMonth' : '') + // highlight days from other months
					(unselectable ? ' tvSM_unselectable' : '') +  // highlight unselectable days
					(isToday ? ' tvSM_today' : '') + '"' + // highlight today (if different)
					
					(unselectable ? '>' : ' onmouseover="jQuery(this).addClass(\'tvSM_days-cell-over\');"' +
					' onmouseout="jQuery(this).removeClass(\'tvSM_days-cell-over\');">' +
					'<a onclick="GCalFaces.addForm(\''+
					((week-1)*7+1)+'/'+(printDate.getMonth()+1)+'/'+printDate.getFullYear()+'\');">' + 
					((week-1)*7+1)+'</a>') + 
					
					'</td>'; // display for this month
			printDate.setDate(printDate.getDate() + 7);
		}
		html += '</tr>';
		drawMonth++;
		if (drawMonth>11){
			drawMonth=0;
			drawYear++;
		}
	}
	html += '</tbody></table></div>';
	html += '<div style="clear: both;"></div>';


	var tempDate=new Date(today.getFullYear(),today.getMonth(),1);
	var firstWeek=DateUtils.iso8601Week(tempDate)
	var todayWeek=DateUtils.iso8601Week(today)-firstWeek+1;
	this.currentTime=$("#"+this.tvId+today.getFullYear()+""+(today.getMonth()+1)+""+todayWeek).get(0);
	
	structure=document.createElement("div");
	structure.className= "tvSM_structure";
	structure.innerHTML=html;

	this.container.appendChild(structure);
	this.structureInit=true;
	
	return;
}

/**
 * Renderiza la lista inicial de eventos recibidos
 */
GCalFaces_TimeViewSM.prototype.drawEvents=function(){
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
GCalFaces_TimeViewSM.prototype.drawEvent=function(eventData){
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
GCalFaces_TimeViewSM.prototype.makeEventDOM=function(eventData){
	//Si el objeto gancho define el método lo usamos
	if (this.hookObject!=null && typeof this.hookObject.makeEventDOM=="function"){
		return this.hookObject.makeEventDOM(this, eventData);
	}
	
	var row;
	var rowheader;
	var rowbody;
	var timecell;

	row=document.createElement("div");
	row.className="tvSM_event";
	row.setAttribute("id", this.tvId+eventData.id);
	row.onclick=function(){GCalFaces.editForm({id:eventData.id})};

	rowheader=document.createElement("div");
	rowheader.className="tvSM_eventname";
	rowheader.appendChild(document.createTextNode(eventData.title));

	row.appendChild(rowheader);

	rowbody=document.createElement("div");
	rowbody.className="tvSM_eventbody";
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
GCalFaces_TimeViewSM.prototype.makeEventGroupDOM=function(eventGroup){
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
GCalFaces_TimeViewSM.prototype.makeToolTip=function(eventData){
	//Si el objeto gancho define el método lo usamos
	if (this.hookObject!=null && typeof this.hookObject.makeToolTip=="function"){
		return this.hookObject.makeToolTip(this, eventData);
	}
	
	var bodyHandler= function(){
		var startDate=DateUtils.dateFromGCal(eventData.when[0].startDate);
		var printStartDate=startDate.getDate()+"/"+(startDate.getMonth()+1)+"/"+startDate.getFullYear();
		var endDate=DateUtils.dateFromGCal(eventData.when[0].endDate);
		var printEndDate=endDate.getDate()+"/"+(endDate.getMonth()+1)+"/"+endDate.getFullYear();
		
		return '<div class="tvSM_tooltip">'+
		  '<div class="tvSM_tooltip_name">'+eventData.title+'</div>'+
		  '<div class="tvSM_tooltip_startDate">'+printStartDate+'</div>'+
		  '<div class="tvSM_tooltip_endDate">'+printEndDate+'</div>'+
		  '<div class="tvSM_tooltip_where">'+(eventData.where.length>0?eventData.where[0]:'')+'</div>'+
		'</div>';
	}
	
	return bodyHandler;
}

/**
 * Actualiza la representacion del evento indicado en la estructura
 * 
 * @param Object eventData Objeto que representa un evento
 */
GCalFaces_TimeViewSM.prototype.drawUpdatedEvent=function(eventData){
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
GCalFaces_TimeViewSM.prototype.drawDeletedEvent=function(eventId){
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
GCalFaces_TimeViewSM.prototype.refreshDraw=function(){
	//Si el objeto gancho define el método lo usamos
	if (this.hookObject!=null && typeof this.hookObject.drawDeletedEvent=="function"){
		this.hookObject.drawDeletedEvent(this, eventId);
		return;
	}
	
	var now = new Date();
	var tempDate=new Date(now.getFullYear(),now.getMonth(),1);
	var firstWeek=DateUtils.iso8601Week(tempDate)
	var todayWeek=DateUtils.iso8601Week(now)-firstWeek+1;

	$(this.currentTime).removeClass("tvSM_today");
	this.currentTime=$("#"+this.tvId+now.getFullYear()+""+(now.getMonth()+1)+""+todayWeek).get(0);
	$(this.currentTime).addClass("tvSM_today");
}

/**
 * Avanza el intervalo de representacion un mes, semana o día, dependiendo del tipo de timeview
 */
GCalFaces_TimeViewSM.prototype.goNext=function(){
	this.startDate.setMonth(this.startDate.getMonth()+1);
	this.endDate.setMonth(this.endDate.getMonth()+1);
	this.init();
}

/**
 * Retrocede el intervalo de representacion un mes, semana o día, dependiendo del tipo de timeview
 */
GCalFaces_TimeViewSM.prototype.goPrev=function(){
	this.startDate.setMonth(this.startDate.getMonth()-1);
	this.endDate.setMonth(this.endDate.getMonth()-1);
	this.init();
}
