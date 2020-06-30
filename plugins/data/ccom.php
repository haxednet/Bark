<?php



ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
ini_set('max_execution_time', 0);
date_default_timezone_set('US/Eastern');
ob_implicit_flush(1);
error_reporting(E_ALL);

require_once('vendor/autoload.php');

if(!isset($_REQUEST["key"])) die("Permission denied");

$key = file_get_contents("key.txt");

if($key == $_REQUEST["key"] && $_REQUEST["key"] != "NULL"){
    file_put_contents("key.txt", "NULL");
}else{
    file_put_contents("key.txt", "NULL");
    die("Permission denied");
}

$_REQUEST["key"] = "";
$_POST["key"] = "";

$sandbox = new PHPSandbox\PHPSandbox;

$code = $_REQUEST['code'];
$input = $_REQUEST['line'];
$args = preg_split('/\s+/', $input);
$setter = $_REQUEST['adder'];
$setter_host_ = explode("@",$_REQUEST['adder'])[1];
$main_data_object = unserialize(file_get_contents("/var/node/test/node_modules/.bin/data.json"));
$prints = 0;




$sandbox->defineVar("users", json_decode($_REQUEST['users']));
$sandbox->defineVar("log", json_decode($_REQUEST['log']));
$sandbox->defineVar('channel', $_REQUEST['channel']);
$sandbox->defineVar("from", $_REQUEST["from"]);
$sandbox->defineVar("input", $_REQUEST["line"]);
$sandbox->defineVar("_input", substr($input,strlen($args[0]) + 1));
$sandbox->defineVar("args", $args);
$sandbox->defineVar("from", $_REQUEST["from"]);
$sandbox->defineVar("setter", $_REQUEST["adder"]);
$sandbox->defineVar("_REQUEST", NULL);
$sandbox->defineVar("_SERVER", NULL);
$sandbox->defineVar("_GET", NULL);
$sandbox->defineVar("_ENV", NULL);

///////////////////////////////////////

$sandbox->defineConst("channel", $_REQUEST['channel']);

/////////////////////////////////////
$sandbox->setOption('allow_functions', true);
$sandbox->setOption('allow_variables', true);
$sandbox->setOption('allow_classes', false);
$sandbox->setOption('allow_static_variables', true);
$sandbox->setOption('allow_closures', true);
$sandbox->setOption('sandbox_includes', true);
$sandbox->setOption('overwrite_defined_funcs', true);
$sandbox->setOption('allow_includes', true);
$sandbox->setOption('validate_types', false);
$sandbox->setOption('validate_constants', false);
$sandbox->setOption('time_limit', 140);
$sandbox->setOption('allow_references', false);
$sandbox->setOption('allow_casting', false);
$sandbox->setOption('allow_traits', false);
$sandbox->setOption('overwrite_sandboxed_string_funcs', true);




