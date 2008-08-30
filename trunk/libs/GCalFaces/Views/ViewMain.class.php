<?php
require_once 'View.class.php';

/**
 * Vista para la pagina princial de eventos
 *
 * @package GCalFaces
 * @subpackage Views
 */
class GCalFaces_ViewMain extends GCalFaces_View
{
	
	/**
	 * Constructor de la clase
	 *
	 * @param array $params Array asociativo con los datos a utilizar por la plantilla
	 */
	public function __construct($params)
	{
		
		//Se llama al constructor del padre, que crea el objeto Smarty y lo inicializa
		parent::__construct();
		//Se define el template ha utilizar
		$this->setTemplate('main.html');

		if (is_array($params)){
			foreach($params as $key=>$value){
				$this->smarty->assign($key,$value);
			}
		}
	}
}
?>