<?php
require_once 'libs/settings.php';
session_start();
unset($_SESSION['sessionToken']);
header('Location: index.php');


?>
