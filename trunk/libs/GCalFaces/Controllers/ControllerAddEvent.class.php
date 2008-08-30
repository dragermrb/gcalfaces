<?php
require_once 'Controller.class.php';
require_once 'GCalFaces/Views/ViewAddEvent.class.php';

/**
 * Controlador para la insercion de eventos en GCalendar
 *
 * @package GCalFaces
 * @subpackage Controllers
 */
class GCalFaces_ControllerAddEvent extends GCalFaces_Controller
{
	//Variables
	protected $action=null;
	const QUICK_ADD='quickAdd';

	/**
	 * Constructor de la clase
	 *
	 * @param string $a Accion a realizar
	 */
	public function __construct($a=self::FORM)
	{
		if ($a==self::FORM){
			$this->action = self::FORM;
		} elseif ($a==self::JSON){
			$this->action=self::JSON;
		} elseif ($a==self::QUICK_ADD){
			$this->action=self::QUICK_ADD;
		} elseif ($a==''){
			$this->action = self::FORM;
		} else {
			throw new Exception('Acción no reconocida: '.$a);
		}
	}

	/**
	 * Ejecuta la accion establecida
	 *
	 */
	public function execute()
	{
		if ($this->action==self::FORM){
			$this->addEventForm();
		} elseif ($this->action==self::JSON){
			$this->addEventJson();
		} elseif ($this->action==self::QUICK_ADD){
			$this->quickAddJson();
		} else {
			throw new Exception('Acción no reconocida: '.$a);
		}
	}

	/**
	 * Muestra el formulario para la insercion de eventos
	 *
	 */
	private function addEventForm()
	{
		//Se recoge la fecha
		if($_GET['startDate']!='' && GCalFaces_DateUtils::isDate($_GET['startDate'])){
			$startDate=$_GET['startDate'];
		}

		$params = array('startDate'=>$startDate);
		$view = new GCalFaces_ViewAddEvent($params);
		$view->showPage();
	}
	