/////////////////////////
$sandbox->whitelistFunc('var_dump');
$sandbox->whitelistFunc('libxml_use_internal_errors');
$sandbox->whitelistFunc('explode');
$sandbox->whitelistFunc('curl_init');
$sandbox->whitelistFunc('curl_setopt');
$sandbox->whitelistFunc('curl_exec');
$sandbox->whitelistFunc('curl_close');
$sandbox->whitelistFunc('json_decode');
$sandbox->whitelistFunc('json_encode');
$sandbox->whitelistFunc('preg_replace');
$sandbox->whitelistFunc('preg_split');
$sandbox->whitelistFunc('preg_match');
$sandbox->whitelistFunc('error_reporting');
$sandbox->whitelistFunc('eval');
$sandbox->whitelistFunc('eval');
$sandbox->whitelistFunc('eval');
$sandbox->whitelistFunc('eval');
$sandbox->whitelistFunc('microtime');
$sandbox->whitelistFunc("strftime");
$sandbox->whitelistFunc("stripcslashes");
$sandbox->whitelistFunc("stripos");
$sandbox->whitelistFunc("stripslashes");
$sandbox->whitelistFunc("strip_tags");
$sandbox->whitelistFunc("stristr");
$sandbox->whitelistFunc("strlen");
$sandbox->whitelistFunc("strnatcasecmp");
$sandbox->whitelistFunc("strnatcmp");
$sandbox->whitelistFunc("strncasecmp");
$sandbox->whitelistFunc("strncmp");
$sandbox->whitelistFunc("strpbrk");
$sandbox->whitelistFunc("strpos");
$sandbox->whitelistFunc("strptime");
$sandbox->whitelistFunc("strrchr");
$sandbox->whitelistFunc("strrev");
$sandbox->whitelistFunc("strripos");
$sandbox->whitelistFunc("strrpos");
$sandbox->whitelistFunc("strspn");
$sandbox->whitelistFunc("strstr");
$sandbox->whitelistFunc("strtok");
$sandbox->whitelistFunc("strtolower");
$sandbox->whitelistFunc("strtotime");
$sandbox->whitelistFunc("strtoupper");
$sandbox->whitelistFunc("strtr");
$sandbox->whitelistFunc("strval");
$sandbox->whitelistFunc("str_getcsv");
$sandbox->whitelistFunc("str_ireplace");
$sandbox->whitelistFunc("str_pad");
$sandbox->whitelistFunc("str_repeat");
$sandbox->whitelistFunc("str_replace");
$sandbox->whitelistFunc("str_rot13");
$sandbox->whitelistFunc("str_shuffle");
$sandbox->whitelistFunc("str_split");
$sandbox->whitelistFunc("str_word_count");
$sandbox->whitelistFunc("substr");
$sandbox->whitelistFunc("substr_compare");
$sandbox->whitelistFunc("substr_count");
$sandbox->whitelistFunc("substr_replace");
$sandbox->whitelistFunc("array_change_key_case");
$sandbox->whitelistFunc("array_chunk");
$sandbox->whitelistFunc("array_combine");
$sandbox->whitelistFunc("array_count_values");
$sandbox->whitelistFunc("array_diff");
$sandbox->whitelistFunc("array_diff_assoc");
$sandbox->whitelistFunc("array_diff_key");
$sandbox->whitelistFunc("array_diff_uassoc");
$sandbox->whitelistFunc("array_diff_ukey");
$sandbox->whitelistFunc("array_fill");
$sandbox->whitelistFunc("array_fill_keys");
$sandbox->whitelistFunc("array_filter");
$sandbox->whitelistFunc("array_flip");
$sandbox->whitelistFunc("array_intersect");
$sandbox->whitelistFunc("array_intersect_assoc");
$sandbox->whitelistFunc("array_intersect_key");
$sandbox->whitelistFunc("array_intersect_uassoc");
$sandbox->whitelistFunc("array_intersect_ukey");
$sandbox->whitelistFunc("array_keys");
$sandbox->whitelistFunc("array_key_exists");
$sandbox->whitelistFunc("array_map");
$sandbox->whitelistFunc("array_merge");
$sandbox->whitelistFunc("array_merge_recursive");
$sandbox->whitelistFunc("array_multisort");
$sandbox->whitelistFunc("array_pad");
$sandbox->whitelistFunc("array_pop");
$sandbox->whitelistFunc("array_product");
$sandbox->whitelistFunc("array_push");
$sandbox->whitelistFunc("array_rand");
$sandbox->whitelistFunc("array_reduce");
$sandbox->whitelistFunc("array_replace");
$sandbox->whitelistFunc("array_replace_recursive");
$sandbox->whitelistFunc("array_reverse");
$sandbox->whitelistFunc("array_search");
$sandbox->whitelistFunc("array_shift");
$sandbox->whitelistFunc("array_slice");
$sandbox->whitelistFunc("array_splice");
$sandbox->whitelistFunc("array_sum");
$sandbox->whitelistFunc("array_udiff");
$sandbox->whitelistFunc("array_udiff_assoc");
$sandbox->whitelistFunc("array_udiff_uassoc");
$sandbox->whitelistFunc("array_uintersect");
$sandbox->whitelistFunc("array_uintersect_assoc");
$sandbox->whitelistFunc("array_uintersect_uassoc");
$sandbox->whitelistFunc("array_unique");
$sandbox->whitelistFunc("array_unshift");
$sandbox->whitelistFunc("array_values");
$sandbox->whitelistFunc("array_walk");
$sandbox->whitelistFunc("array_walk_recursive");
$sandbox->whitelistFunc("arsort");
$sandbox->whitelistFunc("asort");
$sandbox->whitelistFunc("base64_decode");
$sandbox->whitelistFunc("base64_encode");
$sandbox->whitelistFunc("chr");
$sandbox->whitelistFunc("count");
$sandbox->whitelistFunc("date");
$sandbox->whitelistFunc("echo");
$sandbox->whitelistFunc("each");
$sandbox->whitelistFunc("exit");
$sandbox->whitelistFunc("die");
$sandbox->whitelistFunc("isset");
$sandbox->whitelistFunc("is_a");
$sandbox->whitelistFunc("is_array");
$sandbox->whitelistFunc("is_bool");
$sandbox->whitelistFunc("is_callable");
$sandbox->whitelistFunc("is_dir");
$sandbox->whitelistFunc("is_double");
$sandbox->whitelistFunc("is_executable");
$sandbox->whitelistFunc("is_file");
$sandbox->whitelistFunc("is_finite");
$sandbox->whitelistFunc("is_float");
$sandbox->whitelistFunc("is_infinite");
$sandbox->whitelistFunc("is_int");
$sandbox->whitelistFunc("is_integer");
$sandbox->whitelistFunc("is_iterable");
$sandbox->whitelistFunc("is_link");
$sandbox->whitelistFunc("is_long");
$sandbox->whitelistFunc("is_nan");
$sandbox->whitelistFunc("is_null");
$sandbox->whitelistFunc("is_numeric");
$sandbox->whitelistFunc("is_object");
$sandbox->whitelistFunc("is_readable");
$sandbox->whitelistFunc("is_real");
$sandbox->whitelistFunc("is_resource");
$sandbox->whitelistFunc("is_scalar");
$sandbox->whitelistFunc("is_soap_fault");
$sandbox->whitelistFunc("is_string");
$sandbox->whitelistFunc("is_subclass_of");
$sandbox->whitelistFunc("is_uploaded_file");
$sandbox->whitelistFunc("join");
$sandbox->whitelistFunc("key");
$sandbox->whitelistFunc("krsort");
$sandbox->whitelistFunc("ksort");
$sandbox->whitelistFunc("localtime");
$sandbox->whitelistFunc("log");
$sandbox->whitelistFunc("log1p");
$sandbox->whitelistFunc("log10");
$sandbox->whitelistFunc("max");
$sandbox->whitelistFunc("md5");
$sandbox->whitelistFunc("min");
$sandbox->whitelistFunc("ord");
$sandbox->whitelistFunc("pos");
$sandbox->whitelistFunc("pi");
$sandbox->whitelistFunc("pow");
$sandbox->whitelistFunc("rand");
$sandbox->whitelistFunc("round");
$sandbox->whitelistFunc("rsort");
$sandbox->whitelistFunc("sha1");
$sandbox->whitelistFunc("sleep");
$sandbox->whitelistFunc("sort");
$sandbox->whitelistFunc("split");
$sandbox->whitelistFunc("time");
$sandbox->whitelistFunc("trim");
$sandbox->whitelistFunc("uasort");
$sandbox->whitelistFunc("uksort");
$sandbox->whitelistFunc("urldecode");
$sandbox->whitelistFunc("urlencode");
$sandbox->whitelistFunc("ceil");
$sandbox->whitelistFunc("in_array");
$sandbox->whitelistFunc("print_r");
$sandbox->whitelistFunc("sizeof");
$sandbox->whitelistFunc("file_put_contents");
$sandbox->whitelistFunc("html_entity_decode");
$sandbox->whitelistFunc("stream_context_create");
$sandbox->whitelistFunc("boolval");
$sandbox->whitelistFunc("doubleval");
$sandbox->whitelistFunc("empty");
$sandbox->whitelistFunc("floatval");
$sandbox->whitelistFunc("gettype");
$sandbox->whitelistFunc("intval");
$sandbox->whitelistFunc("is_array");
$sandbox->whitelistFunc("is_bool");
$sandbox->whitelistFunc("is_callable");
$sandbox->whitelistFunc("is_countable");
$sandbox->whitelistFunc("is_double");
$sandbox->whitelistFunc("is_float");
$sandbox->whitelistFunc("is_int");
$sandbox->whitelistFunc("is_integer");
$sandbox->whitelistFunc("is_iterable");
$sandbox->whitelistFunc("is_long");
$sandbox->whitelistFunc("is_null");
$sandbox->whitelistFunc("is_numeric");
$sandbox->whitelistFunc("is_object");
$sandbox->whitelistFunc("is_real");
$sandbox->whitelistFunc("is_resource");
$sandbox->whitelistFunc("is_scalar");
$sandbox->whitelistFunc("is_string");
$sandbox->whitelistFunc("isset");
$sandbox->whitelistFunc("strval");
$sandbox->whitelistFunc("abs");
$sandbox->whitelistFunc("acos");
$sandbox->whitelistFunc("acosh");
$sandbox->whitelistFunc("asin");
$sandbox->whitelistFunc("asinh");
$sandbox->whitelistFunc("atan2");
$sandbox->whitelistFunc("atan");
$sandbox->whitelistFunc("atanh");
$sandbox->whitelistFunc("base_convert");
$sandbox->whitelistFunc("bindec");
$sandbox->whitelistFunc("ceil");
$sandbox->whitelistFunc("cos");
$sandbox->whitelistFunc("cosh");
$sandbox->whitelistFunc("decbin");
$sandbox->whitelistFunc("dechex");
$sandbox->whitelistFunc("decoct");
$sandbox->whitelistFunc("deg2rad");
$sandbox->whitelistFunc("exp");
$sandbox->whitelistFunc("expm1");
$sandbox->whitelistFunc("floor");
$sandbox->whitelistFunc("fmod");
$sandbox->whitelistFunc("getrandmax");
$sandbox->whitelistFunc("hexdec");
$sandbox->whitelistFunc("hypot");
$sandbox->whitelistFunc("intdiv");
$sandbox->whitelistFunc("is_finite");
$sandbox->whitelistFunc("is_infinite");
$sandbox->whitelistFunc("is_nan");
$sandbox->whitelistFunc("lcg_value");
$sandbox->whitelistFunc("log10");
$sandbox->whitelistFunc("log1p");
$sandbox->whitelistFunc("log");
$sandbox->whitelistFunc("max");
$sandbox->whitelistFunc("min");
$sandbox->whitelistFunc("mt_getrandmax");
$sandbox->whitelistFunc("mt_rand");
$sandbox->whitelistFunc("mt_srand");
$sandbox->whitelistFunc("octdec");
$sandbox->whitelistFunc("pi");
$sandbox->whitelistFunc("pow");
$sandbox->whitelistFunc("rad2deg");
$sandbox->whitelistFunc("rand");
$sandbox->whitelistFunc("round");
$sandbox->whitelistFunc("sin");
$sandbox->whitelistFunc("sinh");
$sandbox->whitelistFunc("sqrt");
$sandbox->whitelistFunc("srand");
$sandbox->whitelistFunc("tan");
$sandbox->whitelistFunc("tanh");
$sandbox->whitelistFunc("date_default_timezone_set");


