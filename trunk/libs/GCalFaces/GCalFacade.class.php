<?php
require_once('GCalFaces/DateUtils.class.php');
/**
 * Fachada para la comunicacion con GCalendar. Implementa además el patrón singleton
 *
 * @package GCalFaces
 */
class GCalFaces_GCalFacade
{
	/**
	 * Instancia de la clase
	 *
	 * @var GCalFaces_GCalFacade
	 */
	private static $instance;

	/**
	 * Constructor privado de la clase para implementar la clase como singleton
	 *
	 */
	private function __construct()
	{
	}

	/**
	 * Devuelve la instancia única de la clase
	 *
	 * @return GCalFaces_GCalFacade
	 */
	public static function singleton()
	{
		if (!isset(self::$instance)) {
			$c = __CLASS__;
			self::$instance = new $c;
		}

		return self::$instance;
	}

	/**
	 * Método de clonacion. Inhabilidado por la implementacion del patrón singleton
	 *
	 */
	public function __clone()
	{
		trigger_error('Clone is not allowed.', E_USER_ERROR);
	}
	
	/**
	 * Returns the full URL of the current page, based upon env variables
	 *
	 * Env variables used:
	 * $_SERVER['HTTPS'] = (on|off|)
	 * $_SERVER['HTTP_HOST'] = value of the Host: header
	 * $_SERVER['SERVER_PORT'] = port number (only used if not http/80,https/443
	 * $_SERVER['REQUEST_URI'] = the URI after the method of the HTTP request
	 *
	 * @return string Current URL
	 */
	public function getCurrentUrl()
	{
		global $_SERVER;

		/**
		 * Filter php_self to avoid a security vulnerability.
		 */
		$php_request_uri = htmlentities(substr($_SERVER['REQUEST_URI'], 0, strcspn($_SERVER['REQUEST_URI'], "\n\r")), ENT_QUOTES);

		if (isset($_SERVER['HTTPS']) && strtolower($_SERVER['HTTPS']) == 'on') {
			$protocol = 'https://';
		} else {
			$protocol = 'http://';
		}
		$host = $_SERVER['HTTP_HOST'];
		if ($_SERVER['SERVER_PORT'] != '' &&
		(($protocol == 'http://' && $_SERVER['SERVER_PORT'] != '80') ||
		($protocol == 'https://' && $_SERVER['SERVER_PORT'] != '443'))) {
			$port = ':' . $_SERVER['SERVER_PORT'];
		} else {
			$port = '';
		}
		return $protocol . $host . $port . $php_request_uri;
	}

	/**
	 * Returns the AuthSub URL which the user must visit to authenticate requests
	 * from this application.
	 *
	 * Uses getCurrentUrl() to get the next URL which the user will be redirected
	 * to after successfully authenticating with the Google service.
	 *
	 * @return string AuthSub URL
	 */
	public function getAuthSubUrl($next=null)
	{
		if ($next==null){
			$next = self::getCurrentUrl();
		}
		$scope = 'http://www.google.com/calendar/feeds/';
		$secure = false;
		$session = true;
		return Zend_Gdata_AuthSub::getAuthSubTokenUri($next, $scope, $secure,
		$session);
	}

	/**
	 * Returns a HTTP client object with the appropriate headers for communicating
	 * with Google using AuthSub authentication.
	 *
	 * Uses the $_SESSION['sessionToken'] to store the AuthSub session token after
	 * it is obtained.  The single use token supplied in the URL when redirected
	 * after the user succesfully authenticated to Google is retrieved from the
	 * $_GET['token'] variable.
	 *
	 * @return Zend_Http_Client
	 */
	public function getAuthSubHttpClient()
	{
		if (!isset($_SESSION['sessionToken']) && isset($_GET['token'])) {
			$_SESSION['sessionToken'] = Zend_Gdata_AuthSub::getAuthSubSessionToken($_GET['token']);
		}
		$client = Zend_Gdata_AuthSub::getHttpClient($_SESSION['sessionToken']);

		return $client;
	}