	/**
	 * Inserta un evento en GCalendar y devuelve el resultado en notacion JSON
	 *
	 */
	private function addEventJson()
	{
		//Obtener datos
		$title=$_POST['title'];
		$where=$_POST['where'];
		$content=$_POST['content'];
		$startDate=$_POST['startDate'];
		$endDate=$_POST['endDate'];
		$startTime=$_POST['startTime'];
		$endTime=$_POST['endTime'];
		$tagName=$_POST['tagName'];
		$tagValue=$_POST['tagValue'];
		
		$eventsCount=0; //Número de eventos no nulos
		$fieldsCount=array(); //Numero de campos no nulos
		$eventsOrders=array(); //Indices de eventos no nulos 
		$fieldCount=null; //Numero de campos no nulos (auxiliar)
		$fields = array('title','where','content','startDate','endDate','startTime','endTime','tagName','tagValue');
		foreach ($fields as $field){
			if (is_array($$field)){
				$fieldCount=0;
				foreach ($$field as $k=>$f){
					if ($f!=''){
						$fieldCount++;
						$eventsOrders[$k]=true;
					}
				}
				//$eventsCount=max($eventsCount, count($$field));
				$fieldsCount[$field]=$fieldCount;
				$eventsCount=max($eventsCount, $fieldCount++);
			} else if ($$field!=''){
				$eventsCount=max($eventsCount, 1);
				$fieldsCount[$field]=1;
			}
		}
		
		$facade = GCalFaces_GCalFacade::singleton();
		$gdataCal = $facade->getCalendarService();
		
		$createdEvents=array();
		
		if ($eventsCount==0){
			throw new Exception('Se intentó insertar un evento vacío.');
		} else if ($eventsCount==1){
			//Insertar un solo evento
			//Convertir arrays en variables simple
			$keys=array_keys($eventsOrders);
			$i=$keys[0];
			foreach ($fields as $field){
				if (is_array($$field)){
					$tmp=$$field;
					$$field=$tmp[$i];
				}
			}
			try {
				$newEvent = $gdataCal->newEventEntry();
				$newEvent->title = $gdataCal->newTitle($title);
				$newEvent->where = array($gdataCal->newWhere($where));
				$newEvent->content = $gdataCal->newContent($content);
		
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
				$newEvent->when = array($when);
				
				//El valor cero, da un error, evitarlo
				$extPropOrder = $gdataCal->newExtendedProperty('gcfOrder', intval($i)+1);
				if ($tagName!=''){
					$extProp = $gdataCal->newExtendedProperty($tagName, $tagValue);
				    $newEvent->extendedProperty = array($extProp,$extPropOrder);
				} else {
					$newEvent->extendedProperty = array($extPropOrder);
				}
			
				//$createdEvents[] = $facade->addEvent($newEvent, GCalFaces_SessionControl::getFeedURL());
				$status='success';
			} catch (Zend_Gdata_App_Exception $e){
				$status='error';
				$errorMsg=$e->getMessage();
			} catch (Exception $e){
				$status='error';
				$errorMsg=$e->getMessage();
			}
		} else {
			//Insercion multimple
			$events=array();
			try{
				foreach (array_keys($eventsOrders) as $i){
					$events[$i]=$gdataCal->newEventEntry();
	
					//Titulo
					if (is_array($title)){
						if (/*count($title)*/$fieldsCount['title']==1){
							//Actuar como si fuese valor único
							$keys=array_keys($title); //Para conocer el indice
							$events[$i]->title = $gdataCal->newTitle($title[$keys[0]]);
						} else if (/*count($title)*/$fieldsCount['title']==$eventsCount){
							$events[$i]->title = $gdataCal->newTitle($title[$i]);
						} else {
							throw new Exception('Número de parametros no válido para el campo title.');
						}
					} else {
						$events[$i]->title = $gdataCal->newTitle($title);
					}
					
					//Localizacion
					if (is_array($where)){
						$events[$i]->where = array($gdataCal->newWhere($where[$i]));
					} else {
						$events[$i]->where = array($gdataCal->newWhere($where));
					}
					
					//Contenido
					if (is_array($content)){
						$events[$i]->content = $gdataCal->newContent($content[$i]); 
					} else {
						$events[$i]->content = $gdataCal->newContent($content);
					}
					
					$when = $gdataCal->newWhen();
					//startDate
					if (is_array($startDate)){
						if (/*count($startDate)*/$fieldsCount['startDate']==1){
							//Actuar como si fuese valor único
							//Buscar valor no vacio para encontrar el indice
							foreach($startDate as $k=>$s){
								if ($s!=''){
									$startDateKey=$k;
									break;
								}
							}
							$when->startTime = GCalFaces_DateUtils::makeGCalDate($startDate[$startDateKey], $startTime[$startDateKey]);
						} else if (/*count($startDate)*/$fieldsCount['startDate']==$eventsCount){
							$when->startTime = GCalFaces_DateUtils::makeGCalDate($startDate[$i], $startTime[$i]);
						} else {
							throw new Exception('Número de parametros ('./*count($startDate)*/$fieldsCount['startDate'].') no válido para el campo startDate.');
						}
					} else {
						$when->startTime = GCalFaces_DateUtils::makeGCalDate($startDate, $startTime);
					}
					//endDate
					if (is_array($endDate)){
						if (/*count($endDate)*/$fieldsCount['endDate']==1){
							//Actuar como si fuese valor único
							//Buscar valor no vacio para encontrar el indice
							foreach($endDate as $k=>$e){
								if ($e!=''){
									$endDateKey=$k;
									break;
								}
							}
							$when->endTime = GCalFaces_DateUtils::makeGCalDate($endDate[$endDateKey], $endTime[$endDateKey]);
						} else if (/*count($endDate)*/$fieldsCount['endDate']==$eventsCount){
							$when->endTime = GCalFaces_DateUtils::makeGCalDate($endDate[$i], $endTime[$i]);
						} else {
							throw new Exception('Número de parametros ('./*count($endDate)*/$fieldsCount['endDate'].') no válido para el campo endDate.');
						}
					} else {
						$when->endTime = GCalFaces_DateUtils::makeGCalDate($endDate, $endTime);
					}
					
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
					$events[$i]->when = array($when);
					
					//Propiedades extendidas
					//Nombre del tag
					if (is_array($tagName)){
						if (count($tagName)==1){
							//Actuar como si fuese valor único
							$keys=array_keys($tagName); //Para conocer el indice
							$auxTagName=$tagName[$keys[0]];
						} else if (count($tagName)==$eventsCount){
							$auxTagName=$tagName[$i];
						} else {
							throw new Exception('Número de parametros ('.count($tagName).') no válido para el campo tagName.');
						}
					} else {
						$auxTagName=$tagName;
					}
					//Valor del tag
					if (is_array($tagValue)){
						if (count($tagValue)==1){
							//Actuar como si fuese valor único
							$keys=array_keys($tagValue); //Para conocer el indice
							$auxTagValue=$tagValue[$keys[0]];
						} else if (count($tagValue)==$eventsCount){
							$auxTagValue=$tagValue[$i];
						} else {
							throw new Exception('Número de parametros ('.count($tagValue).') no válido para el campo tagValue.');
						}
					} else {
						$auxTagValue=$tagValue;
					}
	
					//El valor cero, da un error, evitarlo
					$extPropOrder = $gdataCal->newExtendedProperty('gcfOrder', intval($i)+1);
					if ($auxTagName!=''){
						$extProp = $gdataCal->newExtendedProperty($auxTagName, $auxTagValue);
					    $events[$i]->extendedProperty = array($extProp,$extPropOrder);
					} else {
						$events[$i]->extendedProperty = array($extPropOrder);
					}
					
					$events[$i] = $facade->addBatchProperties($events[$i], 1, 'insert');
				}

				//Insertar los eventos mediante peticion múltiple
				$responseFeed = $facade->performBatchRequest($events, GCalFaces_SessionControl::getFeedURL().'/batch');
				
				foreach ($responseFeed as $responseEntry) {
					$createdEvents[] = $responseEntry;
					//$batchResponseData =  GCalFaces_GCalFacade::getBatchResponseData($responseEntry);
					//echo $responseEntry->getTitle()->getText() . "\n";
					//echo $batchResponseData['statusCode'] . ': ' . $batchResponseData['statusReason'] . "\n\n";
				}
				$status='success';
			} catch(Zend_Gdata_App_Exception $e) {
				$status='error';
				$errorMsg=$e->getMessage();
			} catch (Exception $e){
				$status='error';
				$errorMsg=$e->getMessage();
			}
		}
		
		header("Expires: Mon, 26 Jul 1997 05:00:00 GMT"); // Date in the past
		header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT"); // always modified
		header("Cache-Control: no-cache, must-revalidate"); // HTTP/1.1
		header("Pragma: no-cache"); // HTTP/1.0
		header("Content-Type: application/json; charset=utf-8");
		

		$response='{"status":"'.$status.'", "errorMsg":"'.$errorMsg.'", "result": '.utf8_encode(eventsToJson($createdEvents)).'}';

		echo $response;
	}

	/**
	 * Inserta un evento en GCalendar usando la caracteristica de inserción rápida (QuickAdd) y devuelve el resultado en notacion JSON
	 *
	 */
	private function quickAddJson()
	{
		$content=$_POST['content'];
		
		try {
			$facade = GCalFaces_GCalFacade::singleton();
			$createdEvents[] = $facade->quickAdd($content, GCalFaces_SessionControl::getFeedURL()); 
			$status='success';
		} catch (Zend_Gdata_App_Exception $e) {
			$status='error';
		}
		
		header("Expires: Mon, 26 Jul 1997 05:00:00 GMT"); // Date in the past
		header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT"); // always modified
		header("Cache-Control: no-cache, must-revalidate"); // HTTP/1.1
		header("Pragma: no-cache"); // HTTP/1.0
		header("Content-Type: application/json; charset=utf-8");

		$response='{"status":"'.$status.'", "result": '.utf8_encode(eventsToJson($createdEvents)).'}';

		echo $response;
	}
}
?>