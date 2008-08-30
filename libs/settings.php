<?
define('ABSPATH', dirname(__FILE__).'/');
set_include_path(realpath(ABSPATH). PATH_SEPARATOR . realpath(ABSPATH.'/../'));


require_once 'Smarty/Smarty.class.php';

require_once 'GCalFaces/Controllers/Controller.class.php';
require_once 'GCalFaces/Controllers/ControllerMain.class.php';
require_once 'GCalFaces/Controllers/ControllerAddEvent.class.php';
require_once 'GCalFaces/Controllers/ControllerEditEvent.class.php';
require_once 'GCalFaces/Controllers/ControllerDeleteEvent.class.php';
require_once 'GCalFaces/Controllers/ControllerSearch.class.php';

require_once 'Zend/Loader.php';
Zend_Loader::loadClass('Zend_Gdata');
Zend_Loader::loadClass('Zend_Gdata_AuthSub');
Zend_Loader::loadClass('Zend_Gdata_ClientLogin');
Zend_Loader::loadClass('Zend_Gdata_Calendar');

require_once 'GCalFaces/SessionControl.class.php';
require_once 'GCalFaces/GCalFacade.class.php';


// =============================================
// Convierte un objeto desde representacion JSON
if ( !function_exists('json_decode') ){
    function json_decode($content, $assoc=false){
                require_once 'JSON.php';
                if ( $assoc ){
                    $json = new Services_JSON(SERVICES_JSON_LOOSE_TYPE);
        } else {
                    $json = new Services_JSON;
                }
        return $json->decode($content);
    }
}

// =========================================
// Convierte un objeto a representacion JSON
if ( !function_exists('json_encode') ){
    function json_encode($content){
		require_once 'JSON.php';
		$json = new Services_JSON;
               
        return $json->encode($content);
    }
}


function eventToJson($event){

	$eventJSON=new GCalFaces_EventEntryJSON();
			
	$eventJSON->id=GCalFaces_GCalFacade::eventUrlToEventId($event->id->text);
	$eventJSON->title=$event->title->text;
	$eventJSON->content=$event->content->text;
	
	$arr=array();
	if (count($event->where)>0){
		foreach($event->where as $w){
			$arr[]=(String)$w;
		}
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
	
	return json_encode($eventJSON);

}

/**
 * Convierte un array de objetos EventEntry en notacion JSON
 *
 * @param array $events Array de objetos EventEntry
 * @return string
 */
function eventsToJson($events){
	if (!is_array($events)){
		throw new Exception('El parámetro indicado no es un array.');	
	}
	
	$eventsJSON=array();
	foreach ($events as $event){
		$eventJSON=new GCalFaces_EventEntryJSON();
				
		$eventJSON->id=GCalFaces_GCalFacade::eventUrlToEventId($event->id->text);
		$eventJSON->title=$event->title->text;
		$eventJSON->content=$event->content->text;
		
		$arr=array();
		if (count($event->where)>0){
			foreach($event->where as $w){
				$arr[]=(String)$w;
			}
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
		
		$eventsJSON[]=$eventJSON;
	}
	
	return json_encode($eventsJSON);
}


/**
 * Ejecuta la funcion stripslashes sobre un valor o matriz
 *
 * @param Array $value
 * @return Array o valor sin secuencias de escapado
 */
function stripslashes_deep($value)
{
    $value = is_array($value) ?
                array_map('stripslashes_deep', $value) :
                stripslashes($value);

    return $value;
}

if (get_magic_quotes_gpc()){
	//Eliminar secuencias de escape automaticas
	$_GET=stripslashes_deep($_GET);
	$_POST=stripslashes_deep($_POST);
}
?>