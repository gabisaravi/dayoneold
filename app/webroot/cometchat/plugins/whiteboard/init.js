<?php
include dirname(__FILE__).DIRECTORY_SEPARATOR."config.php";
include dirname(__FILE__).DIRECTORY_SEPARATOR."lang".DIRECTORY_SEPARATOR."en.php";

if (file_exists(dirname(__FILE__).DIRECTORY_SEPARATOR."lang".DIRECTORY_SEPARATOR.$lang.".php")) {
    include dirname(__FILE__).DIRECTORY_SEPARATOR."lang".DIRECTORY_SEPARATOR.$lang.".php";
    }

foreach ($whiteboard_language as $i => $l) {
    $whiteboard_language[$i] = str_replace("'", "\'", $l);
    }
?>

/*
* CometChat
* Copyright (c) 2012 Inscripts - support@cometchat.com | http://www.cometchat.com | http://www.inscripts.com
*/

(function($){

    $.ccwhiteboard = (function () {

        var title = '<?php echo $whiteboard_language[0];?>';
        var lastcall = 0;
        var height = <?php echo $whitebHeight;?>;
        var width =
            <?php echo $whitebWidth;?>;

            return {

                getTitle: function() {
                return title;
                },

init: function (id) {
    var currenttime = new Date();
    currenttime = parseInt(currenttime.getTime()/1000);
    if (currenttime-lastcall > 10) {
    baseUrl = $.cometchat.getBaseUrl();
    baseData = $.cometchat.getBaseData();

    var random = currenttime;
    $.getJSON(baseUrl+'plugins/whiteboard/index.php?action=request&callback=?', {to: id, id: random, basedata: baseData});
lastcall = currenttime;

loadCCPopup(baseUrl+'plugins/whiteboard/index.php?action=whiteboard&id='+id+'&basedata='+baseData, 'whiteboard',"status=0,toolbar=0,menubar=0,directories=0,resizable=1,location=0,status=0,scrollbars=0, width="+width+",height="+height,width,height-50,'<?php echo $whiteboard_language[9];?>');

} else {
    alert('<?php echo $whiteboard_language[1];?>');
    }
},

accept: function (id,random) {
    baseUrl = $.cometchat.getBaseUrl();
    baseData = $.cometchat.getBaseData();

    $.getJSON(baseUrl+'plugins/whiteboard/index.php?action=accept&callback=?', {to: id, basedata: baseData});
loadCCPopup(baseUrl+'plugins/whiteboard/index.php?action=whiteboard&id='+id+'&basedata='+baseData, 'whiteboard',"status=0,toolbar=0,menubar=0,directories=0,resizable=1,location=0,status=0,scrollbars=0, width="+width+",height="+height,width,height-50,'<?php echo $whiteboard_language[9];?>');
}
};
})();

})(jqcc);