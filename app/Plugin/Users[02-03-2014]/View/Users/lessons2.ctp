<!--Wrapper HomeServices Block Start Here-->
<link rel="stylesheet" href="http://netdna.bootstrapcdn.com/bootstrap/3.0.3/css/bootstrap.min.css">
<?php
echo $this->element("breadcrame",array('breadcrumbs'=>
array(__("My Lesson")=>__("My Lesson")))
);
$currentdate = date('Y-m-d');
?>


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
                <?php  if($this->Session->read('Auth.User.role_id')==2){ ?>
                <!--<h2 class="page-title"><?php echo __("Lesson");?> <p class="pull-right">
                <?php
                   echo $this->Html->link(
               __('+  Add New Lesson'),	'/users/createlessons'
                ,
               array('title'=>__('+  Add New Lesson') ,'class'=>'btn btn-primary btn-primary3','style'=>'width:125px'  )
           );
                  ?>
                 </p></h2>--> <?php  } ?>
                <div class="StaticPageRight-Block">


                    <div class="PageLeft-Block">
                        <p class="FontStyle20 color1"><?php echo __("Active Lesson Proposal")?></p>

                        <?php if(!empty($activelesson)){
		foreach($activelesson as $k=>$v){ ?>
                        <div class="Lesson-row active">
                            <div class="row-fluid">
                                <div class="span1 tutorimg">
                                    <?php
		 
		 if(file_exists(WWW_ROOT . DS . 'uploads' . DS . $v['User']['id']. DS . 'profile'. DS  .$v['User']['profilepic']) && $v['User']['profilepic']!=""){ ?>
                                    <img src="<?php echo $this->webroot. 'uploads/'.$v['User']['id'].'/profile/'.$v['User']['profilepic'] ?> "
                                         class="img-circle" alt="student" width="242px" height="242px">
                                    <?php }else{		 ?>
                                    <img src="<?php echo $this->webroot?>images/thumb-typ1.png" class="img-circle"
                                         alt="student">
                                    <?php } ?> </div>
                                <div class="span2 tutor-name"><a href="#"><?php echo $v['User']['username']?></a></div>
                                <div class="span1 date"> <?php echo date('M d',strtotime($v['Lesson']['lesson_date'])) ?></div>
                                <div class="span1 time"> <?php echo date('H:m',strtotime($v['Lesson']['lesson_time'])) ?></div>
                                <div class="span1 mins"> <?php echo $v['Lesson']['duration'] ?> </div>
                                <div class="span2 subject"> <?php echo $v['Lesson']['subject'] ?>  </div>

                                <div class="span2 mark">
                                    <?php
		echo $this->Html->link(
                                    __('Change'), '/users/changelesson/'.$v['Lesson']['id']
                                    ,
                                    array('title'=>__('Change') ,'class'=>'btn btn-primary
                                    btn-primary3','style'=>'width:125px','data-toggle'=>"modal" )
                                    );
                                    ?>
                                </div>

                                <div class="span2 mark">
                                    <?php if($this->Session->read('Auth.User.role_id')==2){ ?>
                                    <?php
		echo $this->Html->link(
                                    __('Confirmed'), '/users/confirmedbytutor/'.$v['Lesson']['id']
                                    ,
                                    array('title'=>__('Confirmed') ,'class'=>'btn btn-primary
                                    btn-primary3','style'=>'width:125px' )
                                    );
                                    ?>

                                    <?php }else{
		echo $this->Html->link(
                                    __('Go To Lesson'), '/users/whiteboarddata/'.$v['Lesson']['id']
                                    ,
                                    array('title'=>__('Go To Lesson') ,'class'=>'btn btn-primary
                                    btn-primary3','style'=>'width:125px' )
                                    );
                                    }
                                    ?>
                                </div>
                            </div>
                        </div>
                        <?php }
		}
		?>


                    </div>
                    <div class="PageLeft-Block">
                        <p class="FontStyle20 color1"><?php echo __("Upcoming Lessons")?></p>
                        <?php  if(!empty($upcomminglesson)){ ?>

                        <?php
		foreach($upcomminglesson as $k=>$v){ ?>
                        <div class="Lesson-row">
                            <div class="row-fluid">
                                <div class="span1 tutorimg"><?php
		 
		 if(file_exists(WWW_ROOT . DS . 'uploads' . DS . $v['User']['id']. DS . 'profile'. DS  .$v['User']['profilepic']) && $v['User']['profilepic']!=""){ ?>
                                    <img src="<?php echo $this->webroot. 'uploads/'.$v['User']['id'].'/profile/'.$v['User']['profilepic'] ?> "
                                         class="img-circle" alt="student" width="242px" height="242px">
                                    <?php }else{		 ?>
                                    <img src="<?php echo $this->webroot?>images/thumb-typ1.png" class="img-circle"
                                         alt="student">
                                    <?php } ?> </div>
                                <div class="span2 tutor-name"><a href="#"><?php echo $v['User']['username']?></a></div>
                                <div class="span1 date"><?php echo date('M d',strtotime($v['Lesson']['lesson_date'])) ?></div>
                                <div class="span1 time"><?php echo date('H:m',strtotime($v['Lesson']['lesson_time'])) ?></div>
                                <div class="span1 mins"> <?php echo $v['Lesson']['duration'] ?> </div>
                                <div class="span2 subject"> <?php echo $v['Lesson']['subject'] ?>  </div>
                                <div class="span2 mark">  <?php /*
		echo $this->Html->link(
                                    __('Change'), '/users/changelesson/'.$v['Lesson']['id']
                                    ,
                                    array('title'=>__('Change') ,'class'=>'btn btn-primary
                                    btn-primary3','style'=>'width:125px','data-toggle'=>"modal" )
                                    );
                                    */ ?> Confirmed
                                </div>
                                <div class="span2 mark">
                                    <?php if($this->Session->read('Auth.User.role_id')==2){
                                    if($v['Lesson']['id'] == $v['Lesson']['parent_id']){
                                    $calss = "disabled='disabled'";
                                    $url = "javascript:void(0)";

                                    if($v['Lesson']['lesson_date'] == $currentdate){
                                    $calss = "";
                                    $url = $this->webroot.'users/whiteboarddata/'.$v['Lesson']['id'] ;
                                    }

                                    ?>
                                    <a href="<?php echo $url?>"
                                       class="btn btn-primary btn-primary3" <?php echo $calss; $url?>>Go To Lesson </a>
                                    <?php }else{ ?>
                                    <button class="btn btn-primary btn-primary3" type="submit">Confirmed</button>
                                    <?php
				}
				}else{ ?>
                                    <?php
		echo $this->Html->link(
                                    __('Go To Lesson'), '/users/whiteboarddata/'.$v['Lesson']['id']
                                    ,
                                    array('title'=>__('Go To Lesson') ,'class'=>'btn btn-primary
                                    btn-primary3','style'=>'width:125px' )
                                    );
                                    ?>
                                    <?php } ?>
                                </div>
                            </div>
                        </div>
                        <?php }
	
		} ?>
                    </div>
                    <div class="PageLeft-Block">
                        <p class="FontStyle20 color1"><?php echo __("Past Lessons")?></p>
                        <?php  if(!empty($pastlesson)){ ?>

                        <?php
		foreach($pastlesson as $k=>$v){ ?>
                        <div class="Lesson-row">
                            <div class="row-fluid">
                                <div class="span1 tutorimg"><?php
		 
		 if(file_exists(WWW_ROOT . DS . 'uploads' . DS . $v['User']['id']. DS . 'profile'. DS  .$v['User']['profilepic']) && $v['User']['profilepic']!=""){ ?>
                                    <img src="<?php echo $this->webroot. 'uploads/'.$v['User']['id'].'/profile/'.$v['User']['profilepic'] ?> "
                                         class="img-circle" alt="student" width="242px" height="242px">
                                    <?php }else{		 ?>
                                    <img src="<?php echo $this->webroot?>images/thumb-typ1.png" class="img-circle"
                                         alt="student">
                                    <?php } ?> </div>
                                <div class="span2 tutor-name"><a href="#"><?php echo $v['User']['username']?></a></div>
                                <div class="span1 date"><?php echo date('M d',strtotime($v['Lesson']['lesson_date'])); ?></div>
                                <div class="span1 time"><?php echo date('H:m',strtotime($v['Lesson']['lesson_time'])); ?></div>
                                <div class="span1 mins"> <?php echo $v['Lesson']['duration'] ?> </div>
                                <div class="span2 subject"> <?php echo $v['Lesson']['subject'] ?>  </div>
                                <div class="span2 mark lessonrating"> <?php
				
				$reviws = $this->User->checkReviews($v['Lesson']['id'],$v['Lesson']['created'],$v['Lesson']['tutor']);
                                    if(empty($reviws)){
                                    if($this->Session->read('Auth.User.role_id')==4){
                                    echo $this->Html->link(
                                    __('Reviews'), '/users/lessonreviews/'.$v['Lesson']['id']
                                    ,
                                    array('title'=>__('Reviews') ,'class'=>'btn btn-primary btn-primary3
                                    reviews','style'=>'width:125px','data-toggle'=>"modal" ) );
                                    }
                                    } else {
                                    ?>
                                    <p>Rating: <input type="number" name="your_awesome_parameter"
                                                      id="<?php echo $v['Lesson']['id'] ?>"
                                                      value="<?php echo $reviws['Review']['rating'] ?>" class="rating"/>
                                    </p>
                                    <?php } ?>
                                </div>

                                <div class="span2 mark">
                                    <button class="btn btn-primary btn-primary3" type="submit">Go To Lesson</button>
                                </div>
                            </div>
                        </div>
                        <?php }
		} ?>


                    </div>

                </div>
            </div>
        </div>
        <!-- @end .row -->


    </div>
    <!-- @end .container -->
</div>
<!--Wrapper main-content Block End Here-->
<div class="modal" id="myModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true"
     style="left:40%; width:auto; right:20%; height:320px; overflow:hidden; top:25%"></div>
<?php
echo $this->Html->script(array(
'/croogo/js/bootstrap-rating-input.min',
));
?>


<script type="text/javascript">
    jQuery(document).ready(function () {

    })
    function updateRating() {
        jQuery('.lessonratingdata').find('span').click(function (e) {
            console.log(jQuery('.lessonratingdata').find('input').attr('id'));
            console.log(jQuery(this).attr('data-value'));
        })
    }
    jQuery('[data-toggle="modal"]').click(function (e) {
        e.preventDefault();

        var currentclass = jQuery(this).hasClass('reviews')
        var url = jQuery(this).attr('href');
        jQuery.get(url, function (data) {
            // jQuery(data).modal();
            jQuery('body').append('<div class="modal-backdrop in"></div>')
            jQuery("#myModal").html(data).css({'display': 'block', 'height': 'auto', 'top': '25%', 'position': 'absolute'});
            console.log(jQuery('#myModal').outerHeight())
            jQuery('#myModal').css('height', jQuery('#myModal').outerHeight() + 120)
            if (currentclass) {
                callRate();
                updateRating();
            }
            // jQuery(".modal-backdrop").not(':first').remove();

        });
    });
    function removebackground() {
        jQuery(".modal-backdrop").remove();
        jQuery("#myModal").html('').css('display', 'none');
    }

</script>