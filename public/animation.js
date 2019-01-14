$(document).ready(function() {
    $('#animation1').removeClass('ufo')
    $('#animation2').removeClass('selfie-guy')
    $('#animation3').hide().removeClass('explosion1')
    $('#animation4').hide().removeClass('explosion2')
    $('#animation5').hide().removeClass('rest')
    $('#animation7').hide().removeClass('laser')
    $('#animation8').hide()
})

$('.logo').on('click', function() {
    $('#animation1').addClass('ufo')
    $('#animation2').addClass('selfie-guy')
    $('#animation3').show().addClass('explosion1')
    $('#animation4').show().addClass('explosion2')
    $('#animation5').show().addClass('rest')
    $('#animation7').show().addClass('laser')
    $('#animation6').removeClass('flash')
})

$(document).on('animationend', function() {
    $('#animation8').show()
})