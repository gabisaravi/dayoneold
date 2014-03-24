<!--Wrapper HomeServices Block Start Here-->
 
<?php
echo $this->element("breadcrame",array('breadcrumbs'=>
	array(__("Whiteboard")=>__("Whiteboard")))
	);?>
 <script src="<?php echo $this->webroot?>croogo/js/countdown.js" type="text/javascript"></script>

 <style>
#realtime,#realtime2 {color: #F38918;
    font-family: arial;
    font-size: 40px;
    font-weight: bold;
    margin-bottom: 10px;
    padding: 5px 0;
    text-align: center;
}
 </style>
 
<!--Wrapper main-content Block Start Here-->
<div id="main-content">
  <div class="container">
    <div class="row-fluid">
      <div class="span12">
        
      </div>
    </div>
    <div class="row-fluid">
	
	  <?php echo $this->Element("myaccountleft") ?> 
      <div class="span9">
      
      <div class="StaticPageRight-Block">
      <div class="PageLeft-Block">
        
        <div class="Lesson-row active">
         <div class="row-fluid">
		 
        	 <?php
			 $remainingduration = 	$lesson['Lesson']['remainingduration'];
			 $twiddlaid = $lesson['Lesson']['twiddlameetingid'];
		  $timeduration = $lesson['Lesson']['duration'] * 60 * 60;
			  $timeduration = $timeduration - $remainingduration; ?>
			  
			  
<div style="margin:0px; padding:0px;">			          
<script type="application/javascript">
var remainingtime = <?php echo $timeduration?>;

var timer = "";
 $(document).ready (function () {
    startCount();
});
 
function startCount()
{
	timer = setInterval(count,1000);
	
}
function exitLesson(roletype){
	 
	updatetime = 0;
 
 
if(roletype==4){	 
 var r = window.confirm("Lesson duration complete. Please Make payment");
 if(r){
	 jQuery.post(Croogo.basePath+"users/updateremaining/?time=1&lessonid=<?php echo $lesson['Lesson']['id']?>&roletype="+roletype+"&completelesson=1",function(e,v){ 
		clearInterval(timer);
		jQuery("#exitlesson").attr('disabled','disabled');
			location.href= (Croogo.basePath+'users/paymentmade/?tutor=<?php echo $lesson['Lesson']['created']?>&lessonid=<?php echo $lesson['Lesson']['id']?>');
			return false;
		})
 }
 
 }if(roletype==2){	
	jQuery.post(Croogo.basePath+"users/updateremaining/?time=1&lessonid=<?php echo $lesson['Lesson']['id']?>&roletype="+roletype+"&completelesson=1",function(e,v){ 
		var donetime = eval('('+e+')') 
		clearInterval(timer);
		jQuery("#exitlesson").attr('disabled','disabled');
		return false;
	})
	
 }
		
	 
}
function count()
{

if( $("#realtime").text()== $("#max").text()){
	clearInterval(timer);
	return false;
}
	var time_shown = $("#realtime").text();
        var time_chunks = time_shown.split(":");
        var hour, mins, secs,updatetime;
 
        hour=Number(time_chunks[0]);
        mins=Number(time_chunks[1]);
        secs=Number(time_chunks[2]);
		updatetime=Number(time_chunks[2]);
        secs++;
		updatetime++; 
            if (secs==60){
                secs = 0;
                mins=mins + 1;
               } 
              if (mins==60){
                mins=0;
                hour=hour + 1;
              }
              if (hour==13){
                hour=1;
              }
	  
 if(updatetime%60==0){
	console.log("update");
	updatetime = 0;
	jQuery.post(Croogo.basePath+"users/updateremaining/?time=1&lessonid=<?php echo $lesson['Lesson']['id']?>&roletype=<?php echo $this->Session->read('Auth.User.role_id')?>",function(e,v){  
		var donetime = eval('('+e+')')  
		if(donetime.lessonResponse.LessonPayment.lesson_complete_student==1){
			var roltype = '<?php echo $this->Session->read('Auth.User.role_id')?>';
			if(roltype==4){
			alert("Tutor finish lesson. Now you redirect on the payment page to make payment")
			location.href= (Croogo.basePath+'users/paymentmade/?tutor=<?php echo $lesson['Lesson']['created']?>&lessonid=<?php echo $lesson['Lesson']['id']?>');
			 }
			clearInterval(timer);
			return false;
		}
		
	})
 }
 
        $("#realtime").text(plz(hour) +":" + plz(mins) + ":" + plz(secs));
 
}
 
