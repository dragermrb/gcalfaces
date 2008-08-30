/**
 * Clase TimeViewDS para la representacion de calendarios
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
function GCalFaces_TimeViewDS(startDate, endDate, container, hookObject, groupTag){
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
	this.endDate.setMonth(this.endDate.getMonth()+1);
	this.endDate.setDate(0);
	
	//Obligamos a representar semanas completas
	//this.startDate.setDate(this.startDate.getDate()-this.startDate.getDay());
	//this.endDate.setDate(this.endDate.getDate()+(6-this.startDate.getDay()));
}

GCalFaces_TimeViewDS.prototype = new GCalFaces_TimeView();

/**
 * Renderiza la estructura principal del timeview
 */
GCalFaces_TimeViewDS.prototype.drawStructure=function(){
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
	
	var drawMonth = this.startDate.getMonth();
	var drawYear = this.startDate.getFullYear();
	var firstDay = 1;
	var changeFirstDay = false;
	var dayNames = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
	var dayNamesShort = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
	var dayNamesMin = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
	var tdWidth=(95/7).toFixed(2);
	
	var html = '';
	var showWeeks = true;
	
	var numMonths=(this.endDate.getFullYear()-this.startDate.getFullYear())*12+this.endDate.getMonth()-this.startDate.getMonth();
	for (var row = 0; row <= numMonths; row++){
		var selectedDate = new Date(drawYear, drawMonth, this._selectedDay);
	
		html += '<div class="tvDS_one-month tvDS_new-row">' +
			'<div class="tvDS_header">' +
			'<a onclick="TimeViewManager.goPrev(\''+this.tvId+'\');">&laquo;</a>' + 
			monthNames[drawMonth] + ' ' + drawYear + 
			'<a onclick="TimeViewManager.goNext(\''+this.tvId+'\');" >&raquo;</a>'+
			'</div>' +
			'<table class="tvDS" border="0" cellpadding="0" cellspacing="0"><thead>' + 
			'<tr class="tvDS_title-row">' +
			(showWeeks ? '<td style="width: 5%">' + 'Sem' + '</td>' : '');
		
		for (var dow = 0; dow < 7; dow++) { // days of the week
			var day = (dow + firstDay) % 7;
			
			html += '<td style="width: ' + tdWidth + '%" ' + ((dow + firstDay + 6) % 7 >= 5 ? ' class="tvDS_week-end-cell"' : '') + '>' +
				'<span' + ' title="' + dayNames[day] + '">' +
				dayNamesShort[day] + '</span>' + '</td>';
		}
		html += '</tr></thead><tbody>';
		var daysInMonth = DateUtils.getDaysInMonth(drawYear, drawMonth);
		var leadDays = (DateUtils.getFirstDayOfMonth(drawYear, drawMonth) - firstDay + 7) % 7;			
		var printDate = new Date(drawYear, drawMonth, 1 - leadDays);
		var numRows = Math.ceil((leadDays + daysInMonth) / 7);
	
		var showOtherMonths = false;
		var calculateWeek = DateUtils.iso8601Week;
		
		for (var dRow = 0; dRow < numRows; dRow++) { // create date picker rows
			
			html += '<tr class="tvDS_days-row">' +
				(showWeeks ? '<td class="tvDS_week-col"><div class="tvDS_cellfill">' + calculateWeek(printDate) + '</div></td>' : '');
				
			
			for (var dow = 0; dow < 7; dow++) { // create date picker days
				var daySettings = [true, ''];
				var otherMonth = (printDate.getMonth() != drawMonth);
				var unselectable = otherMonth || !daySettings[0];
				var tdId = this.tvId+printDate.getFullYear()+''+(printDate.getMonth()+1)+''+printDate.getDate();
				
				html += '<td ' + (unselectable ? '' : 'id="' + tdId + '"') + ' class="tvDS_days-cell' +
					((dow + firstDay + 6) % 7 >= 5 ? ' tvDS_week-end-cell' : '') + // highlight weekends
					(otherMonth ? ' tvDS_otherMonth' : '') + // highlight days from other months
					
					(unselectable ? ' tvDS_unselectable' : '') +  // highlight unselectable days
					(otherMonth && !showOtherMonths ? '' : ' ' + daySettings[1] + // highlight custom dates
					
					(printDate.getTime() == today.getTime() ? ' tvDS_today' : '')) + '"' + // highlight today (if different)
					
					
					(unselectable ? '' : ' onmouseover="jQuery(this).addClass(\'tvDS_days-cell-over\');"' +
					' onmouseout="jQuery(this).removeClass(\'tvDS_days-cell-over\');"') +
					'>' + // actions
					(otherMonth ? (showOtherMonths ? printDate.getDate() : '&#xa0;') : // display for other months
					(unselectable ? printDate.getDate() : '<a onclick="GCalFaces.addForm(\''+
						printDate.getDate()+'/'+(printDate.getMonth()+1)+'/'+printDate.getFullYear()+'\');">' + 
						printDate.getDate() + '</a>')) + '</td>'; // display for this month
				printDate.setDate(printDate.getDate() + 1);
			}
			html += '</tr>';
		}
		
		drawMonth++;
		if (drawMonth > 11) {
			drawMonth = 0;
			drawYear++;
		}
		html += '</tbody></table></div>';
	}		
			
	html += '<div style="clear: both;"></div>';

	var today = new Date();
	this.currentTime=$("#"+this.tvId+today.getFullYear()+""+today.getMonth()+""+today.getDate()).get(0);
	
	structure=document.createElement("div");
	structure.className="tvDS_structure";
	structure.innerHTML=html;

	this.container.appendChild(structure);
	this.structureInit=true;
	
	return;
}

