<?php
require_once 'Controller.class.php';
require_once 'GCalFaces/EventEntryJSON.class.php';

/* Para buscar eventos con una fecha de actualizacion minima/maxima
 * http://code.google.com/apis/gdata/reference.html#Queries
 * 
 */

/**
 * Controlador para la busqueda de eventos en GCalendar
 *
 * @package GCalFaces
 * @subpackage Controllers
 */
class GCalFaces_ControllerSearch extends GCalFaces_Controller
{
	//Constantes
	const FIND_EVENT_JSON='find_event_json';
	const FIND_CALENDAR_JSON='find_calendar_json';

	//Variables
	protected $action=null;

	/**
	 * Contructor de la clase
	 *
	 * @param string $a
	 * @param string $filtro
	 */
	public function __construct($a)
	{
		//Para el caso de la búsqueda podemos hacer que se indique si estamos buscando calendarios o eventos segun un parámetro 
		//que se le pase al constructor
		$this->filters = $filters;
		
		switch ($a){
			case self::FIND_EVENT_JSON:
				$this->action=self::FIND_EVENT_JSON;
				break;
			case self::FIND_CALENDAR_JSON:
				$this->action=self::FIND_CALENDAR_JSON;
				break;
			case '':
				throw new Exception('Acción no especificada.');
				break;
			default:
				throw new Exception('Acción no reconocida'.$a);
		}
	}

	/**
	 * Ejecuta la accion establecida
	 *
	 */
	public function execute()
	{
		switch ($this->action){
			case self::FIND_EVENT_JSON:
				$filters=array();
				if (isset($_GET['feedURL'])){
					//Utilizar feed especifico
					$filters['feedURL']=$_GET['feedURL'];
				}
				if (isset($_GET['text'])){
					//Filtrar por texto
					$filters['text']=$_GET['text'];
				}
				if (isset($_GET['updated_min']) && GCalFaces_DateUtils::isGcalDate($_GET['updated_min'])){
					//Filtrar por fecha de actualizacion minima
					$filters['updated_min']=$_GET['updated_min'];
				}
				if (isset($_GET['updated_max']) && GCalFaces_DateUtils::isGcalDate($_GET['updated_max'])){
					//Filtrar por fecha de actualizacion maxima
					$filters['updated_max']=$_GET['updated_max'];
				}
				
				$this->searchEventsJSON($_GET['startDate'], $_GET['endDate'], $filters);
				break;
				
			case self::FIND_CALENDAR_JSON:
				//TODO: La api de GCalendar aun no permite busqueda de calendarios (29-04-2008)
				throw new Exception("A fecha de 29-04-2008 la api de GCalendar aun no permite busqueda de calendarios.");
				break;
			
			default:
				$this->outputCalendarList();
		}
	}
		
	/**
	 * Devuelve (al navegador) una lista de eventos en formato JSON
	 *
	 * @param string $startDate Fecha minima de busqueda en formato GCalendar
	 * @param string $endDate Fecha maxima de busqueda en formato GCalendar
	 * @param array $filters Array con los filtros a aplicar
	 */
	public function searchEventsJSON($startDate, $endDate, $filters=null)
	{
		$eventFeedJSON=array();
		
		$facade = GCalFaces_GCalFacade::singleton();
		$eventFeed=$facade->searchEvents($startDate, $endDate, $filters);
		
		foreach($eventFeed as $event){
			$eventJSON=new GCalFaces_EventEntryJSON();
			
			$eventJSON->id=$facade->eventUrlToEventId($event->id->text);
			$eventJSON->title=$event->title->text;
			$eventJSON->content=$event->content->text;
			$eventJSON->eventStatus=$event->eventStatus->text;
			switch($event->eventStatus->getValue()){
				case 'http://schemas.google.com/g/2005#event.confirmed':
					$eventJSON->eventStatus='confirmed';
					break;
				case 'http://schemas.google.com/g/2005#event.canceled':
					$eventJSON->eventStatus='canceled';
					break;
				default:
					$eventJSON->eventStatus='confirmed';
			}
			
			$arr=array();
			if (count($event->where)>0){
				foreach($event->where as $w){
					$arr[]=(String)$w->getValueString();
				}
			} else {
				$arr[]='';
			}
			$eventJSON->where=$arr;
			
			$arr=array();
			if (count($event->when)>0){
				foreach($event->when as $w){
					$arr[]=array('startDate'=> (String)$w->startTime,
								 'endDate' => (String)$w->endTime);
				}
			}
			$eventJSON->when=$arr;
			
			//Extended properties
			$arr=array();
			if (count($event->extendedProperty)>0){
				foreach ($event->extendedProperty as $e){
					$arr[]=array('name'=> (String)$e->getName(),
								 'value' => (String)$e->getValue());
				}
			}
			$eventJSON->extendedProperty=$arr;
			
			$eventFeedJSON[]=$eventJSON;
		}
		
		header("Expires: Mon, 26 Jul 1997 05:00:00 GMT"); // Date in the past
		header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT"); // always modified
		header("Cache-Control: no-cache, must-revalidate"); // HTTP/1.1
		header("Pragma: no-cache"); // HTTP/1.0
		header("Content-Type: application/json");
		
		$response->lastUpdated=$eventFeed->updated->text;
		$response->events=$eventFeedJSON;
		
		echo json_encode($response);
	}
}
?>