function plz(digit){
 
    var zpad = digit + '';
    if (digit < 10) {
        zpad = "0" + zpad;
    }
    return zpad;
} 
							
							</script>
</div>			  
			  <div>
	<?php 
function secondsToTime($seconds)
{
    // extract hours
    $hours = floor($seconds / (60 * 60));
 
    // extract minutes
    $divisor_for_minutes = $seconds % (60 * 60);
    $minutes = floor($divisor_for_minutes / 60);
 
    // extract the remaining seconds
    $divisor_for_seconds = $divisor_for_minutes % 60;
    $seconds = ceil($divisor_for_seconds);
 
    // return the final array
    $obj = array(
        "h" => (int) $hours,
        "m" => (int) $minutes,
        "s" => (int) $seconds,
    );
    return $obj;
}	
	$usetime = "00:00:00";
	if($this->Session->read('Auth.User.role_id')==4){ 	
	$usetime =  secondsToTime($lesson['Lesson']['student_lessontaekn_time']);	
	 $usetime = $usetime['h'].":".$usetime['m'].":".$usetime['s'];
	}else{
	$usetime =  secondsToTime($lesson['Lesson']['remainingduration']);	
		if($usetime['h']==0){
			$usetime['h'] = "0".$usetime['h'];
		}else{
			if(strlen($usetime['h'])==1){
				$usetime['h'] = "0".$usetime['h'];
			}
		}if($usetime['m']==0){
			$usetime['m'] = "0".$usetime['m'];
		}else{
			if(strlen($usetime['m'])==1){
				$usetime['m'] = "0".$usetime['m'];
			}
		}if($usetime['s']==0){
			$usetime['s'] = "0".$usetime['s'];
		}else{
			if(strlen($usetime['s'])==1){
				$usetime['s'] = "0".$usetime['s'];
			}
		}
	$usetime = $usetime['h'].":".$usetime['m'].":".$usetime['s'];
	}
	 $disbled = "";
	 $showtimerId = "realtime";
	 if(!empty($lessonPayment)){
		 if($lessonPayment['LessonPayment']['lesson_complete_student']==1){
			$disbled = "disabled='disabled'";
			$showtimerId = "realtime2";
		 }
	 }
	 
		?>
			  <div id="<?php echo $showtimerId?>"><?php echo $usetime?></div> <!--<img src="<?php //echo $this->webroot?>croogo/images/timer.jpg" />--></div>
			  	<input type="hidden" name="roletype" id="roletype" value="<?php echo $this->Session->read('Auth.User.role_id')?>" />
			 <?php if($timeduration <= 0 ){ ?>
				<form method="get" action="<?php echo $this->webroot?>users/paymentmade/?tutor=<?php echo $lesson['Lesson']['created']?>&lessonid=<?php echo $lesson['Lesson']['id']?>">
					<input type="hidden" name="tutor" value="<?php echo $lesson['Lesson']['created']?>" />
				
					<input type="hidden" name="lessonid" value="<?php echo $lesson['Lesson']['id']?>" />
					<button type="submit">Make Payment</button>
				</form>
			  <?php }else{
			  if($this->Session->read('Auth.User.role_id')==4){ ?>
				 <iframe src="http://www.twiddla.com/api/start.aspx?sessionid=<?php echo $twiddlaid?>&autostart=1" frameborder="0" width="787" height="600" style="border:solid 1px #555;"></iframe> 
			 <?php } else {?>
				 <iframe src="http://www.twiddla.com/api/start.aspx?sessionid=<?php echo $twiddlaid?>&guestname=deep&autostart=1" frameborder="0" width="787" height="600" style="border:solid 1px #555;"></iframe> 
			 <?php }
			}?>
			<input type="button" value="Exit / Complete Lesson" class="btn btn-primary" id="exitlesson" onclick="exitLesson('<?php echo $this->Session->read('Auth.User.role_id')?>')" <?php echo $disbled?>/>
			 
            </div>
            </div>
        

        
       </div>
        
      
      </div>
      </div>
    </div>
    <!-- @end .row --> 
    


    
    
    
  </div>
  <!-- @end .container --> 
</div>
<!--Wrapper main-content Block End Here--> 