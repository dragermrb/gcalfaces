<?php
require_once 'Controller.class.php';

/**
 * Controlador para la eliminacion de eventos en GCalendar
 *
 * @package GCalFaces
 * @subpackage Controllers
 */
class GCalFaces_ControllerDeleteEvent extends GCalFaces_Controller
{
	//Variables
	protected $action=null;

	/**
	 * Constructor de la clase
	 *
	 * @param string $a Accion a realizar
	 */
	public function __construct($a=self::JSON)
	{
		if ($a==self::FORM){
			$this->action=self::FORM;
		} elseif ($a==self::JSON){
			$this->action=self::JSON;
		} elseif ($a==''){
			$this->action = self::FORM;
		} else {
			echo "Acción no reconocida: ".$a;
		}
	}

	/**
	 * Ejecuta la accion establecida
	 *
	 */
	public function execute()
	{
		if ($this->action==self::FORM){
			$this->deleteEventForm();
		} elseif ($this->action==self::JSON){
			$this->deleteEventJson();
		}
	}

	/**
	 * Muestra el formulario para la eliminacion de eventos
	 *
	 */
	public function deleteEventForm()
	{
		throw new Exception('La operación deleteEvent no tiene interfaz de usuario.');
	}

	/**
	 * Elimina un evento en GCalendar y devuelve el resultado en notacion JSON
	 *
	 */
	public function deleteEventJson()
	{
		$eventId=$_POST['eventId'];
		$tagName=$_POST['tagName'];
		$tagValue=$_POST['tagValue'];
		
		$facade = GCalFaces_GCalFacade::singleton();
		
		if ($tagName!='' && $tagValue!=''){
			$filters['tagName']=$tagName;
			$filters['tagValue']=$tagValue;
			
			$eventFeed=$facade->searchEvents(null, null, $filters);
			if ($eventFeed){
				$events=array();
				foreach($eventFeed as $event){
					$facade->addBatchProperties($event, 1, 'delete');
					$events[]=$event;
				}
			}
			
			//Borrar los eventos mediante peticion múltiple
			try {
				$responseFeed = $facade->performBatchRequest($events, GCalFaces_SessionControl::getFeedURL().'/batch');
				
				foreach ($responseFeed as $responseEntry) {
					$deletedEvents[] = $responseEntry;
				}
				$status='success';
			} catch(Zend_Gdata_App_Exception $e) {
				$status='error';
				$errorMsg=$e->getMessage();
			} catch (Exception $e){
				$status='error';
				$errorMsg=$e->getMessage();
			}
			
			header("Expires: Mon, 26 Jul 1997 05:00:00 GMT"); // Date in the past
			header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT"); // always modified
			header("Cache-Control: no-cache, must-revalidate"); // HTTP/1.1
			header("Pragma: no-cache"); // HTTP/1.0
			header("Content-Type: application/json; charset=utf-8");
	
			$response='{"status":"'.$status.'", "errorMsg":"'.$errorMsg.'", "result": '.utf8_encode(eventsToJson($deletedEvents)).'}';
	
			echo $response;
			
		} else {
			$eventOld = $facade->getEvent($eventId);
			if ($eventOld) {
				try {
					$facade->deleteEvent($eventOld);
					$status='success';
				} catch (Zend_Gdata_App_Exception $e) {
					$status='error';
					$errorMsg=$e->getMessage();
				} catch (Exception $e){
					$status='error';
					$errorMsg=$e->getMessage();
				}
			} else {
				$status='error';
				$errorMsg='No se encuentra el evento indicado.';
			}
			header("Expires: Mon, 26 Jul 1997 05:00:00 GMT"); // Date in the past
			header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT"); // always modified
			header("Cache-Control: no-cache, must-revalidate"); // HTTP/1.1
			header("Pragma: no-cache"); // HTTP/1.0
			header("Content-Type: application/json");
	
			$response='{"status":"'.$status.'", "errorMsg":"'.$errorMsg.'", "result": ['.eventToJson($eventOld).']}';
	
			echo $response;
		}
	}
}
?>