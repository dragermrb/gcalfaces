<?php
require_once 'libs/settings.php';
session_start();

$fileUri = 'templates/'.GCalFaces_SessionControl::getTheme().'/config.js';
$configStr = file_get_contents($fileUri);

if ($configStr!=null){
	echo '{"status":"success", "config":'.$configStr.'}';
} else {
	echo '{"status":"error"}';
}
?>