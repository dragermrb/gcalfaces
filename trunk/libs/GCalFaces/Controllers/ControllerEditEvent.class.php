<?php
require_once 'Controller.class.php';
require_once 'GCalFaces/Views/ViewEditEvent.class.php';

/**
 * Controlador para la modificacion de eventos en GCalendar
 *
 * @package GCalFaces
 * @subpackage Controllers
 */
class GCalFaces_ControllerEditEvent extends GCalFaces_Controller
{
	//Variables
	protected $action=null;
	
	/**
	 * Constructor de la clase
	 *
	 * @param string $a Accion a realizar
	 */
	public function __construct($a=self::FORM)
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
			$this->editEventForm();
		}
		elseif ($this->action==self::JSON){
			$this->editEventJson();
		}
	}

	/**
	 * Muestra el formulario para la modificacion de eventos
	 *
	 */
	public function editEventForm()
	{
		//Obtengo los datos del servidor
		if (isset($_POST['eventId'])){
			$eventId=$_POST['eventId'];
		} else if (isset($_GET['eventId'])){
			$eventId=$_GET['eventId'];
		} else {
			$eventId='null';
		}
		
		if (isset($_GET['tagName']) && $_GET['tagName']!='' &&
			isset($_GET['tagValue']) && $_GET['tagValue']!=''){
			//Modificar grupo
			$filters['tagName']=$_GET['tagName'];
			$filters['tagValue']=$_GET['tagValue'];
			
			$facade = GCalFaces_GCalFacade::singleton();
			$eventFeed=$facade->searchEvents(null, null, $filters);
			if ($eventFeed){
				$eventFeedUnorder=array();
				
				$eventId=array();
				$title=array();
				$where=array();
				$content=array();
				$when=array();
				$startDate=array();
				$endDate=array();
				$startTime=array();
				$endTime=array();
				
				
				foreach($eventFeed as $event){
					$gcfOrder=-1;
					
					if (count($event->extendedProperty)>0){
						foreach ($event->extendedProperty as $e){
							if ((String)$e->getName()=='gcfOrder'){
								$gcfOrder=intval((String)$e->getValue())-1;
								break;
							}
						}
					}
					
					if ($gcfOrder!=-1){
						$eventId[$gcfOrder]=$facade->eventUrlToEventId($event->id->text);
						$title[$gcfOrder]=$event->title;
						$where[$gcfOrder]=$event->getWhere();
						$where[$gcfOrder]=$where[$gcfOrder][0];
			
						$content[$gcfOrder]=$event->content;
			
						$when[$gcfOrder]=$event->getWhen();
						$when[$gcfOrder]=$when[$gcfOrder][0];
			
						$startDate[$gcfOrder]=GCalFaces_DateUtils::dateGcalToSpanish($when[$gcfOrder]->startTime);
						$endDate[$gcfOrder]=GCalFaces_DateUtils::dateGcalToSpanish($when[$gcfOrder]->endTime);
						
						if (GCalFaces_DateUtils::isGcalDateTime($when[$gcfOrder]->startTime)){
							$startTime[$gcfOrder]=GCalFaces_DateUtils::dateGcalToTime($when[$gcfOrder]->startTime);	
						} else {
							$startTime[$gcfOrder]='';
						}
						if (GCalFaces_DateUtils::isGcalDateTime($when[$gcfOrder]->endTime)){
							$endTime[$gcfOrder]=GCalFaces_DateUtils::dateGcalToTime($when[$gcfOrder]->endTime);
						} else {
							$endTime[$gcfOrder]='';
							//Restar un dia, los dias completos se ponen como las 0:00 del siguiente
							$endTimeStamp=strtotime($when[$gcfOrder]->endTime);
							$endTimeStamp=mktime(0,0,0,
								date('n',$endTimeStamp),
								date('j',$endTimeStamp)-1,
								date('Y',$endTimeStamp));
							$endDate[$gcfOrder]=date('d/m/Y',$endTimeStamp);
						}
					} else {
						//No tiene orden asignado
						$eventFeedUnorder[]=$event;
					}
				}
				if (count($eventFeedUnorder)>0){
					foreach($eventFeedUnorder as $event){
						$eventId[]=$facade->eventUrlToEventId($event->id->text);
						$title[]=$event->title;
						$where_tmp=$event->getWhere();
						$where[]=$where_tmp[0];
			
						$content[]=$event->content;
			
						$when_tmp=$event->getWhen();
						$when[]=$when_tmp[0];
			
						$startDate[]=GCalFaces_DateUtils::dateGcalToSpanish($when_tmp[0]->startTime);
						if (GCalFaces_DateUtils::isGcalDateTime($when_tmp[0]->endTime)){
							$endDate[]=GCalFaces_DateUtils::dateGcalToSpanish($when_tmp[0]->endTime);
						} else {
							//Restar un dia, los dias completos se ponen como el dia siguiente
							$endTimeStamp=strtotime($when_tmp[0]->endTime);
							$endTimeStamp=mktime(0,0,0,
								date('n',$endTimeStamp),
								date('j',$endTimeStamp)-1,
								date('Y',$endTimeStamp));
							$endDate[]=date('d/m/Y',$endTimeStamp);
						}
						
						if (GCalFaces_DateUtils::isGcalDateTime($when_tmp[0]->startTime)){
							$startTime[]=GCalFaces_DateUtils::dateGcalToTime($when_tmp[0]>startTime);	
						} else {
							$startTime[]='';
						}
						if (GCalFaces_DateUtils::isGcalDateTime($when_tmp[0]->endTime)){
							$endTime[]=GCalFaces_DateUtils::dateGcalToTime($when_tmp[0]->endTime);
						} else {
							$endTime[]='';
						}
					}
				}
				
				$params=array(
					'tagName'=>$_GET['tagName'],
					'tagValue'=>$_GET['tagValue'],
					'eventId'=>$eventId,
					'title'=>$title, 
					'where'=>$where, 
					'content'=>$content, 
					'when'=>$when,
					'startDate'=>$startDate,
					'endDate'=>$endDate,
					'startTime'=>$startTime,
					'endTime'=>$endTime);
				
				$vista= new GCalFaces_ViewEditEvent($params);
				$vista->setTemplate('editGroup.html');
				$vista->showPage();
			} else {
				throw new Exception('No se encontro el grupo de eventos: '.$_GET['tagName'].', '.$_GET['tagValue']);
			}
		} else {
			//Modificacion de evento simple
			$facade = GCalFaces_GCalFacade::singleton();
			$eventOld = $facade->getEvent($eventId);
			if ($eventOld) {
				$title=$eventOld->title;
				$where=$eventOld->getWhere();
				$where=$where[0];
	
				$content=$eventOld->content;
	
				$when=$eventOld->getWhen();
				$when=$when[0];
	
				$startDate=GCalFaces_DateUtils::dateGcalToSpanish($when->startTime);
				$endDate=GCalFaces_DateUtils::dateGcalToSpanish($when->endTime);
				
				if (GCalFaces_DateUtils::isGcalDateTime($when->startTime)){
					$startTime=GCalFaces_DateUtils::dateGcalToTime($when->startTime);	
				} else {
					$startTime='';
				}
				if (GCalFaces_DateUtils::isGcalDateTime($when->endTime)){
					$endTime=GCalFaces_DateUtils::dateGcalToTime($when->endTime);
				} else {
					$endTime='';
					//Restar un dia, los dias completos se ponen como el dia siguiente
					$endTimeStamp=strtotime($when->endTime);
					$endTimeStamp=mktime(0,0,0,
						date('n',$endTimeStamp),
						date('j',$endTimeStamp)-1,
						date('Y',$endTimeStamp));
					$endDate=date('d/m/Y',$endTimeStamp);
				}
			} else {
				throw new Exception('No se encontro el evento: '.$eventId);
			}
			$params=array(
				'eventId'=>$eventId,
				'title'=>$title, 
				'where'=>$where, 
				'content'=>$content, 
				'when'=>$when,
				'startDate'=>$startDate,
				'endDate'=>$endDate,
				'startTime'=>$startTime,
				'endTime'=>$endTime);
	
			$vista= new GCalFaces_ViewEditEvent($params);
			$vista->showPage();
		}
	}

	/**
	 * Modificar un evento en GCalendar y devuelve el resultado en notacion JSON
	 *
	 */
	public function editEventJson()
	{
		//Responde con JSON
		$eventId=$_POST['eventId'];
		$title=$_POST['title'];
		$where=$_POST['where'];
		$content=$_POST['content'];
		$startDate=$_POST['startDate'];
		$endDate=$_POST['endDate'];
		$startTime=$_POST['startTime'];
		$endTime=$_POST['endTime'];
		
		$facade = GCalFaces_GCalFacade::singleton();
		$eventOld = $facade->getEvent($eventId);
		if ($eventOld) {
			try {
				$gdataCal = $facade->getCalendarService();
				//Actualizar campos
				$eventOld->title = $gdataCal->newTitle($title);
				$eventOld->where = array($gdataCal->newWhere($where));
				$eventOld->content = $gdataCal->newContent($content);
	
				$when = $gdataCal->newWhen();
				
				$when->startTime = GCalFaces_DateUtils::makeGCalDate($startDate, $startTime);
				$when->endTime = GCalFaces_DateUtils::makeGCalDate($endDate, $endTime);
				
				if (strcmp($when->endTime,$when->startTime)<0){
					throw new Exception('La fecha de fin ('.$when->endTime.') no puede ser anterior a la de comienzo ('.$when->startTime.')');
				}
				if (/*$when->startTime==$when->endTime && */!GCalFaces_DateUtils::isGcalDateTime($when->endTime)){
					//Un unico dia, fechas iguales sin hora
					$endTimeStamp=strtotime($when->endTime);
					$endTimeStamp=mktime(0,0,0,
						date('n',$endTimeStamp),
						date('j',$endTimeStamp)+1,
						date('Y',$endTimeStamp));
					$when->endTime=date('Y-m-d',$endTimeStamp);
				}
				$eventOld->when = array($when);
			

				$eventNew=$facade->editEvent($eventOld);
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

		$response='{"status":"'.$status.'", "errorMsg":"'.$errorMsg.'", "result": ['.eventToJson($eventNew).']}';

		echo $response;
	}

}
?>
