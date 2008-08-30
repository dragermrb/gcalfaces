<?php
/**
 * Control de las variables almacenadas en sesion para su uso con GCalFaces
 *
 * @package GCalFaces
 */
class GCalFaces_SessionControl
{
	/**
	 * Alamcena en la sesión la lista de calendarios disponibles
	 *
	 * @param Zend_Gdata_Calendar_ListFeed $listFeed
	 */
	public static function setCalendarList($listFeed)
	{
		if ($listFeed==null){
			unset ($_SESSION['calendarList']);
		} else {
			$_SESSION['calendarList']=$listFeed;
		}
	}
	
	/**
	 * Devuelve la lista de calendarios del usuario
	 *
	 * @return Zend_Gdata_Calendar_ListFeed La lista de calendarios o null si no existe
	 */
	public static function getCalendarList()
	{
		if (isset($_SESSION['calendarList'])){
			return $_SESSION['calendarList'];
		} else {
			return null;
		}
	}
	
	/**
	 * Almacena en la sesion el feed indicado
	 *
	 * @param string $feed La url del feed
	 */
	public static function setFeed($feed)
	{
		self::setFeedURL($feed);
		self::setFeedUser($feed);
	}
	
	/**
	 * Devuelve el calendario del usuario almacenado en sesion
	 *
	 * @return Zend_Gdata_Calendar_ListEntry El calendario almacenado en sesion o null si no existe
	 */
	public static function getFeed($feedId=null)
	{
		if ($feedId==null){
			$feedId=self::getFeedURL();
		}
		
		$patterns=array('@','#');
		$replacements=array('%40','%23');
		$feedId=str_replace($patterns, $replacements, $feedId);
		
		if (isset($_SESSION['calendarList']) && count($_SESSION['calendarList'])>0){
			foreach ($_SESSION['calendarList'] as $feed){
				$links=$feed->link;
				if ($links){
					foreach ($links as $link){
						if ($link->href==$feedId){
							return $feed;
						}
					}
				}
			}
		}
		
		return null;
	}

	/**
	 * Almacena en la sesion el usuario indicado en la url del feed
	 *
	 * @param string $feed La url del feed
	 */
	public static function setFeedUser($feed)
	{
		global $_SESSION;

		if ($feed==''){
			$feedUser='default';
		} else {
			$tokens = split( "/", $feed);
			$feedUser=$tokens[count($tokens)-1];
		}

		$_SESSION['feedUser']=$feedUser;
	}
	
	/**
	 * Devuelve el usuario almacenado en la sesion 
	 *
	 * @return string Usuario almacenado en la sesion
	 */
	public static function getFeedUser()
	{
		global $_SESSION;

		if (isset($_SESSION['feedUser'])){
			return $_SESSION['feedUser'];
		} else {
			return 'default';
		}
	}
	
	/**
	 * Almacena en la sesion la url del feed formateado para su uso en
	 * las consultas a GCalendar
	 *
	 * @param string $feed La url del feed
	 */
	public static function setFeedURL($feed)
	{
		global $_SESSION;

		if ($feed==''){
			$feedURL='';
		} else {
			$feedURL=str_replace("/default/","/",$feed).'/private/full';
		}

		$_SESSION['feedURL']=$feedURL;
	}
	
	/**
	 * Devuelve la url del feed almacenado en la sesion 
	 *
	 * @return string Url del feed almacenado en la sesion
	 */
	public static function getFeedURL()
	{
		global $_SESSION;

		if (isset($_SESSION['feedURL'])){
			return $_SESSION['feedURL'];
		} else {
			return '';
		}
	}

	/**
	 * Almacena en la sesion el nombre del tema a utilizar
	 *
	 * @param string $theme Nombre del tema
	 */
	public static function setTheme($theme)
	{
		global $_SESSION;

		if ($theme==''){
			$theme='default';
		}

		$_SESSION['theme']=$theme;
	}
	
	/**
	 * Devuelve el nombre del tema almacenado en la sesion 
	 *
	 * @return string Nombre del tema almacenado en la sesion
	 */
	public static function getTheme()
	{
		global $_SESSION;

		if (isset($_SESSION['theme'])){
			return $_SESSION['theme'];
		}
		else {
			return 'default';
		}
	}
	
}
?>