var canvas = $('.canvas')[0]

var styletDown = false

var stylet = {
    prevX: 0,
    prevY: 0,
    currX: 0,
    currY: 0
}

function draw() {
    ctx = canvas.getContext("2d")
    ctx.beginPath()
    ctx.moveTo(stylet.prevX, stylet.prevY)
    ctx.lineTo(stylet.currX, stylet.currY)
    ctx.strokeStyle = "black"
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.closePath()
}

function updateStyletPosition(e) {
    stylet = {
        prevX: stylet.currX,
        prevY: stylet.currY,
        currX: e.offsetX,
        currY: e.offsetY
    }
}

$('.canvas').on('mousedown', function(e){
    styletDown = true
    updateStyletPosition(e)
})

$('.canvas').on('mouseup', function(){
    styletDown = false
    $('.signature').attr("value", $('.canvas')[0].toDataURL())
})

$('.canvas').on('mousemove', function(e) {
    updateStyletPosition(e)
    if(styletDown) {
        draw()
    }
})

