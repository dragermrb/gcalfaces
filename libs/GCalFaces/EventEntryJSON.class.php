<?php

/**
 * Clase Evento para comunicacion mediante notacion JSON
 *
 * @package GCalFaces
 */
class GCalFaces_EventEntryJSON {
	/**
	 * Identificador del evento
	 *
	 * @var string
	 */
	public $id=null;
	
	/**
	 * Titulo del evento
	 *
	 * @var string
	 */
	public $title=null;
	
	/**
	 * Contenido del evento
	 *
	 * @var string
	 */
	public $content=null;
	
	/**
	 * Lugar del evento
	 *
	 * @var array
	 */
	public $where=null;
	
	/**
	 * Fecha del evento
	 *
	 * @var array
	 */
	public $when=null;
	
	/**
	 * Propiedades extendidas
	 *
	 * @var array
	 */
	public $extendedProperty=null;
}
?>