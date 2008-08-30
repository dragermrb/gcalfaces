<?php
require_once 'libs/settings.php';
session_start();

$action=$_GET['action'];
$c = new GCalFaces_ControllerAddEvent($action);
$c->execute();

?>