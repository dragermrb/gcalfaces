/**
 * Funciones para manipulacion de fechas en distintos formatos
 * 
 * @package GCalFaces
 */

/**
 * Constructor de la clase DateUtils
 */
function DateUtils(){}


/**
 * Indica si una cadena cumple con el formato de fecha (y solo fecha) de GCalendar
 *
 * El formato de GCalendar es el siguiente: aaaa-mm-dd
 * @param string dateString Cadena para comprobar
 * @return boolean Si la cadena cumple el formato de GCalendar para fechas
 */
DateUtils.isGCalDate=function(dateString){
	var regDate = new RegExp("^([0-9]{4})-([0-9]{2})-([0-9]{2})$");
	
	if (dateString.search(regDate)!= -1){
  		//Es solo fecha
  		return true;
  	} else {
  		//Es fechaHora o no reconocido
  		return false;
  	}
}

/**
 * Indica si una cadena cumple con el formato de fecha o fechaHora de GCalendar
 *
 * El formato de GCalendar es el siguiente: aaaa-mm-ddThh:mm:00.000+hh
 * @param string dateString Cadena para comprobar
 * @return boolean Si la cadena cumple el formato de GCalendar
 */
DateUtils.isGCalDateTime=function(dateString){
	var regDate = new RegExp("([0-9]{4})-([0-9]{2})-([0-9]{2})");
	var regTime = new RegExp("([0-9]{2}):([0-9]{2})");
	var regTimezone = new RegExp("([\+\-]?[0-9]{2}:[0-9]{2})|Z");
	var regDateTime = new RegExp("^"+regDate+"T"+regTime+":00\.000"+regTimezone+"$");	
	
  	if (dateString.search(regDateTime)!= -1){
  		//Es fechaHora
  		return true;
  	
  	} else if (dateString.search(regDate)!= -1){
  		//Es solo fecha
  		return true;
  	
  	} else {
  		//No reconocido
  		return false;
  	}
}

/**
 * Convierte una fecha de formato GCal a nativo
 *  El formato de GCalendar es el siguiente: aaaa-mm-ddThh:mm:00.000+hh
 * 
 * @param string dateString Cadena para comvertir
 * @return date Fecha en formato nativo Javascript
 */
DateUtils.dateFromGCal=function(dateString){
	if (!dateString) return false;
		
	var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" +
        "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" +
        "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
    var d = dateString.match(new RegExp(regexp));

    var date = new Date(d[1], 0, 1);

    if (d[3]) { date.setMonth(d[3] - 1); }
    if (d[5]) { date.setDate(d[5]); }
    if (d[7]) { date.setHours(d[7]); }
    if (d[8]) { date.setMinutes(d[8]); }
    if (d[10]) { date.setSeconds(d[10]); }
    
    return date;
}

/**
 * Convierte una fecha (y solo fecha) de formato nativo a GCal
 * 
 * @param date dateObject El objeto fecha a convertir
 * @return string Fecha en formato aaaa-mm-dd
 */
DateUtils.dateToGCal=function(dateObject){
	var dateString=$.datepicker.formatDate('yy-mm-dd', dateObject);
	
	return dateString;
}

/**
 * Convierte una fecha de formato nativo a GCal con hora
 * 
 * @param date dateObject El objeto fecha a convertir
 * @return string Fecha en formato aaaa-mm-ddThh:mm:00.000
 */
DateUtils.dateTimeToGCal=function(dateObject){
	var hours=dateObject.getHours();
	var minutes=dateObject.getMinutes();
	var seconds=dateObject.getSeconds();
	var dateString=$.datepicker.formatDate('yy-mm-dd', dateObject);
	
	if (hours<10) hours='0'+hours;
	if (minutes<10) minutes='0'+minutes;
	if (seconds<10) seconds='0'+seconds;
	
	dateString=dateString+"T"+hours+":"+minutes+":"+seconds+".000";
	
	return dateString;
}

/**
 * Devuelve el número de semana de una fecha de acuerdo al estandar ISO8601
 * 
 * @param date date Fecha en formato nativo Javascript
 * @return int Numero de semana dentro del año
 */
DateUtils.iso8601Week=function(date) {
	var checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), (date.getTimezoneOffset() / -60));
	var firstMon = new Date(checkDate.getFullYear(), 1 - 1, 4); // First week always contains 4 Jan
	var firstDay = firstMon.getDay() || 7; // Day of week: Mon = 1, ..., Sun = 7
	firstMon.setDate(firstMon.getDate() + 1 - firstDay); // Preceding Monday
	if (firstDay < 4 && checkDate < firstMon) { // Adjust first three days in year if necessary
		checkDate.setDate(checkDate.getDate() - 3); // Generate for previous year
		return DateUtils.iso8601Week(checkDate);
	} else if (checkDate > new Date(checkDate.getFullYear(), 12 - 1, 28)) { // Check last three days in year
		firstDay = new Date(checkDate.getFullYear() + 1, 1 - 1, 4).getDay() || 7;
		if (firstDay > 4 && (checkDate.getDay() || 7) < firstDay - 3) { // Adjust if necessary
			checkDate.setDate(checkDate.getDate() + 3); // Generate for next year
			return DateUtils.iso8601Week(checkDate);
		}
	}
	return Math.floor(((checkDate - firstMon) / 86400000) / 7) + 1; // Weeks to given date
}

/**
 * Devuelve el número de dias que tiene el mes especificado
 * 
 * @param int year Año del mes a comprobar
 * @param int month Mes a comprobar
 * @return int Número de dias del mes para el año indicado
 */
DateUtils.getDaysInMonth=function(year, month) {
		return 32 - new Date(year, month, 32).getDate();
}


/**
 * Devuelve la fecha del primer día del mes y año indicados en formato nativo Javscritp
 * 
 * @param int year Año para calcular la fecha
 * @param int month Mes para calcular la fecha
 * @return date Fecha del primer día del mes en formato nativo
 */
DateUtils.getFirstDayOfMonth=function(year, month) {
		return new Date(year, month, 1).getDay();
}