/**
 * Renderiza la lista inicial de eventos recibidos
 */
GCalFaces_TimeViewDS.prototype.drawEvents=function(){
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
		alert("ERROR: Los eventos llegaron antes de montar la estructura.");
	}
}

/**
 * Renderiza el evento indicado en la estructura
 * 
 * @param Object eventData Objeto que representa un evento
 */
GCalFaces_TimeViewDS.prototype.drawEvent=function(eventData){//Si el objeto gancho define el método lo usamos
	if (this.hookObject!=null && typeof this.hookObject.drawEvent=="function"){
		this.hookObject.drawEvent(this, eventData);
		return;
	}
	
	var eventDate=DateUtils.dateFromGCal(eventData.when[0].startDate);
	var divTarget=$("#"+this.tvId+eventDate.getFullYear()+""+(eventDate.getMonth()+1)+""+eventDate.getDate()).get(0);
	var divEvent=this.makeEventDOM(eventData);
	divTarget.appendChild(divEvent);	
}

/**
 * Crea el nodo HTML del evento para renderizarlo
 * 
 * @param Object eventData Objeto que representa un evento
 */
GCalFaces_TimeViewDS.prototype.makeEventDOM=function(eventData){
	//Si el objeto gancho define el método lo usamos
	if (this.hookObject!=null && typeof this.hookObject.makeEventDOM=="function"){
		return this.hookObject.makeEventDOM(this, eventData);
	}
	
	var row;
	var rowheader;
	var rowbody;
	var timecell;

	row=document.createElement("div");
	row.className='tvDS_event';
	row.id=this.tvId+eventData.id;
	row.onclick=function(){GCalFaces.editForm({id:eventData.id})};

	rowHtml='<div class="tvDS_eventname">'+eventData.title+'</div>'+
		'<div class="tvDS_eventbody">'+
		eventData.content+
		'</div>';

	row.innerHTML=rowHtml;
	$(row).tooltip({ 
	    track: true, 
	    delay: 0, 
	    showURL: false, 
	    opacity: 1, 
	    fixPNG: true, 
	    showBody: " - ", 
	    extraClass: "pretty", 
	    top: 0, 
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
GCalFaces_TimeViewDS.prototype.makeEventGroupDOM=function(eventGroup){
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
GCalFaces_TimeViewDS.prototype.makeToolTip=function(eventData){
	//Si el objeto gancho define el método lo usamos
	if (this.hookObject!=null && typeof this.hookObject.makeToolTip=="function"){
		return this.hookObject.makeToolTip(this, eventData);
	}
	
	var bodyHandler= function(){
		var startDate=DateUtils.dateFromGCal(eventData.when[0].startDate);
		var printStartDate=startDate.getDate()+"/"+(startDate.getMonth()+1)+"/"+startDate.getFullYear();
		var endDate=DateUtils.dateFromGCal(eventData.when[0].endDate);
		var printEndDate=endDate.getDate()+"/"+(endDate.getMonth()+1)+"/"+endDate.getFullYear();
		
		return '<div class="tvDS_tooltip">'+
		  '<div class="tvDS_tooltip_name">'+eventData.title+'</div>'+
		  '<div class="tvDS_tooltip_startDate">'+printStartDate+'</div>'+
		  '<div class="tvDS_tooltip_endDate">'+printEndDate+'</div>'+
		  '<div class="tvDS_tooltip_where">'+(eventData.where.length>0?eventData.where[0]:'')+'</div>'+
		'</div>';
	}
	
	return bodyHandler;
}

/**
 * Actualiza la representacion del evento indicado en la estructura
 * 
 * @param Object eventData Objeto que representa un evento
 */
GCalFaces_TimeViewDS.prototype.drawUpdatedEvent=function(eventData){
	//Si el objeto gancho define el método lo usamos
	if (this.hookObject!=null && typeof this.hookObject.drawUpdatedEvent=="function"){
		this.hookObject.drawUpdatedEvent(this, eventData);
		return;
	}
	
	//No distinguimos si estan agrupados
	var eventDate=DateUtils.dateFromGCal(eventData.where[0].startDate);
	var eventDate=DateUtils.dateFromGCal(eventData.when[0].startDate);
	var divTarget=$("#"+this.tvId+eventDate.getFullYear()+""+(eventDate.getMonth()+1)+""+eventDate.getDate()).get(0);
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
GCalFaces_TimeViewDS.prototype.drawDeletedEvent=function(eventId){
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
GCalFaces_TimeViewDS.prototype.refreshDraw=function(){
	//Si el objeto gancho define el método lo usamos
	if (this.hookObject!=null && typeof this.hookObject.refreshDraw=="function"){
		this.hookObject.refreshDraw(this);
		return;
	}
	
	var now = new Date();
	$(this.currentTime).removeClass("tvDS_today");
	this.currentTime=$("#"+this.tvId+now.getFullYear()+""+(now.getMonth()+1)+""+now.getDate()).get(0);
	$(this.currentTime).addClass("tvDS_today");
}

/**
 * Avanza el intervalo de representacion un mes, semana o día, dependiendo del tipo de timeview
 */
GCalFaces_TimeViewDS.prototype.goNext=function(){
	this.startDate.setMonth(this.startDate.getMonth()+1);
	this.endDate.setMonth(this.endDate.getMonth()+1);
	this.init();
}

/**
 * Retrocede el intervalo de representacion un mes, semana o día, dependiendo del tipo de timeview
 */
GCalFaces_TimeViewDS.prototype.goPrev=function(){
	this.startDate.setMonth(this.startDate.getMonth()-1);
	this.endDate.setMonth(this.endDate.getMonth()-1);
	this.init();
}