	/**
	 * Convierte una url id de evento en el id
	 *
	 * @param string $url
	 * @return string
	 */
	public function eventUrlToEventId($url)
	{
		$listaCampos = explode('/', $url);
		$id=$listaCampos[count($listaCampos)-1];

		return $id;
	}

	/**
	 * Devuelve el evento indicado por su urlId
	 * 
	 * @param string $eventUrl La urlId del evento
	 * @return Zend_Gdata_EventEntry
	 */
	public function getEvent($eventUrl)
	{
		if ($eventUrl==''){
			return null;
		}

		$eventId=self::eventUrlToEventId($eventUrl);

		$gdataCal = new Zend_Gdata_Calendar(self::getAuthSubHttpClient());
		$query = $gdataCal->newEventQuery();
		$query->setUser(GCalFaces_SessionControl::getFeedUser());
		$query->setVisibility('private');
		$query->setProjection('full');
		$query->setEvent($eventId);

		try {
			$eventEntry = $gdataCal->getCalendarEventEntry($query);
			return $eventEntry;
		} catch (Zend_Gdata_App_Exception $e) {
			//var_dump($e);
			echo "No puedo obtener el evento: $eventId";
			return null;
		}
	}

	/**
	 * Devuelve la lista de calendarios de un usuario validado
	 *
	 * @return Zend_Gdata_Calenda_ListFeed
	 */
	public function getCalendarListFeed()
	{
		try {
			$gdataCal = new Zend_Gdata_Calendar(self::getAuthSubHttpClient());
			return ($gdataCal->getCalendarListFeed());
				
		}catch (Zend_Gdata_App_Exception $e) {
			echo "Error: " . $e->getResponse();
		}
	}

	/**
	 * Devuelve la lista de eventos del feed indicado, o el guardado en sesion
	 *  si no indica ninguno
	 *
	 * @param string $feedURL
	 * @return Zend_Gdata_Calendar_EventFeed
	 */
	public function getEventFeed($feedURL=null)
	{
		if ($feedURL!=null){
			$listaCampos = split( "/", $feed);
			$usuario=$listaCampos[count($listaCampos)-1];
		}
		else {
			$usuario=GCalFaces_SessionControl::getFeedUser();
		}

		$gdataCal = new Zend_Gdata_Calendar(self::getAuthSubHttpClient());
		$query = $gdataCal->newEventQuery();
		$query->setUser($usuario);
		$query->setVisibility('private');
		$query->setProjection('full');
		$query->setOrderby('starttime');

		$eventFeed = $gdataCal->getCalendarEventFeed($query);

		return $eventFeed;
	}
	
	/**
	 * Devuelve un objeto de tipo Zend_Gdata_Calendar para la interaccion con GCalendar
	 * 
	 * @return Zend_Gdata_Calendar
	 */
	public function getCalendarService()
	{
		return new Zend_Gdata_Calendar(self::getAuthSubHttpClient());	
	}
	
