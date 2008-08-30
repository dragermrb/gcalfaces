//Constructor
function hookClass1(){

}

hookClass1.prototype.makeToolTip=function(timeview, eventData){

	var bodyHandler= function(){
		var startDate=DateUtils.dateFromGCal(eventData.when[0].startDate);
		var printStartDate=startDate.getDate()+"/"+(startDate.getMonth()+1)+"/"+startDate.getFullYear();
		var endDate=DateUtils.dateFromGCal(eventData.when[0].endDate);
		var printEndDate=endDate.getDate()+"/"+(endDate.getMonth()+1)+"/"+endDate.getFullYear();
		
		return '<div class="tvDM_tooltip">'+
		  '<div class="tvDM_tooltip_name"><h1>'+eventData.title+'</h1></div>'+
		  '<div class="tvDM_tooltip_startDate"><h2>'+printStartDate+'</h2></div>'+
		  '<div class="tvDM_tooltip_endDate"><h2>'+printEndDate+'</h2></div>'+
		  '<div class="tvDM_tooltip_where"><h3>'+eventData.where[0]+'</h3></div>'+
		'</div>';
	}
	
	return bodyHandler;
}
