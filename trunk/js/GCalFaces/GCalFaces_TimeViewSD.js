/**
 * Clase TimeViewSD para la representacion de calendarios
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
function GCalFaces_TimeViewSD(startDate, endDate, container, hookObject, groupTag){
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
	
	//Obligamos a representar semanas completas
	this.startDate.setDate(this.startDate.getDate()-(this.startDate.getDay()==0?6:this.startDate.getDay()-1));
	this.endDate.setDate(this.endDate.getDate()+(6-(this.endDate.getDay()==0?6:this.endDate.getDay()-1)));
}

GCalFaces_TimeViewSD.prototype = new GCalFaces_TimeView();

/**
 * Renderiza la estructura principal del timeview
 */
GCalFaces_TimeViewSD.prototype.drawStructure=function(){
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
	
	var numWeeks=Math.floor(((this.endDate - this.startDate) / 86400000) / 7) + 1;
	var dayNames = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
	var tdWidth=(95/numWeeks).toFixed(2);
	
	var html = '';
	
	html += '<div class="tvSD_one-month tvSD_new-row">' + 
			'<table class="tvSD" border="0" cellpadding="0" cellspacing="0"><thead>' + 
			'<tr class="tvSD_title-row">' + 
			'<td style="width: 5%">##</td>';
	
	var week=DateUtils.iso8601Week(this.startDate);
	var drawYear = this.startDate.getFullYear();
	for(var numWeek=1; numWeek<=numWeeks; numWeek++){
		html += '<td style="width: ' + tdWidth + '%">';
		if (numWeek==1){
			html += '<a class="tvSD_goPrev" onclick="TimeViewManager.goPrev(\''+this.tvId+'\');">&laquo;</a> ';
		}
		html += 'Sem '+week+(week==52?', '+drawYear:(week==1)?', '+drawYear:'');
		if (numWeek==numWeeks){
			html += ' <a class="tvSD_goNext" onclick="TimeViewManager.goNext(\''+this.tvId+'\');">&raquo;</a>';
		} 
		html += '</td>';
		
		week++;
		if (week>52){
			week=1;
			drawYear++;
		}
	}
	
	for (var dow = 0; dow < 7; dow++) {
		html += '<tr class="tvSD_days-row">' +
				'<td class="tvSD_week-col"><div class="tvSD_cellfill">' + dayNames[(dow+1)%7] + '</div></td>';
				
		printDate = new Date(this.startDate.getFullYear(), this.startDate.getMonth(), this.startDate.getDate());
		printDate.setDate(printDate.getDate() + dow);
		
		var week=DateUtils.iso8601Week(this.startDate);
		for(var numWeek=1; numWeek<=numWeeks; numWeek++){
		//for (var week = firstWeek; week <= lastWeek; week++){
			var tdId = this.tvId+printDate.getFullYear()+""+(printDate.getMonth()+1)+""+printDate.getDate();
			html += '<td id="' + tdId +'" class="tvSD_days-cell' +
					((dow + 7) % 7 >= 5 ? ' tvSD_week-end-cell' : '') +
					(printDate.getTime() == today.getTime() ? ' tvSD_today' : '') + '"' +
					' onmouseover="jQuery(this).addClass(\'tvSD_days-cell-over\');"' +
					' onmouseout="jQuery(this).removeClass(\'tvSD_days-cell-over\');"' +
					+ '>';
			html += '<a onclick="GCalFaces.addForm(\''+
				printDate.getDate()+'/'+(printDate.getMonth()+1)+'/'+printDate.getFullYear()+'\');">' + 
				printDate.getDate()+'</a></td>';
			printDate.setDate(printDate.getDate() + 7);
			
			week++;
			if (week>52){
				week=1;
			}
		}
		html += '</tr>';
	}
	html += '</tbody></table></div>';			
	html += '<div style="clear: both;"></div>';


	this.currentTime=$("#"+today.getFullYear()+""+today.getMonth()+""+today.getDate()).get(0);
	
	structure=document.createElement("div");
	structure.className= "tvSD_structure";
	structure.innerHTML=html;

	this.container.appendChild(structure);
	this.structureInit=true;
	
	return;
}