	/**
	 * Devuelve la lista de eventos que cumple los filtros indicados
	 *
	 * Los filtros posibles son:
	 * 	'text': Busqueda en los titulos y contenido
	 *  'feedURL': Busqueda en el feed indicado en lugar del predeterminado
	 *  'updated_min': Fecha de actualizacion minima
	 * 	'updated_max': Fecha de actualizacion maxima
	 *  'tagName': Nombre de la etiqueta a buscar (requiere tagValue)
	 *  'tagValue': Valor de la etiqueta (requiere tagName)
	 * 
	 * @param string $startDate Fecha minima de busqueda en formato GCalendar o null para omitir
	 * @param string $endDate Fecha maxima de busqueda en formato GCalendar o null para omitir
	 * @param array $filters Array con los filtros a aplicar
	 * @return Zend_Gdata_Calenda_ListFeed
	 */
	public function searchEvents($startDate, $endDate, $filters=null)
	{
		//Testeo de parametros
		if (!GCalFaces_DateUtils::isGcalDate($startDate) && $startDate!=null){
			throw new Exception("Fecha inicial no válida");
		}

		if (!GCalFaces_DateUtils::isGcalDate($endDate) && $endDate!=null){
			throw new Exception("Fecha final no válida");
		}
		
		if (isset($filters['feedURL'])){
			$user=$filters['feedURL'];
		} else {
			$user=GCalFaces_SessionControl::getFeedUser();
		}
		
		$gdataCal = new Zend_Gdata_Calendar(self::getAuthSubHttpClient());
		$query = $gdataCal->newEventQuery();
		$query->setUser($user);
		$query->setVisibility('private');
		$query->setProjection('full');
		$query->setOrderby('starttime');
		$query->setSortOrder('ascending');
		if ($startDate!=null){
			$query->setStartMin($startDate);
		}
		if ($endDate!=null){
  			$query->setStartMax($endDate);
		}
  		
		//Procesado de filtros
		if (isset($filters['text'])){
			//Filtrar por texto
			$query->setQuery($filters['text']);
		}
		
		if (isset($filters['updated_min']) && GCalFaces_DateUtils::isGcalDate($filters['updated_min'])){
			//Filtrar por fecha de actualizacion minima
			$query->setUpdatedMin($filters['updated_min']);
		}
		
		if (isset($filters['updated_max']) && GCalFaces_DateUtils::isGcalDate($filters['updated_max'])){
			//Filtrar por fecha de actualizacion maxima
			$query->setUpdatedMax($filters['updated_max']);
		}
		
		if (isset($filters['tagName']) && $filters['tagName']!='' &&
			isset($filters['tagValue']) && $filters['tagValue']!=''){
			$query->setParam('extq', '['.$filters['tagName'].':'.$filters['tagValue'].']');
		}
		
		//Realizar la busqueda
		$eventFeed = $gdataCal->getCalendarEventFeed($query);
		
		return $eventFeed;
	}
		
	/**
	 * Inserta un evento en calendario especificado
	 *
	 * @param Zend_Gdata_EventEntry $entry Evento para insertar
	 * @param string $feedUrl Url del calendario al quer realizar la peticion
	 * @return Zend_Gdata_EventEntry El evento devuelto por GCalendar tras la peticion
	 */
	public function addEvent($entry, $feedUrl = 'http://www.google.com/calendar/feeds/default/private/full/')
	{
		$gdataCal = self::getCalendarService();
		return $gdataCal->insertEvent($entry, $feedUrl);
	}

	/**
	 * Guarda la modificaciones realizada en el evento indicado
	 *
	 * @param Zend_Gdata_EventEntry $entry Evento a salvar
	 * @return Zend_Gdata_EventEntry El evento devuelto por GCalendar tras la peticion
	 */
	public function editEvent($entry)
	{
		return $entry->save();
	}
	
	/**
	 * Elimina el evento indicado de GCalendar
	 *
	 * @param Zend_Gdata_EventEntry $entry Evento a eliminar
	 */
	public function deleteEvent($entry)
	{
		$entry->delete();
	}

	/**
	 * Inserta un evento en el calendario especificado utilizando la caracteristica de inserción rápida(QuickAdd) de GCalendar
	 *
	 * @param string $content Texto del que se extrae la informacion del evento
	 * @param string $feedUrl Url del calendario al quer realizar la peticion
	 * @return Zend_Gdata_EventEntry El evento devuelto por GCalendar tras la peticion
	 * 
	 */
	public function quickAdd($content, $feedUrl = 'http://www.google.com/calendar/feeds/default/private/full/'){
		$gdataCal = self::getCalendarService();
		
		$event= $gdataCal->newEventEntry();
		$event->content= $gdataCal->newContent($content);
		$event->quickAdd = $gdataCal->newQuickAdd("true");

		return $gdataCal->insertEvent($event, $feedUrl);
	}
	
