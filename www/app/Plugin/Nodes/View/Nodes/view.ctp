<?php 

echo $this->element("breadcrame",array('breadcrumbs'=>
	array($node['Node']['title']=>$node['Node']['title']))
	) 
?>
<div id="main-content">
  <div class="container">
		 <div class="row-fluid">
      <div class="span12">
        
      </div>
    </div>
				 	 
    						<div class="row-fluid">
   <div class="row-fluid">
<?php include('leftpanel.ctp') ?> 
<?php $this->Nodes->set($node); ?>
 
	<?php
		 
		echo $this->Nodes->body();
		 
 ?>

 </div>
 </div>
				   	<?php  	echo $this->element('getintouch'); ?>
				   		 
    <!-- @end .row --> 
    
  </div>
  <!-- @end .container --> 
</div>
