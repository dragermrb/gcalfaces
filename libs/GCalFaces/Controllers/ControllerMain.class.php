<?php
require_once 'Controller.class.php';
require_once 'GCalFaces/Views/ViewMain.class.php';
require_once 'GCalFaces/Views/ViewListCals.class.php';

/**
 * Controlador para la pagina de busqueda de eventos en GCalendar
 *
 * @package GCalFaces
 * @subpackage Controllers
 */
class GCalFaces_ControllerMain extends GCalFaces_Controller
{
	//Constantes
	const LIST_CALS='listCals';
	const ASSIGN_THEME='assignTheme';
	
	//Variables
	protected $action=null;
	
	/**
	 * Constructor de la clase
	 *
	 */
	public function __construct($a=self::LIST_CALS)
	{
		if ($a==self::FORM){
			$this->action=self::FORM;
		} elseif ($a==self::LIST_CALS){
			$this->action = self::LIST_CALS;
		} elseif ($a==self::ASSIGN_THEME){
			$this->action = self::ASSIGN_THEME;
		} elseif ($a==''){
			$this->action = self::LIST_CALS;
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
			$this->mainForm();
		} elseif ($this->action==self::LIST_CALS){
			$this->listCalendars();
		} elseif ($this->action==self::ASSIGN_THEME){
			$this->assignTheme();
		} else {
			throw new Exception('Acción no reconocida: '.$a);
		}
	}	
	
	/**
	 * Muestra la pantalla principal del sistema
	 *
	 */
	private function mainForm()
	{
		if (isset($_GET['feed'])){
			GCalFaces_SessionControl::setFeed($_GET['feed']);
		} else {
			GCalFaces_SessionControl::setFeed('');
		}
		
		$feed=GCalFaces_SessionControl::getFeed();
		
		//Establecer tema
		if (!isset($_GET['theme']) || $_GET['theme']==''){
			$facade = GCalFaces_GCalFacade::singleton();
			$config=$facade->getFeedConfig();
			if ($config && isset($config['config']['theme'])){
				$theme=$config['config']['theme'];
			} else {
				$theme='default';
			}
		} else {
			$theme=$_GET['theme'];
		}
		
		$params = array('title'=>$feed->author[0]->name->text,
			'templateFolder'=>$theme,
			'calendarAuthorName'=> $feed->author[0]->name->text,
			'calendarAuthorEmail' => $feed->author[0]->email->text,
			'calendarTitle' => $feed->title->text,
			'calendarTimezone' => $feed->timezone->value);

		GCalFaces_SessionControl::setTheme($theme);
		
		//Asignar el tema en la configuracion del feed
		if ($_GET['assign']){
			$this->assignTheme();
		}

		$view = new GCalFaces_ViewMain($params);
		$view->showPage();
	}
	
	/**
	 * Muestra la lista de calendarios del usuario
	 *
	 */
	private function listCalendars()
	{
		try {
			$facade = GCalFaces_GCalFacade::singleton();
			$calFeed = $facade->getCalendarListFeed(); 
			GCalFaces_SessionControl::setCalendarList($calFeed);
		} catch (Zend_Gdata_App_Exception $e) {
			echo "Error: " . $e->getResponse();
		}
		
		$calendars=array();
		foreach ($calFeed->entry as $feed){
			$calendars[]=array('id'=>$feed->id->text,
				'calendarAuthorName'=> $feed->author[0]->name->text,
				'calendarAuthorEmail' => $feed->author[0]->email->text,
				'calendarTitle' => $feed->title->text,
				'calendarTimezone' => $feed->timezone->value);
		}
		
		//Listar temas disponibles
		$themes=array();
		$themespath = ABSPATH."../templates/";
		
		if (is_dir($themespath)) {
		    if ($dh = opendir($themespath)) {
		        while (($file = readdir($dh)) !== false) {
		        	if ($file=='.' || $file=='..' || $file[0]=='.' ){
		        		continue; //Omitimos directorios especiales y ocultos (UNIX)
		        	}
		        	
		        	if (filetype($themespath . $file)=='dir'){
		        		$themes[]=$file;
		        	}
		        }
		        closedir($dh);
		    }
		}

		$params = array('title'=>$calFeed->author[0]->name->text,
			'userName' => $calFeed->author[0]->name->text,
			'userEmail' => $calFeed->author[0]->email->text,
			'calendars'=>$calendars,
			'themes'=>$themes);
		
		$view = new GCalFaces_ViewListCals($params);
		$view->showPage();
	}
	
	/**
	 * Asocia del tema y calendarios de la sesión, guardando la configuracion en GCalendar
	 *
	 */
	private function assignTheme()
	{
		$feedUrl=GCalFaces_SessionControl::getFeedURL();
		$theme=GCalFaces_SessionControl::getTheme();
		$configNew=array('theme'=>$theme);
		
		$facade = GCalFaces_GCalFacade::singleton();
		$config = $facade->getFeedConfig($feedUrl);
		if ($config){
			$eventConfig=$config['event'];
		} else {
			$eventConfig=null;
		}
		
		$facade->setFeedConfig($configNew, $eventConfig, $feedUrl);
	}
}
?>