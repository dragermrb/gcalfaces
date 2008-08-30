<?php

/**
 * Funciones para manipulacion de fechas en distintos formatos
 * 
 * @package GCalFaces
 */
class GCalFaces_DateUtils {
	
	const REG_DATE_GCAL='([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})';
	const REG_TIME_GCAL='([0-9]{1,2}):([0-9]{1,2})';
	const REG_TZOFFSET_GCAL='([\+\-]?[0-9]{1,2}:[0-9]{1,2})|Z';
	const REG_DATE_TIME_GCAL='([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})T([0-9]{1,2}):([0-9]{1,2}):00\.000([\+\-]?[0-9]{1,2}:[0-9]{1,2})|Z';
	const REG_DATE_ES='([0-9]{1,2})/([0-9]{1,2})/([0-9]{4})';
	const REG_TIME='([0-9]{1,2}):([0-9]{2})';
	
	/**
	 * Indica si una cadena cumple con el formato de fecha de GCalendar
	 *
	 * El formato de GCalendar es el siguiente: aaaa-mm-ddThh:mm:00.000+hh
	 * @param string $d Cadena para comprobar
	 * @return boolean Si la cadena cumple el formato de GCalendar
	 */
	public static function isGcalDate($d){
		if (ereg(self::REG_DATE_TIME_GCAL, $d, $regs)){
			return true;
		} elseif (ereg(self::REG_DATE_GCAL, $d, $regs)){
			return true;
		} else {
			return false;
		}
	}
	
	/**
	 * Indica si una cadena cumple con el formato de fecha de GCalendar y se compone por fecha y hora
	 *
	 * El formato de GCalendar es el siguiente: aaaa-mm-ddThh:mm:00.000+hh
	 * @param string $d Cadena para comprobar
	 * @return boolean Si la cadena cumple el formato de GCalendar con fecha y hora
	 */
	public static function isGcalDateTime($d){
		if (ereg(self::REG_DATE_TIME_GCAL, $d, $regs)){
			return true;
		} else {
			return false;
		}
	}
	
	/**
	 * Convierte un fecha en formato GCalendar a formato español
	 * 
	 * El formato de GCalendar es el siguiente: aaaa-mm-ddThh:mm:00.000+hh
	 *
	 * @param string $d Fecha en formato aaaa-mm-ddThh:mm:00.000
	 * @return string Fecha en formato dd/mm/aaaa
	 */
	public static function dateGcalToSpanish($d)
	{
		if (ereg(self::REG_DATE_TIME_GCAL, $d, $regs)){
			$dateES=sprintf("%02d/%02d/%4d",$regs[3],$regs[2],$regs[1]);
		}
		elseif (ereg(self::REG_DATE_GCAL, $d, $regs)){
			$dateES=sprintf("%02d/%02d/%4d",$regs[3],$regs[2],$regs[1]);
		}
		else {
			throw new Exception('Fecha no válida: '.$d);
		}

		return $dateES;
	}

	/**
	 * Convierte una fecha en formato GCalendar a hora
	 *
	 * @param string $d Fecha en formato aaaa-mm-ddThh:mm:00.000
	 * @return string Hora en formato hh:mm
	 */
	public static function dateGcalToTime($d)
	{
		if (ereg(self::REG_DATE_TIME_GCAL, $d, $regs)){
			$timeReturn=sprintf("%02d:%02d",$regs[4],$regs[5]);
		} else {
			throw new Exception('Fecha no válida: '.$d);
		}

		return $timeReturn;
	}

	/**
	 * Devuelve si una cadena es una hora
	 *
	 * @param string $t Hora en formato hh:mm
	 * @return boolean
	 */
	public static function isTime($t)
	{
		return ereg(self::REG_TIME, $t);
	}

	/**
	 * Devuelve si una cadena es una fecha en formato español
	 *
	 * @param string $d Fecha en formato dd/mm/aaaa
	 * @return boolean
	 */
	public static function isDate($d)
	{
		return ereg(self::REG_DATE_ES, $d);
	}
	
	/**
	 * Devuelve una fecha en formato GCal a partir de fecha y hora en formato español
	 *
	 * @param string $date Fecha en formato dd/mm/aaaa
	 * @param string $time Hora en formato hh:mm
	 * @return string La fecha en formato aaaa-mm-ddThh:mm:00.000
	 */
	public static function makeGCalDate($date, $time)
	{
		$gcalDate='';
		
		if (GCalFaces_DateUtils::isDate($date)){
			ereg(self::REG_DATE_ES, $date, $regs);
			$gcalDate=sprintf("%4d-%02d-%02d",$regs[3],$regs[2],$regs[1]);
		} else {
			throw new Exception('Fecha no válida: '.$date);
		}
		
		if ($time!=''){
			if (GCalFaces_DateUtils::isTime($time)){
				$gcalDate.='T'.$time.':00.000';
			} else {
				throw new Exception('Hora no válida: '.$time);
			}
		}
		
		return $gcalDate;
	}
}
?>