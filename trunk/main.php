<?php
require_once 'libs/settings.php';
session_start();


if (isset($_GET['feed'])){
	GCalFaces_SessionControl::setFeed($_GET['feed']);
} else {
	GCalFaces_SessionControl::setFeed('');
}

if (!isset($_SESSION['sessionToken']) && !isset($_GET['token'])) {
	$facade = GCalFaces_GCalFacade::singleton();
	$nextUrl = $facade->getCurrentUrl();
	header('Location: '.$facade->getAuthSubUrl($nextUrl));
	exit;
} else if (!isset($_SESSION['sessionToken']) && isset($_GET['token'])) {
	$_SESSION['sessionToken']=Zend_Gdata_AuthSub::getAuthSubSessionToken($_GET['token']);
}

$action=$_GET['action'];
$c = new GCalFaces_ControllerMain($action);
$c->execute();

?>
