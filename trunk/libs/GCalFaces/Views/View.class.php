<?php
/**
 * Vista generica de una pagina web
 *
 * @package GCalFaces
 * @subpackage Views
 */
class GCalFaces_View
{
	protected $smarty=null;
	protected $template='default.html';
	
	/**
	 * Contructor de la clase
	 *
	 */
	public function __construct()
	{
		$this->smarty = new Smarty;
		$this->smarty->compile_check = true;
	}
	
	/**
	 * Establece el nombre del archivo de plantilla a representar
	 *
	 * @param string $t
	 */
	public function setTemplate($t)
	{
		$this->template=$t;
	}
	
	/**
	 * Obtiene el nombre del archivo de plantilla a representar
	 *
	 * @return string
	 */
	public function getTemplate()
	{
		return ($this->template);
	}
	
	/**
	 * Muestra la pagina web segun la plantilla establecida
	 *
	 */
	public function showPage()
	{
		$this->smarty->display(GCalFaces_SessionControl::getTheme().'/'.$this->getTemplate());
	}
}
?>