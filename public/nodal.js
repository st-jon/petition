$(document).ready(function() {
    $('.dark').hide()
    $('.nodal__container').hide()
    $('.nodal').hide()
    $('.confirm__text').hide()
    $('.confirm').hide()
})

$('.delete-profile').on('click', function() {
    $('.dark').show()
    $('.nodal__container').show()
    $('.nodal').show()
    $('.confirm__text').show()
    $('.confirm').show()
})