/**
 * Renderiza la lista inicial de eventos recibidos
 */
GCalFaces_TimeViewSD.prototype.drawEvents=function(){
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
GCalFaces_TimeViewSD.prototype.drawEvent=function(eventData){
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
GCalFaces_TimeViewSD.prototype.makeEventDOM=function(eventData){
	//Si el objeto gancho define el método lo usamos
	if (this.hookObject!=null && typeof this.hookObject.makeEventDOM=="function"){
		return this.hookObject.makeEventDOM(this, eventData);
	}
	
	var row;
	var rowheader;
	var rowbody;
	var timecell;

	row=document.createElement("div");
	row.className= "tvSD_event";
	row.setAttribute("id", this.tvId+eventData.id);
	row.onclick=function(){GCalFaces.editForm({id:eventData.id})};

	rowheader=document.createElement("div");
	rowheader.className= "tvSD_eventname";
	rowheader.appendChild(document.createTextNode(eventData.title));

	row.appendChild(rowheader);

	rowbody=document.createElement("div");
	rowbody.className= "tvSD_eventbody";
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
GCalFaces_TimeViewSD.prototype.makeEventGroupDOM=function(eventGroup){
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
GCalFaces_TimeViewSD.prototype.makeToolTip=function(eventData){
	//Si el objeto gancho define el método lo usamos
	if (this.hookObject!=null && typeof this.hookObject.makeToolTip=="function"){
		return this.hookObject.makeToolTip(this, eventData);
	}
	
	var bodyHandler= function(){
		var startDate=DateUtils.dateFromGCal(eventData.when[0].startDate);
		var printStartDate=startDate.getDate()+"/"+(startDate.getMonth()+1)+"/"+startDate.getFullYear();
		var endDate=DateUtils.dateFromGCal(eventData.when[0].endDate);
		var printEndDate=endDate.getDate()+"/"+(endDate.getMonth()+1)+"/"+endDate.getFullYear();
		
		return '<div class="tvSD_tooltip">'+
		  '<div class="tvSD_tooltip_name">'+eventData.title+'</div>'+
		  '<div class="tvSD_tooltip_startDate">'+printStartDate+'</div>'+
		  '<div class="tvSD_tooltip_endDate">'+printEndDate+'</div>'+
		  '<div class="tvSD_tooltip_where">'+(eventData.where.length>0?eventData.where[0]:'')+'</div>'+
		'</div>';
	}
	
	return bodyHandler;
}

/**
 * Actualiza la representacion del evento indicado en la estructura
 * 
 * @param Object eventData Objeto que representa un evento
 */
GCalFaces_TimeViewSD.prototype.drawUpdatedEvent=function(eventData){
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
GCalFaces_TimeViewSD.prototype.drawDeletedEvent=function(eventId){
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
GCalFaces_TimeViewSD.prototype.refreshDraw=function(){
	//Si el objeto gancho define el método lo usamos
	if (this.hookObject!=null && typeof this.hookObject.refreshDraw=="function"){
		this.hookObject.refreshDraw(this);
		return;
	}
	
	var now = new Date();
	$(this.currentTime).removeClass("tvSD_today");
	this.currentTime=$("#"+this.tvId+now.getFullYear()+""+(now.getMonth()+1)+""+now.getDate()).get(0);
	$(this.currentTime).addClass("tvSD_today");
}

/**
 * Avanza el intervalo de representacion un mes, semana o día, dependiendo del tipo de timeview
 */
GCalFaces_TimeViewSD.prototype.goNext=function(){
	this.startDate.setDate(this.startDate.getDate()+7);
	this.endDate.setDate(this.endDate.getDate()+7);
	this.init();	
}

/**
 * Retrocede el intervalo de representacion un mes, semana o día, dependiendo del tipo de timeview
 */
GCalFaces_TimeViewSD.prototype.goPrev=function(){
	this.startDate.setDate(this.startDate.getDate()-7);
	this.endDate.setDate(this.endDate.getDate()-7);
	this.init();
}