	/**
	 * Añade los elementos necesarios a un evento para utilizalos en una peticion multiple
	 *
	 * @param Zend_Gdata_EventEntry $entry Entrada a la que aplicar las propiedades
	 * @param integer $id Identificador de peticion
	 * @param string $operation Operacion a realizar: insert, delete
	 * @return Zend_Gdata_EventEntry
	 */
	public function addBatchProperties($entry, $id, $operation)
	{
		$extElementId1 = new Zend_Gdata_App_Extension_Element('id', 'batch', 'http://schemas.google.com/gdata/batch', $id);
		$extElementOp1 = new Zend_Gdata_App_Extension_Element('operation', 'batch', 'http://schemas.google.com/gdata/batch');
		$extElementOp1->setExtensionAttributes(array(array('namespaceUri' => 'http://schemas.google.com/gdata/batch', 'name' => 'type', 'value' => $operation)));
		$entry->setExtensionElements(array($extElementId1, $extElementOp1));
		
		return $entry;
	}

	/**
	 * Realiza una peticion multiple contra GCalendar
	 *
	 * @param Array $entries Array de objetos Zend_Gdata_EventEntry 
	 * @param string $feedUrl Url del calendario al que realizar la peticion
	 * @return Zend_Gdata_Calendar_EventFeed El feed devuelto por GCalendar tras la peticion
	 */
	public function performBatchRequest($entries, $feedUrl = 'http://www.google.com/calendar/feeds/default/private/full/batch')
	{
		$gdataCal = new Zend_Gdata_Calendar(self::getAuthSubHttpClient());
		
		$eventFeed = new Zend_Gdata_Calendar_EventFeed();
		$eventFeed->setEntry($entries);

		$response = $gdataCal->post($eventFeed->saveXML(), $feedUrl);
		$responseString = $response->getBody();

		$responseFeed = new Zend_Gdata_Calendar_EventFeed($responseString);

		foreach ($responseFeed as $responseEntry) {
			$responseEntry->setHttpClient($gdataCal->getHttpClient());
		}

		return $responseFeed;
	}

	/**
	 * Devuelve la informacion relativa a una peticion multiple de un evento
	 *
	 * @param Zend_Gdata_EventEntry $entry Evento devuelto por una peticion multiple
	 * @return Array Array asociativo con la informacion relativa a la peticion multiple. Campos: 'id','operation','statusCode','statusReason' 
	 */
	public function getBatchResponseData($entry)
	{
		$batchId = null;
		$batchOperation= null;
		$batchStatusCode = null;
		$batchStatusReason = null;
		 
		$batchNs = 'http://schemas.google.com/gdata/batch';
		$batchIdElement = $batchNs . ':' . 'id';
		$batchOperationElement = $batchNs . ':' . 'operation';
		$batchStatusElement = $batchNs . ':' . 'status';

		$extensionElements = $entry->getExtensionElements();
		foreach ($extensionElements as $extensionElement) {
			$fullName = $extensionElement->rootNamespaceURI . ':' . $extensionElement->rootElement;
			switch ($fullName) {
				case $batchIdElement:
					$batchId = $extensionElement->getText();
					break;
				case $batchOperationElement:
					$extAttrs = $extensionElement->getExtensionAttributes();
					$batchOperation = $extAttrs['type']['value'];
					break;
				case $batchStatusElement:
					$extAttrs = $extensionElement->getExtensionAttributes();
					$batchStatusCode = $extAttrs['code']['value'];
					$batchStatusReason = $extAttrs['reason']['value'];
					break;
			}
		}
		return array('id' => $batchId, 'operation' => $batchOperation, 'statusCode' => $batchStatusCode, 'statusReason' => $batchStatusReason);
	}
	
