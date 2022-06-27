const hamburger = document.querySelector('.header .nav-bar .nav-list .hamburger');
const mobile_menu = document.querySelector('.header .nav-bar .nav-list ul');
const menu_item = document.querySelectorAll('.header .nav-bar .nav-list ul li a');
const header = document.querySelector('.header.container');

hamburger.addEventListener('click', () => {
	hamburger.classList.toggle('active');
	mobile_menu.classList.toggle('active');
});

document.addEventListener('scroll', () => {
	var scroll_position = window.scrollY;
	if (scroll_position > 250) {
		header.style.backgroundColor = '#29323c';
	} else {
		header.style.backgroundColor = 'transparent';
	}
});

menu_item.forEach((item) => {
	item.addEventListener('click', () => {
		hamburger.classList.toggle('active');
		mobile_menu.classList.toggle('active');
	});
});

$(document).ready(function(){
	$("#work1").mouseover(function(){
	  $("#overlay").show();
	}).mouseout(function(){
	  $("#overlay").hide();
	});
  });
  $(document).ready(function(){
	$("#work2").mouseover(function(){
	  $("#overlay2").show();
	}).mouseout(function(){
	  $("#overlay2").hide();
	});
  });
  $(document).ready(function(){
	$("#work3").mouseover(function(){
	  $("#overlay3").show();
	}).mouseout(function(){
	  $("#overlay3").hide();
	});
  });
  $(document).ready(function(){
	$("#work4").mouseover(function(){
	  $("#overlay4").show();
	}).mouseout(function(){
	  $("#overlay4").hide();
	});
  });
  
  $(document).ready(function(){
	$("#work5").mouseover(function(){
	  $("#overlay5").show();
	}).mouseout(function(){
	  $("#overlay5").hide();
	});
	$("#work6").mouseover(function(){
	  $("#overlay6").show();
	}).mouseout(function(){
	  $("#overlay6").hide();
	});
	$("#work7").mouseover(function(){
	  $("#overlay7").show();
	}).mouseout(function(){
	  $("#overlay7").hide();
	});
	$("#work8").mouseover(function(){
	  $("#overlay8").show();
	}).mouseout(function(){
	  $("#overlay8").hide();
	});
  });
  
