$(function () {
    
    var change_img_time = 5000	
    var transition_speed = 300  
    var simple_slideshow = $(".selfie__container")
    var listItems = simple_slideshow.children('li')
    var listLen	= listItems.length
    var i = 0
		
    changeList = function () {
    
        listItems.eq(i).fadeOut(transition_speed, function () {
            i += 1;
            if (i === listLen) {
                i = 0;
            }
            listItems.eq(i).fadeIn(transition_speed);
        });

    };
		
    listItems.not(':first').hide();
    setInterval(changeList, change_img_time);
	
})