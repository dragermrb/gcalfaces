<?php
/**
 * Smarty plugin
 * @package Smarty
 * @subpackage plugins
 */

/**
 * Smarty {smarty_function_gcalfaces_select_timeview} plugin
 *
 * Type:     function<br>
 * Name:     smarty_function_gcalfaces_select_timeview<br>
 * Purpose:  Prints the dropdowns for date selection.
 *
 * ChangeLog:<br>
 *           - 1.0 initial release
 * @link http://smarty.php.net/manual/en/language.function.html.select.date.php {html_select_date}
 *      (Smarty online manual)
 * @version 1.3.4
 * @author Andrei Zmievski
 * @author Monte Ohrt <monte at ohrt dot com>
 * @param array
 * @param Smarty
 * @return string
 */
function smarty_function_gcalfaces_select_timeview($params, &$smarty)
{
    require_once $smarty->_get_plugin_filepath('shared','escape_special_chars');
    require_once $smarty->_get_plugin_filepath('shared','make_timestamp');
    
	/* Default values. */
    $prefix          = "Date_";
    
    $horizontal_axis = "M";
    $vertical_axis   = "E";
    $groupTag		 = "";
    
    $start_year      = strftime("%Y");
    $end_year        = $start_year;
    $start_month     = strftime("%m");
    $end_month       = $start_month;
    $start_day       = strftime("%d");
    $end_day         = $start_day;
    
    $month_format    = "%B";
    $month_value_format = "%m";
    
    $day_format      = "%02d";
    $day_value_format = "%d";
    
    
    $customClass	= "";
    $hookClass		= "";
    
    $startTime		= time();
    $endTime		= time();
    $time = time();
    $extra_attrs     = '';

    
    foreach ($params as $_key=>$_value) {
    	switch ($_key) {
            case 'prefix':
            case 'time':
            case 'horizontal_axis':
            case 'vertical_axis':
            case 'groupTag':
            case 'start_year':
            case 'end_year':
            case 'start_month':
            case 'end_month':
            case 'start_day':
            case 'end_day':
            case 'month_format':
            case 'day_format':
            case 'day_value_format': 
            case 'month_value_format':
			case 'customClass':
			case 'hookClass':
			case 'startTime':
			case 'endTime':
                $$_key = (string)$_value;
                break;

            default:
                if(!is_array($_value)) {
                    $extra_attrs .= ' '.$_key.'="'.smarty_function_escape_special_chars($_value).'"';
                } else {
                    $smarty->trigger_error("html_select_date: extra attribute '$_key' cannot be an array", E_USER_NOTICE);
                }
                break;
        }
    }

    if (preg_match('!^-\d+$!', $time)) {
        // negative timestamp, use date()
        $time = date('Y-m-d', $time);
    }
    // If $time is not in format yyyy-mm-dd
    if (preg_match('/^(\d{0,4}-\d{0,2}-\d{0,2})/', $time, $found)) {
        $time = $found[1];
    } else {
        // use smarty_make_timestamp to get an unix timestamp and
        // strftime to make yyyy-mm-dd
        $time = strftime('%Y-%m-%d', smarty_make_timestamp($time));
    }
    // Now split this in pieces, which later can be used to set the select
    $time = explode("-", $time);

    if (preg_match('!^-\d+$!', $startTime)) {
        // negative timestamp, use date()
        $startTime = date('Y-m-d', $startTime);
    }
    // If $startTime is not in format yyyy-mm-dd
    if (preg_match('/^(\d{0,4}-\d{0,2}-\d{0,2})/', $startTime, $found)) {
        $startTime = $found[1];
    } else {
        // use smarty_make_timestamp to get an unix timestamp and
        // strftime to make yyyy-mm-dd
        $startTime = strftime('%Y-%m-%d', smarty_make_timestamp($startTime));
    }
    // Now split this in pieces, which later can be used to set the select
    $startTime = explode("-", $startTime);

    if (preg_match('!^-\d+$!', $endTime)) {
        // negative timestamp, use date()
        $endTime = date('Y-m-d', $endTime);
    }
    // If $endTime is not in format yyyy-mm-dd
    if (preg_match('/^(\d{0,4}-\d{0,2}-\d{0,2})/', $endTime, $found)) {
        $endTime = $found[1];
    } else {
        // use smarty_make_timestamp to get an unix timestamp and
        // strftime to make yyyy-mm-dd
        $endTime = strftime('%Y-%m-%d', smarty_make_timestamp($endTime));
    }
    // Now split this in pieces, which later can be used to set the select
    $endTime = explode("-", $endTime);
    
    // make syntax "+N" or "-N" work with start_year and end_year
    if (preg_match('!^(\+|\-)\s*(\d+)$!', $end_year, $match)) {
        if ($match[1] == '+') {
            $end_year = strftime('%Y') + $match[2];
        } else {
            $end_year = strftime('%Y') - $match[2];
        }
    }
    if (preg_match('!^(\+|\-)\s*(\d+)$!', $start_year, $match)) {
        if ($match[1] == '+') {
            $start_year = strftime('%Y') + $match[2];
        } else {
            $start_year = strftime('%Y') - $match[2];
        }
    }
    
	if (strlen($startTime[0]) > 0) {
        if ($start_year > $startTime[0] && !isset($params['start_year'])) {
            // force start year to include given date if not explicitly set
            $start_year = $startTime[0];
        }
    }
	if (strlen($endTime[0]) > 0) {
        if($end_year < $endTime[0] && !isset($params['end_year'])) {
            // force end year to include given date if not explicitly set
            $end_year = $endTime[0];
        }
    }
    
	// make syntax "+N" or "-N" work with start_month and end_month
    if (preg_match('!^(\+|\-)\s*(\d+)$!', $end_month, $match)) {
        if ($match[1] == '+') {
            $end_month = strftime('%m') + $match[2]; //TODO: modificador mes
        } else {
            $end_month = strftime('%m') - $match[2]; //TODO: modificador mes
        }
    }
    if (preg_match('!^(\+|\-)\s*(\d+)$!', $start_month, $match)) {
        if ($match[1] == '+') {
            $start_month = strftime('%m') + $match[2];
        } else {
            $start_month = strftime('%m') - $match[2];
        }
    }

	if (strlen($startTime[1]) > 0) {
        if ($start_month > $startTime[1] && !isset($params['start_month'])) {
            // force start month to include given date if not explicitly set
            $start_month = $startTime[1];
        }
    }
	if (strlen($endTime[1]) > 0) {
        if($end_month < $endTime[1] && !isset($params['end_month'])) {
            // force end month to include given date if not explicitly set
            $end_month = $endTime[1];
        }
    }
    
	// make syntax "+N" or "-N" work with start_month and end_month
    if (preg_match('!^(\+|\-)\s*(\d+)$!', $end_day, $match)) {
        if ($match[1] == '+') {
            $end_day = strftime('%d') + $match[2]; //TODO: modificador dia
        } else {
            $end_day = strftime('%d') - $match[2]; //TODO: modificador dia
        }
    }
    if (preg_match('!^(\+|\-)\s*(\d+)$!', $start_day, $match)) {
        if ($match[1] == '+') {
            $start_day = strftime('%d') + $match[2];
        } else {
            $start_day = strftime('%d') - $match[2];
        }
    }
    
	if (strlen($startTime[2]) > 0) {
        if ($start_day > $startTime[2] && !isset($params['start_day'])) {
            // force start day to include given date if not explicitly set
            $start_day = $startTime[2];
        }
    }
	if (strlen($endTime[2]) > 0) {
        if($end_day < $endTime[2] && !isset($params['end_day'])) {
            // force end day to include given date if not explicitly set
            $end_day = $endTime[2];
        }
    }
    
    if (!in_array($horizontal_axis, array('D','S','M','E'))){
    	$horizontal_axis='M';
    }
	if (!in_array($vertical_axis, array('D','S','M','E'))){
    	$vertical_axis='E';
    }
    
    $startDate=strftime("%Y-%m-%d", mktime(0,0,0,$start_month, $start_day, $start_year));
    $endDate=strftime("%Y-%m-%d", mktime(0,0,0,$end_month, $end_day, $end_year));
    
    $html_result = '<div class="timeview horAxis-'.$horizontal_axis;
    $html_result.= ' vertAxis-'.$vertical_axis.' startDate-'.$startDate.' endDate-'.$endDate;
    if ($customClass!=''){
    	$html_result.= ' customClass-'.$customClass;
    }
	if ($hookClass!=''){
    	$html_result.= ' hookClass-'.$hookClass;
    }
	if ($groupTag!=''){
    	$html_result.= ' groupTag-'.$groupTag;
    }
    $html_result.= '"></div>';

    return $html_result;
}

?>