	/**
	 * Guarda o actualiza una configuracion en el calendario indicado
	 * 
	 * La configuracion se guarda en un evento especial con propiedades extendidas. Dicho evento se 
	 * asigna en entre las 8:00 y las 10:00 del 7 de abril de 1982
	 *
	 * @param Array $config Array con la configuraciones a guardar
	 * @param Zend_Gdata_EventEntry $event Evento con la configuración actual o null para crear uno nuevo
	 * @param string $feedUrl Url del feed donde guardar la configuracion
	 * @return boolean Verdadero si se almacenó correctamente o falso si falló
	 */
	public function setFeedConfig($config, $event=null, $feedUrl = 'http://www.google.com/calendar/feeds/default/private/full/')
	{
		$title='Configuración de GCalFaces';
		$where='';
		$content = 'Este es un evento de configuración de GCalFaces. Almacena su configuracion personal'.
			'para su uso bajo el sistema GCalFaces. Puede eliminar el evento si lo desea, pero perderá'.
			'la opciones de configuración que pueda tener establecidas para esta calendario.';
		$startDate='07/04/1982';
		$endDate='07/04/1982';
		$startTime='08:00';
		$endTime='10:00';
		$tagName='eventConfig';
		$tagValue='1';
		
		$gdataCal = self::getCalendarService();
		if ($event!=null){
			//Actualizar evento, solo modificamos las extendedProperties
			$extProps=array();
			$extProps[] = $gdataCal->newExtendedProperty($tagName, $tagValue);
			if (count($config)>0){
				foreach ($config as $k=>$v){
					$extProps[] = $gdataCal->newExtendedProperty($k, $v);
				}
			}
			$event->extendedProperty = $extProps;
			
			try {
				self::editEvent($event);
				return true;
			} catch (Zend_Gdata_App_Exception $e) {
				return false;
			}
		} else {
			//Crear evento nuevo
			$newEvent = $gdataCal->newEventEntry();
			$newEvent->title = $gdataCal->newTitle($title);
			$newEvent->where = array($gdataCal->newWhere($where));
			$newEvent->content = $gdataCal->newContent($content);
			$when = $gdataCal->newWhen();
			$when->startTime = GCalFaces_DateUtils::makeGCalDate($startDate, $startTime);
			$when->endTime = GCalFaces_DateUtils::makeGCalDate($endDate, $endTime);
			$newEvent->when = array($when);
			
			$extProps=array();
			$extProps[] = $gdataCal->newExtendedProperty($tagName, $tagValue);
			if (count($config)>0){
				foreach ($config as $k=>$v){
					$extProps[] = $gdataCal->newExtendedProperty($k, $v);
				}
			}
			$newEvent->extendedProperty = $extProps;
	
			try {
				$createdEvent = self::addEvent($newEvent, GCalFaces_SessionControl::getFeedURL());
				return true;
			} catch (Zend_Gdata_App_Exception $e) {
				return false;
				
			}
		}
	}
	
	/**
	 * Devuelve la configuración almacenada en un calendario o null si no existe
	 *
	 * @param String $feedUrl Url del feed a buscar
	 * @return Array Array asociativo con la configuracion obtenida. Campos: event, config
	 */
	public function getFeedConfig($feedUrl = 'http://www.google.com/calendar/feeds/default/private/full/')
	{
		$config=array('event'=>null, 'config'=>array());
		
		$eventFeed=self::searchEvents('1982-04-07T07:59:59', '1982-04-07T10:00:00');
		if ($eventFeed){
			foreach($eventFeed as $event){
				$arr=array();
				if (count($event->extendedProperty)>0){
					foreach ($event->extendedProperty as $e){
						$arr[(String)$e->getName()]=(String)$e->getValue();
					}
				}
				
				if (isset($arr['eventConfig']) && $arr['eventConfig']=='1'){
					$config['event']=$event;
					if (isset($arr['theme'])){
						$config['config']['theme']=$arr['theme'];
					}
					break;
				}
			}
		}
		
		return ($config['event']!=null ? $config : null);
	}
}

?>