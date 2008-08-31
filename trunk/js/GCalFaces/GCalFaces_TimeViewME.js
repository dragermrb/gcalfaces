/**
 * Clase TimeViewME para la representacion de calendarios
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
function GCalFaces_TimeViewME(startDate, endDate, container, hookObject, groupTag){
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
}

GCalFaces_TimeViewME.prototype = new GCalFaces_TimeView();

/**
 * Renderiza la estructura principal del timeview
 */
GCalFaces_TimeViewME.prototype.drawStructure=function(){
	//Si el objeto gancho define el método lo usamos
	if (this.hookObject!=null && typeof this.hookObject.drawStructure=="function"){
		this.hookObject.drawStructure(this);
		return;
	}
	
	this.container.innerHTML = "";
 
	//Dibujar la estructura
	var structure;
	var colheaders;

	//TODO: Añadir internacionalizacion 
	var monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
	
	this.container.innerHTML = "";
	  
	structure=document.createElement("div");
	structure.className = "tvME_structure";
	  
	//Cabeceras
	colheaders=document.createElement("div");
	colheaders.className = "tvME_colheaders";
	  
	var colheader;
	colheader=document.createElement("div");
	colheader.className = "tvME_colheader";
	colheader.appendChild(document.createTextNode("Eventos"));
	colheaders.appendChild(colheader);
	  
	var colbody;
	colbody=document.createElement("div");
	colbody.className = "tvME_colbody";
	
	var ch_item;
	
	var numMonths=(this.endDate.getFullYear()-this.startDate.getFullYear())*12+this.endDate.getMonth()-this.startDate.getMonth();
	var ch_item_size=100/(numMonths+1);
	var i=this.startDate.getMonth();
	for(var numMonth=0; numMonth<=numMonths; numMonth++){
		ch_item=document.createElement("div");
		ch_item.className = "tvME_ch_item";
		if (numMonth!=numMonths){
			ch_item.style.cssText = "width: "+ch_item_size.toFixed(2)+"%";
		} else {
			ch_item.style.cssText = "width: "+(ch_item_size.toFixed(2)-0.03)+"%";
		}
		
		if (numMonth==0){
			var pointerId=this.tvId;
			var goPrevNode=document.createElement("a");
			goPrevNode.innerHTML='&laquo;';
			
			$(goPrevNode).click(function(){
				TimeViewManager.goPrev(pointerId);
			});
			ch_item.appendChild(goPrevNode);
		}
		
		ch_item.appendChild(document.createTextNode(monthNames[i]));
		
		if (numMonth==numMonths){
			var pointerId=this.tvId;
			var goNextNode=document.createElement("a");
			goNextNode.innerHTML='&raquo;';
			$(goNextNode).click(function(){
				TimeViewManager.goNext(pointerId);
			});
			ch_item.appendChild(goNextNode);
		}
		
		
		colbody.appendChild(ch_item);
		
		i++;
		if (i>11){
			i=0;
		}
	}
	
	colheaders.appendChild(colbody);
	var divClear=document.createElement("div");
	divClear.className = "clear";
	colheaders.appendChild(divClear);
	  
	//Lista de eventos
	this.rowsContainer=document.createElement("div");
	this.rowsContainer.className = "tvME_rows";
	//A�adir el contenido de espera
	this.rowsContainer.appendChild(document.createTextNode("Cargando eventos..."));
	
	structure.appendChild(colheaders);
	structure.appendChild(this.rowsContainer);
	this.container.appendChild(structure);
	
	this.structureInit=true;
	this.refreshDraw();
}

/**
 * Renderiza la lista inicial de eventos recibidos
 */
GCalFaces_TimeViewME.prototype.drawEvents=function(){
	//Si el objeto gancho define el método lo usamos
	if (this.hookObject!=null && typeof this.hookObject.drawEvents=="function"){
		this.hookObject.drawEvents(this);
		return;
	}
	
	if (this.structureInit){
		//Estructura lista, comenzar a dibujar
		this.rowsContainer.innerHTML="";
		for(var i=0; i<this.eventList.length; i++){
			for(var j=0; j<this.eventList[i].events.length; j++){
				this.drawEvent(this.eventList[i].events[j]);
			}
		}
	} else {
		//Estructura aun no dibujada, esperar...
		alert("ERROR: Los eventos llegaron antes de montar la estructura");
	}
}

/**
 * Renderiza el evento indicado en la estructura
 * 
 * @param Object eventData Objeto que representa un evento
 */