$sandbox->blacklistFunc("file_get_contents");


$sandbox->defineFunc("sleep", function($e){
		flush();
		ob_flush();
		ob_end_flush();
        if($e > 130) $e = 130;
		sleep($e);
		flush();
		ob_flush();
		ob_end_flush();

});

$sandbox->defineFunc("argument", function($n){
		global $args;
		if(!isset($args[$n])) return "undefined";
		return $args[$n];
});


$sandbox->defineFunc("system", function($m){
	echo explode(" ",$m)[0] . ": command not found";
});

$sandbox->defineFunc("print_a", function($m){
	echo chr(1) . "ACTION " . $m . chr(1);
});

$sandbox->defineFunc("prin_inject", function($e){
		flush();
		ob_flush();
		ob_end_flush();
		if($e == ""){
			print("null");
		}else{
			print($e);
		}
        sleep(1);
		flush();
		ob_flush();
		
});

$sandbox->defineFunc("println", function($e){
        global $prints;
		flush();
		ob_flush();
		ob_end_flush();
        if($prints > 3) return;
		if($e == ""){
			print("null");
		}else{
			print($e . "\n");
		}
		flush();
		ob_flush();
        $prints+=1;
        sleep(1);
});


$sandbox->defineFunc("echo", function($e){
		die("lol");
		flush();
		ob_flush();
		ob_end_flush();
		if($e == ""){
			print("null");
		}else{
			print($e);
		}
        sleep(1);
		flush();
		ob_flush();
		
});

