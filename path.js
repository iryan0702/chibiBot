//path class
//this class should be the main manager of all points that would be drawn
//each instance of Path can have points added to it, drawing mode configured, smudged, smoothed, and drawn given a ctx object
//
const{Util} = require("./util.js") 
var util = new Util()

class Path{
    points = [] //private path variable to store path
    circular = false

    constructor(strokeStyle = "#000000", fillStyle="none"){
        this.strokeStyle = strokeStyle
        this.fillStyle = fillStyle
    } //empty constructor

    // add point functions: option to use x,y coordinates or use [x,y] array
    addPoint(x, y){
        if(isNaN(x) || isNaN(y)){
            throw "new point must use numeric x and y values!"
        }
        this.points.push([x,y])
    }

    addPoint(pointArray){
        if(!Array.isArray(pointArray) || pointArray.length != 2 || isNaN(pointArray[0]) || isNaN(pointArray[1])){
            throw "new point must be a validly formed array! [xValue, yValue]"
        }
        this.points.push(pointArray)
    }

    //add all the points of a different path to this one (not thouroughly tested btw)
    addPath(path){
        path.points.forEach(point => {
            this.points.push(point)
        });
    }

    addPathBefore(path){
        path.points.reverse().forEach(point => {
            this.points.unshift(point)
        });
    }

    setStrokeStyle(strokeStyle){
        this.strokeStyle = strokeStyle
    }

    setFillStyle(fillStyle){
        this.fillStyle = fillStyle
    }

    // smudge all points in an area
    // smudgeX and smudgeY intensify smudging at a linear rate with distance to center of smudge array
    // if draw ctx is specified, a circle indicating the smudge area is create for debug
    smudgeArea(centerX, centerY, radiusX, radiusY, smudgeX, smudgeY, ctx = null){
        let dirX = smudgeX/Math.abs(smudgeX)
        let dirY = smudgeY/Math.abs(smudgeY)
    
        if(isNaN(dirX)) dirX = 1;
        if(isNaN(dirY)) dirY = 1;
    
        let magX = smudgeX*dirX
        let magY = smudgeY*dirY
        
        this.points.forEach(point => {
            let x2 = Math.pow(point[0] - centerX, 2)
            let y2 = Math.pow(point[1] - centerY, 2)
            let rx2 = Math.pow(radiusX, 2)
            let ry2 = Math.pow(radiusY, 2)
            let ratio = x2/rx2 + y2/ry2
    
            if(ratio < 1){ // previously scaled improperly with size, numbers now are relative to the testing scale
                point[0] = point[0] + Math.pow((1-ratio)*220*magX, 1.5)*dirX*radiusX/220
                point[1] = point[1] + Math.pow((1-ratio)*200*magY, 1.5)*dirY*radiusY/200
            }
        })
    
        if(ctx != null){ //debug: shows the smudge elipse
            let prevFillStyle = ctx.fillStyle
            ctx.fillStyle = "rgba(0, 0, 0, 0.03)";
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 360*radian)
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = prevFillStyle;
        }
    }
    
    //introduce random jitter with specified xVar and yVar as max varied distance
    addNoise(xVar, yVar){
        this.points.forEach(point => {
            util.varyPoint(point, xVar, yVar)
        })
    }

    // explicitly mark shape as circular
    makeCircular(){
        this.circular = true
    }
    // make each point the average of the previous, current, and next point (first and last point unmoved)
    // if the path is marked circular, the first and last point is also averaged accordingly
    smoothPoints(circularSmooth = false){
        let circular = this.circular || circularSmooth
        let prev = this.points[0]
        for(let i = 1; i < this.points.length-1; i++){
            let tempCur = [this.points[i][0],this.points[i][1]]
            let next = this.points[i+1]
            this.points[i][0] = (prev[0] + tempCur[0] + next[0])/3
            this.points[i][1] = (prev[1] + tempCur[1] + next[1])/3
            prev = tempCur
        }

        if(circular && this.points.length > 2){
            let l = this.points.length
            let p2 = this.points[1]
            let p1 = this.points[0] //first point
            let p9 = this.points[l-1] //last point
            let p8 = this.points[l-2]
            this.points[0][0] = (p2[0] + p1[0] + p9[0])/3
            this.points[0][1] = (p2[1] + p1[1] + p9[1])/3
            this.points[l-1][0] = (p1[0] + p9[0] + p8[0])/3
            this.points[l-1][1] = (p1[1] + p9[1] + p8[1])/3
        }
    }

    // reverse the order of all the points
    reversePath(){
        let newPathPoints = []
        this.points.forEach(point => {
            newPathPoints.unshift(point)
        })
        this.points = newPathPoints
    }

    // basic draw function to draw through all points line by line (can add different types of draw later)
    draw(drawCtx, markPoints=false){
        if(this.fillStyle != "none"){
            drawCtx.moveTo(this.points[0][0], this.points[0][1])
            drawCtx.beginPath()
            drawCtx.fillStyle = this.fillStyle;
            this.points.forEach((point) => {
                drawCtx.lineTo(point[0], point[1])
            });
            drawCtx.closePath()
            drawCtx.fillStyle = this.fillStyle
            drawCtx.fill()
        }
        
        drawCtx.strokeStyle = this.strokeStyle;
        let prevPoint = this.points[0];
        this.points.forEach((point) => {
            drawCtx.beginPath()
            drawCtx.moveTo(prevPoint[0],prevPoint[1])
            drawCtx.lineCap = 'round';
            drawCtx.lineTo(point[0], point[1])
            drawCtx.stroke()
            prevPoint = point
        });

        //debug: mark every point in the path
        if(markPoints){
            let prevStyle = drawCtx.fillStyle
            this.points.forEach((point) => {
                drawCtx.fillStyle = "#FF0000";
                drawCtx.beginPath();
                drawCtx.arc(point[0], point[1], 1, 0, 2 * Math.PI, false);
                drawCtx.fill()
            });
            drawCtx.fillStyle = prevStyle
        }
    }
}

module.exports = {
    Path: Path
}