GCalFaces_TimeViewME.prototype.drawEvent=function(eventData){
	//Si el objeto gancho define el método lo usamos
	if (this.hookObject!=null && typeof this.hookObject.drawEvent=="function"){
		this.hookObject.drawEvent(this, eventData);
		return;
	}
	
	if (this.groupTag==null){
		var row=this.makeEventDOM(eventData);
    	this.rowsContainer.appendChild(row);
	} else {
		var result=this.searchEventData(eventData.id);
		if (result.exist){
			eventGroup=this.eventList[result.groupIndex];

			//Eventos agrupados por tag
			if (eventGroup.tagName!=null){
				//Grupo normal
				var groupId=eventGroup.tagValue.replace(/ /g,'_').replace(/'/g,'_').replace(/"/g,'_');
				var row=$("#"+this.tvId+groupId);
				if (row.length>0){
					var rowUpdated=this.makeEventGroupDOM(eventGroup);
					row.replaceWith(rowUpdated);
				} else {
					var newRow=this.makeEventGroupDOM(eventGroup);
					this.rowsContainer.appendChild(newRow);
				}
			} else {
				//Grupo con los eventos sin etiqueta reconocida
				var row=this.makeEventDOM(eventData);
    			this.rowsContainer.appendChild(row);
			}
		} else {
			alert("No existe...?: ");
		}
	}
}

/**
 * Crea el nodo HTML del evento para renderizarlo
 * 
 * @param Object eventData Objeto que representa un evento
 */
GCalFaces_TimeViewME.prototype.makeEventDOM=function(eventData){
	//Si el objeto gancho define el método lo usamos
	if (this.hookObject!=null && typeof this.hookObject.makeEventDOM=="function"){
		return this.hookObject.makeEventDOM(this, eventData);
	}
	
	var row;
	var rowheader;
	var rowbody;
	var timecell;

	var divClear=document.createElement("div");
	divClear.className = "clear";

	row=document.createElement("div");
	row.className = "tvME_row";

	rowheader=document.createElement("div");
	rowheader.className = "tvME_rowheader";
	rowheader.appendChild(document.createTextNode(eventData.title));
	$(rowheader).click(function(){
		GCalFaces.editForm({id: eventData.id, tagName: null, tagValue: null});
	});

	row.appendChild(rowheader);

	rowbody=document.createElement("div");
	rowbody.className = "tvME_rowbody";
  
	var firstDay=this.startDate;  
	var lastDay=this.endDate;
  
	for (var i=0; i<eventData.when.length; i++){
		var startDate=DateUtils.dateFromGCal(eventData.when[i].startDate);
	    var endDate=DateUtils.dateFromGCal(eventData.when[i].endDate);
	    
	    if (DateUtils.isGCalDate(eventData.when[i].endDate)){
	    	//Establecer al final de dia
	    	
	    	// En eventos de un dia completo, GCalendar devuelve la endDate
	    	// como el dia siguiente si indicar la hora. Por tanto, hay
	    	// que restar un segundo
	    	endDate-=1000;
	    }
	    
	    var posInit=(startDate-firstDay)/(lastDay-firstDay)*100;
	    var size=(endDate-startDate)/(lastDay-firstDay)*100;
	    
		//alert("s,f: "+startDate+", "+firstDay);
	    //alert("(s-f)/(l-f): "+(startDate-firstDay)+"/"+(lastDay-firstDay));
	    //alert("Pos, Size: "+posInit+", "+size);
	    
	    var timecell=document.createElement("div");
	    timecell.setAttribute("id",this.tvId+eventData.id);
	    var html_timecell='<div class="tvME_timecell"'+
	    	' style="position: relative; left: '+posInit.toFixed(2)+'%; width:'+size.toFixed(2)+'%"'+
	    	' onclick="GCalFaces.editForm({id: \''+eventData.id+'\'});"></div>'  ;
		timecell.innerHTML=html_timecell;

		$(timecell).tooltip({ 
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
	
		rowbody.appendChild(timecell);
	}
  
	row.appendChild(rowbody);
	row.appendChild(divClear);
	
	return row;
}

/**
 * Crea el nodo HTML del grupo de eventos para Renderizarlo
 * 
 * @param Object eventData Objeto que representa un evento
 */
GCalFaces_TimeViewME.prototype.makeEventGroupDOM=function(eventGroup){
	//Si el objeto gancho define el método lo usamos
	if (this.hookObject!=null && typeof this.hookObject.makeEventGroupDOM=="function"){
		this.hookObject.makeEventGroupDOM(this, eventGroup);
		return;
	}
	
	var row;
	var rowheader;
	var rowbody;
	var timecell;

	var divClear=document.createElement("div");
	divClear.className = "clear";

	row=document.createElement("div");
	row.className = "tvME_row";
	var groupId=eventGroup.tagValue.replace(/ /g,'_').replace(/'/g,'_').replace(/"/g,'_');
	row.setAttribute("id", this.tvId+groupId);

	rowheader=document.createElement("div");
	rowheader.className = "tvME_rowheader";
	rowheader.appendChild(document.createTextNode(eventGroup.tagValue));
	$(rowheader).click(function(){
		GCalFaces.editForm({
			id: eventData.id, 
			tagName: eventGroup.tagName, 
			tagValue: eventGroup.tagValue});
	});

	row.appendChild(rowheader);

	rowbody=document.createElement("div");
	rowbody.className = "tvME_rowbody";
  
	var firstDay=this.startDate;  
	var lastDay=this.endDate;
	var sizeAcum=0;
  
  	for (var j=0; j<eventGroup.events.length; j++){
  		var eventData=eventGroup.events[j];
		for (var i=0; i<eventData.when.length; i++){
			var startDate=DateUtils.dateFromGCal(eventData.when[i].startDate);
		    var endDate=DateUtils.dateFromGCal(eventData.when[i].endDate);
		    
		    if (DateUtils.isGCalDate(eventData.when[i].endDate)){
		    	//Establecer al final de dia
		    	
		    	// En eventos de un dia completo, GCalendar devuelve la endDate
		    	// como el dia siguiente si indicar la hora. Por tanto, hay
		    	// que restar un segundo
		    	endDate-=1000;
		    }
		    
		    var posInit=(startDate-firstDay)/(lastDay-firstDay)*100-sizeAcum;
		    var size=(endDate-startDate)/(lastDay-firstDay)*100;
		    sizeAcum+=size;
		    
			var timecell=document.createElement("div");
	    	timecell.setAttribute("id",this.tvId+eventData.id);
	    	var html_timecell='<div class="tvME_timecell"'+
	    		' style="position: relative; left: '+posInit.toFixed(2)+'%; width:'+size.toFixed(2)+'%"'+
				' onclick="GCalFaces.editForm({id: \''+eventData.id+'\'});"></div>'  ;
			timecell.innerHTML=html_timecell;
			$(timecell).tooltip({ 
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
			
			
		
			rowbody.appendChild(timecell);
		}
  	}
  
	row.appendChild(rowbody);
	row.appendChild(divClear);
  
	return row;
}

/**
 * Crea una funcion que devuelve el cuerto del tooltip de cada evento
 * 
 * @param Object eventData Objeto que representa un evento
 * @return Function Funcion que crea el cuerpo del tooltip
 */
GCalFaces_TimeViewME.prototype.makeToolTip=function(eventData){
	//Si el objeto gancho define el método lo usamos
	if (this.hookObject!=null && typeof this.hookObject.makeToolTip=="function"){
		return this.hookObject.makeToolTip(this, eventData);
	}
	
	var bodyHandler= function(){
		var startDate=DateUtils.dateFromGCal(eventData.when[0].startDate);
		var printStartDate=startDate.getDate()+"/"+(startDate.getMonth()+1)+"/"+startDate.getFullYear();
		var endDate=DateUtils.dateFromGCal(eventData.when[0].endDate);
		var printEndDate=endDate.getDate()+"/"+(endDate.getMonth()+1)+"/"+endDate.getFullYear();
		
		return '<div class="tvME_tooltip">'+
		  '<div class="tvME_tooltip_name">'+eventData.title+'</div>'+
		  '<div class="tvME_tooltip_startDate">'+printStartDate+'</div>'+
		  '<div class="tvME_tooltip_endDate">'+printEndDate+'</div>'+
		  '<div class="tvME_tooltip_where">'+(eventData.where.length>0?eventData.where[0]:'')+'</div>'+
		'</div>';
	}
	
	return bodyHandler;
}

/**
 * Actualiza la representacion del evento indicado en la estructura
 * 
 * @param Object eventData Objeto que representa un evento
 */
GCalFaces_TimeViewME.prototype.drawUpdatedEvent=function(eventData){ 
	//Si el objeto gancho define el método lo usamos
	if (this.hookObject!=null && typeof this.hookObject.drawUpdatedEvent=="function"){
		this.hookObject.drawUpdatedEvent(this, eventData);
		return;
	}
	
	if (this.groupTag==null){
		var row=$("#"+this.tvId+eventData.id).parent().parent();
		var rowUpdated=this.makeEventDOM(eventData);
		
		row.replaceWith(rowUpdated);
	} else {
		//Eventos agrupados por tag

		//Buscar el grupo
		var result=this.searchEventData(eventData.id);
		if (result.exist){
			eventGroup=this.eventList[result.groupIndex];

			if (eventGroup.tagName!=null){
				//Grupo normal
				var groupId=eventGroup.tagValue.replace(/ /g,'_').replace(/'/g,'_').replace(/"/g,'_');
				var row=$("#"+this.tvId+groupId);
				//Encontrado
				var rowUpdated=this.makeEventGroupDOM(eventGroup);
				row.replaceWith(rowUpdated);
			} else {
				//Grupo con los eventos sin etiqueta reconocida
				var row=$("#"+this.tvId+eventData.id).parent().parent();
				var rowUpdated=this.makeEventDOM(eventData);
				row.replaceWith(rowUpdated);
			}
		} else {
			alert("No existe, no deberiamos estar aqui");
		}
	}
}

/**
 * Elimina un evento de la representacion
 * 
 * @param String eventId Identificador del evento a eliminar
 */
GCalFaces_TimeViewME.prototype.drawDeletedEvent=function(eventId){
	//Si el objeto gancho define el método lo usamos
	if (this.hookObject!=null && typeof this.hookObject.drawDeletedEvent=="function"){
		this.hookObject.drawDeletedEvent(this, eventId);
		return;
	}
	
	if (this.groupTag==null){
		var row=$("#"+this.tvId+eventId).parent().parent();
		row.remove();
	} else {
		//Eventos agrupados por tag
		
		//Buscar el grupo
		var result=this.searchEventData(eventId);
		if (result.exist){
			if (this.eventList[result.groupIndex].tagName==null){
				//Evento sin etiqueta de grupo
				var row=$("#"+this.tvId+eventId).parent().parent();
				row.remove();
			}
			else if (this.eventList[result.groupIndex].events.length>1){
				//Quedan mas eventos en el grupo, eliminar evento
				var timecell=$("#"+this.tvId+eventId);
				
				timecell.remove();
				
			} else {
				//Era el ultimo del grupo, eliminar grupo completo
				var row=$("#"+this.tvId+eventId).parent().parent();

				row.remove();
			}
		}/* else {
			//No existe porque esta fuera del intervalo temporal
			alert("No existe, no deberiamos estar aqui");
		}*/
	}
}

/**
 * Actualiza la representacion de acuerdo al momento actual
 */
GCalFaces_TimeViewME.prototype.refreshDraw=function(){
	//Si el objeto gancho define el método lo usamos
	if (this.hookObject!=null && typeof this.hookObject.refreshDraw=="function"){
		this.hookObject.refreshDraw(this);
		return;
	}
	
	if(this.currentTime==null){
		this.currentTime=document.createElement("div");
		this.currentTime.className = "tvME_currentTime";
		$(this.container.firstChild.firstChild).before(this.currentTime);	
		
		var now = new Date();
		var widthHeader=$('.tvME_colheader').outerWidth();
		var widthCurrentTime=$('.tvME_currentTime').outerWidth();
		var widthTotal=$('.tvME_colheaders').outerWidth();
		var offset=(widthHeader/widthTotal)*100 - (widthCurrentTime/widthTotal)*50;
		var posInit=((now-this.startDate)/(this.endDate-this.startDate)*(100-offset))+offset;
		
		this.currentTime.style.cssText = "position: absolute; left: "+posInit.toFixed(2)+"%;";
		
	}
	else {
		var now = new Date();
		var widthHeader=$('.tvME_colheader').outerWidth();
		var widthCurrentTime=$('.tvME_currentTime').outerWidth();
		var widthTotal=$('.tvME_colheaders').outerWidth();
		var offset=(widthHeader/widthTotal)*100 - (widthCurrentTime/widthTotal)*50;
		var posInit=((now-this.startDate)/(this.endDate-this.startDate)*(100-offset))+offset;

		if(posInit){
			this.currentTime.style.cssText = "position: absolute; left: "+posInit.toFixed(2)+"%;" ;
		}
	}
}

/**
 * Avanza el intervalo de representacion un mes, semana o día, dependiendo del tipo de timeview
 */
GCalFaces_TimeViewME.prototype.goNext=function(){
	this.startDate.setMonth(this.startDate.getMonth()+1);
	this.endDate.setMonth(this.endDate.getMonth()+1);
	this.init();	
}

/**
 * Retrocede el intervalo de representacion un mes, semana o día, dependiendo del tipo de timeview
 */
GCalFaces_TimeViewME.prototype.goPrev=function(){
	this.startDate.setMonth(this.startDate.getMonth()-1);
	this.endDate.setMonth(this.endDate.getMonth()-1);
	this.init();
}
