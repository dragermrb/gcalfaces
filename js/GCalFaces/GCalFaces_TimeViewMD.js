/**
 * Clase TimeViewMD para la representacion de calendarios
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
function GCalFaces_TimeViewMD(startDate, endDate, container, hookObject, groupTag){
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

GCalFaces_TimeViewMD.prototype = new GCalFaces_TimeView();

/**
 * Renderiza la estructura principal del timeview
 */
GCalFaces_TimeViewMD.prototype.drawStructure=function(){
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
	
	var html = '<div class="tvMD_one-month tvMD_new-row">' + 
			'<table class="tvMD" border="0" cellpadding="0" cellspacing="0"><thead>' + 
			'<tr class="tvMD_title-row">' + 
			'<td style="width: 5%">##</td>';
			
	var drawMonth = this.startDate.getMonth();
	var drawYear = this.startDate.getFullYear();
	for(var numMonth=0; numMonth<=numMonths; numMonth++){
		html += '<td style="width: ' + tdWidth + '%">';
		if (numMonth==0){
			html += '<a class="tvMD_goPrev" onclick="TimeViewManager.goPrev(\''+this.tvId+'\');">&laquo;</a> ';
		}
		html += monthNames[drawMonth]+(drawMonth==11?' '+drawYear:(drawMonth==0)?' '+drawYear:'');
		if (numMonth==numMonths){
			html += ' <a class="tvMD_goNext" onclick="TimeViewManager.goNext(\''+this.tvId+'\');">&raquo;</a>';
		} 
		html += '</td>';
		
		drawMonth++;
		if (drawMonth>11){
			drawMonth=0;
			drawYear++;
		}
	}
	
	printDate = new Date(this.startDate.getFullYear(), this.startDate.getMonth(), this.startDate.getDate());
	for (var row = 1; row <= 31; row++){
		printDate = new Date(this.startDate.getFullYear(), 
			this.startDate.getMonth(), 
			this.startDate.getDate()+row-1);
		
		html += '<tr class="tvMD_days-row">' +
				'<td class="tvMD_week-col"><div class="tvMD_cellfill">' + row + '</div></td>';
		
		drawMonth = this.startDate.getMonth();
		for(var numMonth=0; numMonth<=numMonths; numMonth++){
			var otherMonth = (row>DateUtils.getDaysInMonth(printDate.getFullYear(), drawMonth));
			var unselectable = otherMonth;
			var dow = printDate.getDay();
			var tdId = this.tvId+printDate.getFullYear()+''+(drawMonth+1)+''+row;
			
			html += '<td ' + (unselectable ? '' : 'id="' + tdId + '"') + ' class="tvMD_days-cell' +
					((dow + 7) % 7 >= 5 ? ' tvMD_week-end-cell' : '') + // highlight weekends
					(otherMonth ? ' tvMD_otherMonth' : '') + // highlight days from other months
					
					(unselectable ? ' tvMD_unselectable' : '') +  // highlight unselectable days
					(printDate.getTime() == today.getTime() ? ' tvMD_today' : '') + '"' + // highlight today (if different)
					
					(unselectable ? '' : ' onmouseover="jQuery(this).addClass(\'tvMD_days-cell-over\');"' +
					' onmouseout="jQuery(this).removeClass(\'tvMD_days-cell-over\');"') +
						
					'>' + // actions
					(otherMonth ? '&#xa0;' : // display for other months
						//(unselectable ? '' : '<a>' + printDate.getDate() + '</a>')) + '</td>'; // display for this month
						(unselectable ? '' : '<a onclick="GCalFaces.addForm(\''+
						printDate.getDate()+'/'+(printDate.getMonth()+1)+'/'+printDate.getFullYear()+'\');">' + 
						'</a>')) + '</td>'; // display for this month
					
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

	this.currentTime=$("#"+this.tvId+today.getFullYear()+""+today.getMonth()+""+today.getDate()).get(0);
	
	structure=document.createElement("div");
	structure.className = "tvMD_structure";
	structure.innerHTML=html;

	this.container.appendChild(structure);
	this.structureInit=true;
	
	return;
}

/**
 * Renderiza la lista inicial de eventos recibidos
 */
GCalFaces_TimeViewMD.prototype.drawEvents=function(){
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
GCalFaces_TimeViewMD.prototype.drawEvent=function(eventData){
	//Si el objeto gancho define el método lo usamos
	if (this.hookObject!=null && typeof this.hookObject.drawEvent=="function"){
		this.hookObject.drawEvent(this, eventData);
		return;
	}
	
	//No distinguimos si estan agrupados
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
GCalFaces_TimeViewMD.prototype.makeEventDOM=function(eventData){
	//Si el objeto gancho define el método lo usamos
	if (this.hookObject!=null && typeof this.hookObject.makeEventDOM=="function"){
		return this.hookObject.makeEventDOM(this, eventData);
	}
	
	var row;
	var rowheader;
	var rowbody;
	var timecell;

	row=document.createElement("div");
	row.className = "tvMD_event";
	row.setAttribute("id", this.tvId+eventData.id);
	row.onclick=function(){GCalFaces.editForm({id:eventData.id})};

	rowheader=document.createElement("div");
	rowheader.className = "tvMD_eventname";
	rowheader.appendChild(document.createTextNode(eventData.title));

	row.appendChild(rowheader);

	rowbody=document.createElement("div");
	rowbody.className = "tvMD_eventbody";
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
GCalFaces_TimeViewMD.prototype.makeEventGroupDOM=function(eventGroup){
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
GCalFaces_TimeViewMD.prototype.makeToolTip=function(eventData){
	//Si el objeto gancho define el método lo usamos
	if (this.hookObject!=null && typeof this.hookObject.makeToolTip=="function"){
		return this.hookObject.makeToolTip(this, eventData);
	}
	
	var bodyHandler= function(){
		var startDate=DateUtils.dateFromGCal(eventData.when[0].startDate);
		var printStartDate=startDate.getDate()+"/"+(startDate.getMonth()+1)+"/"+startDate.getFullYear();
		var endDate=DateUtils.dateFromGCal(eventData.when[0].endDate);
		var printEndDate=endDate.getDate()+"/"+(endDate.getMonth()+1)+"/"+endDate.getFullYear();
		
		return '<div class="tvMD_tooltip">'+
		  '<div class="tvMD_tooltip_name">'+eventData.title+'</div>'+
		  '<div class="tvMD_tooltip_startDate">'+printStartDate+'</div>'+
		  '<div class="tvMD_tooltip_endDate">'+printEndDate+'</div>'+
		  '<div class="tvMD_tooltip_where">'+(eventData.where.length>0?eventData.where[0]:'')+'</div>'+
		'</div>';
	}
	
	return bodyHandler;
}

/**
 * Actualiza la representacion del evento indicado en la estructura
 * 
 * @param Object eventData Objeto que representa un evento
 */
GCalFaces_TimeViewMD.prototype.drawUpdatedEvent=function(eventData){
	//Si el objeto gancho define el método lo usamos
	if (this.hookObject!=null && typeof this.hookObject.drawUpdatedEvent=="function"){
		this.hookObject.drawUpdatedEvent(this, eventData);
		return;
	}
	
	//No distinguimos si estan agrupados
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
GCalFaces_TimeViewMD.prototype.drawDeletedEvent=function(eventId){
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
GCalFaces_TimeViewMD.prototype.refreshDraw=function(){
	//Si el objeto gancho define el método lo usamos
	if (this.hookObject!=null && typeof this.hookObject.refreshDraw=="function"){
		this.hookObject.refreshDraw(this);
		return;
	}
	
	var now = new Date();
	$(this.currentTime).removeClass("tvMD_today");
	this.currentTime=$("#"+this.tvId+now.getFullYear()+""+(now.getMonth()+1)+""+now.getDate()).get(0);
	$(this.currentTime).addClass("tvMD_today");
}

/**
 * Avanza el intervalo de representacion un mes, semana o día, dependiendo del tipo de timeview
 */
GCalFaces_TimeViewMD.prototype.goNext=function(){
	this.startDate.setMonth(this.startDate.getMonth()+1);
	this.endDate.setMonth(this.endDate.getMonth()+1);
	this.init();
}

/**
 * Retrocede el intervalo de representacion un mes, semana o día, dependiendo del tipo de timeview
 */
GCalFaces_TimeViewMD.prototype.goPrev=function(){
	this.startDate.setMonth(this.startDate.getMonth()-1);
	this.endDate.setMonth(this.endDate.getMonth()-1);
	this.init();
}