<?php
require 'libs/settings.php';
session_start();

$action=$_GET['action'];
$c = new GCalFaces_ControllerSearch($action);
$c->execute();

?>