$sandbox->defineFunc("wwwget", function($e){
		if(strpos($e,":2082")!==false || strpos($e,"localhost")!==false || strpos($e,"xxx.php")!==false || strpos($e,"data.json")!==false) die("<br>Error: wwwget($e): Permission denied\r\n");
		return file_get_contents($e);
});

$sandbox->defineFunc("file_get_contents", function($e,$x=null,$y=null){
		if(strpos($e,":2082")!==false || strpos($e,"xxx.php")!==false || strpos($e,"data.json")!==false) die("<br>Error: file_get_contents($e): Permission denied\r\n");
		return file_get_contents($e,$x,$y);
});

$sandbox->defineFunc("store", function($k,$e,$p=false){
		global $main_data_object;
		global $setter_host_;
		$main_data_object = unserialize(file_get_contents("/var/node/test/node_modules/.bin/data.json"));
		
		if(isset($main_data_object[$k])){
			if($main_data_object[$k][0] != "" && $main_data_object[$k][0] != $setter_host_){
				die("<br>Error: store($k): Permission denied");
			}
		}
		if($p == false){
			$main_data_object[$k] = ["",$e];
		}else{
			$main_data_object[$k] = [$setter_host_,$e];
		}
		
		if($e == NULL) unset($main_data_object[$k]);
		file_put_contents("/var/node/test/node_modules/.bin/data.json", serialize($main_data_object));
		return true;
});

$sandbox->defineFunc("get", function($e){
		global $setter_host_;
		$main_data_object = unserialize(file_get_contents("/var/node/test/node_modules/.bin/data.json"));
		if(!isset($main_data_object[$e])) return null;
		if($main_data_object[$e][0] != "" && $main_data_object[$e][0] != $setter_host_) die("<br>Error: get($e): Permission denied");
		return $main_data_object[$e][1];
});
$sandbox->defineFunc("kick", function($e,$r="bye"){
		echo "\r\n@_+kick=$e=$r\r\n";
		flush();
		ob_flush();
		ob_end_flush();
        sleep(1);
});
$sandbox->defineFunc("voice", function($e){
		echo "\r\n@_+voice=$e\r\n";
		flush();
		ob_flush();
		ob_end_flush();
        sleep(1);
});

include("error_handle.php");

ini_set("open_basedir", "/var/node/test/node_modules/.bin/:/var/www/html");
$result = $sandbox->execute($code . ";");
?>