(function () {
    
    var delay = 5000	
    var transition = 300  
    var slideshow = $(".selfie__container")
    var listItems = slideshow.children('li')
    var listLen	= listItems.length
    var i = 0
		
    changeList = function () {
        listItems.eq(i).fadeOut(transition, function () {
            i += 1
            if (i === listLen) {
                i = 0
            }
            listItems.eq(i).fadeIn(transition)
        })
    }
		
    listItems.not(':first').hide()
    setInterval(changeList, delay)

    $('li').on('click', function() {
        listItems.not(':first').hide()
        changeList()
    })
	
})()
