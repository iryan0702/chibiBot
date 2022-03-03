//generator class:
//This class should be responsible for all the generations of paths, from simple lines/circles, to the complex head shapes and face expressions
//The inputs to the simple generation should be simple, and inputs for the complex shapes should only require a ref object to determine the major coordinates
const path = require("./path.js")
const{Path} = require("./path.js") 
const ref = require("./ref.js")
const{Util} = require("./util.js") 
util = new Util()

//constants
radian = Math.PI / 180   // radian conversion
class Generator{
    constructor(){}

    ///////
    //simple shape path generation: "P" variants use single point arguments while the other uses x,y arguments
    ///////
    generateLineP(point1, point2){
        return this.generateLine(point1[0], point1[1], point2[0], point2[1])
    }

    generateLine(x1,y1,x2,y2, strokeStyle="#000000"){
        let facePath = new Path(strokeStyle, "none")
        let linePointCount = Math.floor(Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2))/10)+2 //15=segmet length
    
        for(let i=0; i<linePointCount;i++){
            let ratio = i/(linePointCount-1)
            facePath.addPoint([x1+(x2-x1)*ratio,y1+(y2-y1)*ratio])
        }
        return facePath
    }

    generateDotP(point, strokeStyle="#000000"){
        return this.generateCircle(point[0], point[1], 0.5, 0, strokeStyle)
    }

    generateDot(centerX, centerY, strokeStyle="#000000"){
        return this.generateCircle(centerX, centerY, 0.5, 0, strokeStyle)
    }

    generateCircleP(point, radius, protrusion=0, strokeStyle="#000000", fillStyle="none"){
        return this.generateOval(point[0], point[1], radius, radius, protrusion, strokeStyle, fillStyle)
    }
    
    generateCircle(centerX, centerY, radius, protrusion=0, strokeStyle="#000000", fillStyle="none"){
        return this.generateOval(centerX, centerY, radius, radius, protrusion, strokeStyle, fillStyle)
    }

    generateOvalP(point, radiusX, radiusY, protrusion=0, strokeStyle="#000000", fillStyle="none"){
        return this.generateOval(point[0], point[1], radiusX, radiusY, protrusion, strokeStyle, fillStyle)
    }
    
    //generate a set of points outlining a rounded square type of look
    //good protrusion for a face shape is 0.05
    generateOval(centerX, centerY, radiusX, radiusY, protrusion=0, strokeStyle="#000000", fillStyle="none"){
        let facePath = new Path(strokeStyle, fillStyle)
        let numPoints = ((radiusX+radiusY)*3.1415)/10+4
        let degreePerStep = 360/(numPoints-1)
        let dg = (numPoints-1)/8 //number of points before each diagonal is reached
        for(let i = 0; i < numPoints; i++){
            let protrude = 1 + protrusion * (Math.abs((i+dg)%(dg*2) - dg)/dg)
            let degree = i*radian*degreePerStep
            facePath.addPoint([centerX + Math.cos(degree)*radiusX*protrude, centerY + Math.sin(degree)*radiusY*protrude])
        }
        
        return facePath
    }

    generateOvalWonky(centerX, centerY, radiusX, radiusY, protrusion=0, strokeStyle="#000000", fillStyle="none"){
        let facePath = new Path(strokeStyle, fillStyle)
        let numPoints = ((radiusX+radiusY)*3.1415)/10+4
        let degreePerStep = 360/(numPoints-1)
        let dg = (numPoints-1)/14 
        for(let i = 0; i < numPoints; i++){
            let protrude = 1 + protrusion * (Math.abs((i+dg)%(dg*2) - dg)/dg)
            let degree = i*radian*degreePerStep
            facePath.addPoint([centerX + Math.cos(degree)*radiusX*protrude, centerY + Math.sin(degree)*radiusY*protrude])
        }
        
        return facePath
    }

    generatePartialOval(centerX, centerY, radiusX, radiusY, angle1, angle2, protrusion=0, strokeStyle="#000000", fillStyle="none"){
            let facePath = new Path(strokeStyle, fillStyle)
            let numPoints = ((radiusX+radiusY)*3.1415)/10+4 //num points for a full circle
            numPoints = Math.max(3, Math.floor(numPoints * (angle2-angle1)/360)) //num points for the specified arc
            let degreePerStep = (angle2-angle1)/(numPoints-1)
            let dg = (numPoints-1)/8 //number of points before each diagonal is reached
            for(let i = 0; i < numPoints; i++){
                let protrude = 1 + protrusion * (Math.abs((i+dg)%(dg*2) - dg)/dg)
                let degree = (i*degreePerStep + angle1)*radian
                facePath.addPoint([centerX + Math.cos(degree)*radiusX*protrude, centerY + Math.sin(degree)*radiusY*protrude])
            }
            
            return facePath
        }

    //generate an oval with start and end angles


    //generate a bezier curve based on 4 points
    //calculation method from https://pages.mtu.edu/~shene/COURSES/cs3621/NOTES/spline/Bezier/de-casteljau.html#:~:text=Following%20the%20construction%20of%20a,and%20finally%20add%20them%20together.
    // added arguments for hairline generation:
    //  forcePointNum forces the generated curve to have a set amount of points to decrease jitteryness when working with hairline points
    //  ratioBias should force more points to be to one side of the curve than the other: 0 = more points near ratio 0, 1 vice versa
    //  bias mode works better with more points (preferably > 10)

    generate4PointBezier(p1, p2, p3, p4, strokeStyle="#000000", forcePointNum="none", ratioBias=-1){
        console.log("bias: " + ratioBias)
        let curvePath = new Path(strokeStyle, "none")
        let curveLength = ((util.dist(p1, p2) + util.dist(p3, p2) + util.dist(p3, p4)) + (util.dist(p1, p4)))/2 //an extremely generous estimation of the curve length, actual value takes an EXTREME amount of math to calculate
        let numPoints = forcePointNum
        if(numPoints == "none"){
            numPoints = (curveLength)/10+2 //num points for a full circle
        }else if(isNaN(numPoints)){
            throw "bezier curve force point num is not a valid input!"
        }

        // regularly, the generation is linear
        let ratioPerStep = 1.0/(numPoints-1)
        let ratio

        // with bias mode, calculate itegral over a specific part of a circle 
        let biasMode = ratioBias != -1
        let totalBiasIntegral = 0
        if(biasMode){
            for(let i = 0; i < numPoints-1; i++){
                totalBiasIntegral += this.circleBiasPoint(ratioBias, i/(numPoints-2))
            }
            console.log("bias activated!")
        }
        let biasProgress = 0

        //hardcoded way cause this is too much brain for me
        for(let i = 0; i < numPoints; i++){
            if(biasMode){
                if(i > 0) biasProgress += this.circleBiasPoint(ratioBias, (i-1)/(numPoints-2))
                ratio = biasProgress/totalBiasIntegral
            }else{
                ratio = ratioPerStep*i
            }

            let p1a = util.interpolatePoint(p1,p2,ratio)
            let p2a = util.interpolatePoint(p2,p3,ratio)
            let p3a = util.interpolatePoint(p3,p4,ratio)

            let p1b = util.interpolatePoint(p1a,p2a,ratio)
            let p2b = util.interpolatePoint(p2a,p3a,ratio)

            let pFinal = util.interpolatePoint(p1b,p2b,ratio)
            curvePath.addPoint(pFinal)
        }
        return curvePath
    }
    // helper for above function
    circleBiasPoint(bias, x){
        return Math.sqrt(1-((x-bias)**2))
    }

    /////
    //complex path generations: these generations take in a Ref object to form the shapes for the chibi
    /////

    // generate head path: returns a single path of the head shape for the given ref:
    // if a ctx is provided, a debug circle is drawn where the smudge areas area
    generateHeadPath(ref, ctx=null){
        //generate base oval for head shape
        let roundedness = util.propC(0.07,0,ref.headRoundedness)
        let headPath = this.generateOval(ref.centerX, ref.centerY, ref.width, ref.height, roundedness, "#222222")//, "#faeacf")

        //generate a line to keep track of left and right head reference points
        let headLRRef = this.generateLineP(ref.HEAD_LEFT, ref.HEAD_RIGHT)

        //chin smudge params (L): Drag edges of face downwards to form a chin shape
        let centerX = ref.HEAD_LEFT[0]
        let centerY = ref.HEAD_BOTTOM[1]
        let smudgeWidth = ref.width*1.2
        let smudgeHeight = ref.height
        let smudgeX = 0
        let smudgeY = util.prop(0,0.055,ref.chinBulge)
        
        
        this.smudgeAreas([headPath, headLRRef],centerX, centerY, smudgeWidth, smudgeHeight, smudgeX, smudgeY, ctx)
        //chin smudge params (R)
        centerX = ref.HEAD_RIGHT[0]
        this.smudgeAreas([headPath, headLRRef],centerX, centerY, smudgeWidth, smudgeHeight, smudgeX, smudgeY, ctx)
        //chin smudge params (correct for egregious butt chins that may form from the previous smudges)
        centerX = ref.HEAD_CENTER[0]
        smudgeY *= 0.8
        this.smudgeAreas([headPath, headLRRef],centerX, centerY, smudgeWidth, smudgeHeight, smudgeX, smudgeY, ctx)

        //cheek smudge params: Drag the face in its direction to form a cheek bulge
        //cheek smudge is composed of a left smudge and right smudge, with a rightmost limit and leftmost limit respectively
        //smudge left
        let buldgeness = util.propC(0,-0.12,ref.cheekBulge) //smudge: range of 0-0.08, favor median 0.05
        if(buldgeness < -0.08){
            buldgeness = util.prop(0,-0.08,ref.cheekBulge)
        }
        console.log(buldgeness)
        let centerThreshold = util.prop(0.3,0.125,(ref.angleY+25)/25) //the limit changes depending on the y angle of the face
        centerX = Math.min(ref.centerX-ref.width*centerThreshold, ref.centerX-ref.width*Math.sin(ref.angleX*radian)*3)
        centerY = ref.HEAD_BOTTOM[1]
        smudgeWidth = ref.width*1.1
        smudgeHeight = ref.height*1.3
        smudgeX = buldgeness
        // console.log("anglex: " + ref.angleX)
        let dimSmudge = Math.min(1, Math.abs(ref.angleX/40)+0.75) //diminish the cheek smudge if this side is looking close to center
        if(ref.angleX < 0) dimSmudge = 0.75
        smudgeX *= dimSmudge
        smudgeY = 0
        // console.log("leftSmudge: " + dimSmudge + " , " + smudgeX)
        this.smudgeAreas([headPath, headLRRef],centerX, centerY, smudgeWidth, smudgeHeight, smudgeX, smudgeY, ctx)

        //smudge right
        centerX = Math.max(ref.centerX+ref.width*centerThreshold, ref.centerX-ref.width*Math.sin(ref.angleX*radian)*3)
        smudgeX = buldgeness
        dimSmudge = Math.min(1, Math.abs(ref.angleX/40)+0.75)
        if(ref.angleX > 0) dimSmudge = 0.75
        smudgeX *= dimSmudge*-1
        // console.log("rightSmudge: " + dimSmudge + " , " + smudgeX)
        this.smudgeAreas([headPath, headLRRef], centerX, centerY, smudgeWidth, smudgeHeight, smudgeX, smudgeY, ctx)

        return {
            headPath: headPath,
            headLRRef: headLRRef
        };
    }

    //generate hair bangs by taking random segments from the top hairline and bottom hairline
    generateHairBangs(ref, headLeftPoint, headRightPoint, ctx=null){
        //generate hairlines
        let hairlineWidthOffset = ref.width/120 * ref.angleX * -1
        let hairlineHeightOffset = (-ref.height) * (1 - (ref.angleY/-25)*0.75) * util.prop(1,1.4,ref.hairlineHeight) // first height = hairline height/forehead size
        let hairlinePointCount = Math.floor(ref.width/200*40 + ref.height/200*10)
        let hairlineBias = util.prop(0.1,0.9,(ref.angleX+20)/40) //The term "bias" is used for weighings that account for head rotation in the hairline bezier curve
        hairlineBias = Math.min(1,Math.max(0,hairlineBias))
        let topHairline = this.generate4PointBezier(headLeftPoint, [headLeftPoint[0]+hairlineWidthOffset,headLeftPoint[1]+hairlineHeightOffset], [headRightPoint[0]+hairlineWidthOffset,headRightPoint[1]+hairlineHeightOffset], ref.HEAD_RIGHT, "#00000022", hairlinePointCount, hairlineBias)
        hairlineHeightOffset += ref.height*(util.prop(0.6,0.9,ref.hairLength)) // adjust height = hair length
        let bottomHairline = this.generate4PointBezier(headLeftPoint, [headLeftPoint[0]+hairlineWidthOffset,headLeftPoint[1]+hairlineHeightOffset], [headRightPoint[0]+hairlineWidthOffset,headRightPoint[1]+hairlineHeightOffset], ref.HEAD_RIGHT, "#00000022", hairlinePointCount, hairlineBias)

        topHairline.draw(ctx, true)
        bottomHairline.draw(ctx, true)

        let bangLine = new Path("#000000")
        let totalLengthTraversed = 0
        let totalTopPoints = topHairline.points.length
        let totalBottomPoints = bottomHairline.points.length
        let prevPoint = topHairline.points[0]
        for(let i = 0; i < 3; i++){ //top hairline must be broken by an even amount of points
            let convertRange = util.propC(0,1,ref.hairSegments[i]) //rarify very short and long segments
            let p1 = Math.floor(totalTopPoints * convertRange**3)
            convertRange = util.propC(0,1,ref.hairSegments[i+1])
            let p2 = Math.floor(totalTopPoints * convertRange**3)
            // console.log("total: " + totalTopPoints + " p1: " + p1 + " p2: " + p2)
            if(totalLengthTraversed + p1 + p2 >= totalTopPoints){
                break
            }

            for(let j = totalLengthTraversed; j < totalLengthTraversed + p1; j++){
                // console.log("adding " + topHairline.points[j] + " max " + totalTopPoints + " cur " + j)
                bangLine.addPoint(topHairline.points[j])
                prevPoint = topHairline.points[j]
            }

            let pointRatio = (totalLengthTraversed+p1+p2)/totalTopPoints
            let nextBottomPoint = Math.floor(pointRatio*totalBottomPoints)
            // console.log("adding anchor " + bottomHairline.points[nextBottomPoint])
            
            let lineToCenter = this.generateLineP(prevPoint, bottomHairline.points[nextBottomPoint])
            bangLine.addPath(lineToCenter)
            prevPoint = bottomHairline.points[nextBottomPoint]

            totalLengthTraversed += p1 + p2
        }
        let lineToEnd = this.generateLineP(prevPoint, topHairline.points[totalTopPoints-1])
        bangLine.addPath(lineToEnd)
        return bangLine
    }

    // generate face paths: returns a list of paths for the face of a chibi with the specified expressions and Ref
    generateFacePaths(ref,eyeStyle=0,mouthStyle=0,accessories=[0]){
        let facePaths = []
        let RNG1 = util.propC(1.2,0.8,ref.accRand1)
        let RNG2 = util.propC(1.2,0.8,ref.accRand2)
        let RNG3 = util.propC(1.2,0.8,ref.accRand3)
        let RNG4 = util.propC(1.2,0.8,ref.accRand4)

        //Accessories generation (Under the face)
        //Expressions stuff accessory (Begins from 100)
        let expressionAcc= -1
        for (let i=0; i<accessories.length; i++){
            if (accessories[i]-100 >=0 && accessories[i]-100 <=99){
                expressionAcc = accessories[i]-100
                break
            }
            
        }
        switch(expressionAcc){ //(I used a weird format for case here to avoid scope issues + my IDE was being weird)
            case -1: //No 
            default:{
                break
            }case 0:{ //blush oval
                let expressionWidth = ref.width/7.5*RNG3
                let expressionHeight = ref.height/14.5*RNG4
                facePaths.push(this.generateOval(ref.leftEye[0]+expressionWidth/2,ref.leftEye[1]+expressionHeight/0.27,expressionWidth,expressionHeight,0.2,"#00000000","#FFCCCC55"))
                facePaths.push(this.generateOval(ref.rightEye[0]-expressionWidth/2,ref.rightEye[1]+expressionHeight/0.27,expressionWidth,expressionHeight,0.2,"#00000000","#FFCCCC55"))
                break
            }case 1:{ //Im gonna kill you
                let expressionWidth = ref.width
                let expressionHeight = ref.height/1.77
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/15,expressionWidth,expressionHeight,0,360,0.22,"#00000000","#222222BB"))
                break
            }case 2:{//eyebags
                let expressionWidth = ref.width/7.5*RNG3
                let expressionHeight = ref.height/14.5*RNG4
                facePaths.push(this.generateOval(ref.leftEye[0],ref.leftEye[1]+expressionHeight/0.47,expressionWidth,expressionHeight,0.2,"#00000000","#222222BB"))
                facePaths.push(this.generateOval(ref.rightEye[0],ref.rightEye[1]+expressionHeight/0.47,expressionWidth,expressionHeight,0.2,"#00000000","#222222BB"))
                break
            }
        }


        //Facepaint/signature accessory (Begins from 200)
        let facepaint= -1
        for (let i=0; i<accessories.length; i++){
            if (accessories[i]-200 >=0 && accessories[i]-200 <=99){
                facepaint = accessories[i]-200
                break
            }  
        }
        switch(facepaint){ //(I used a weird format for case here to avoid scope issues + my IDE was being weird)
            case -1: //No 
            default:{
                break
            }case 0:{//Rambo war paint
                let expressionWidth = ref.width/7.5*RNG3
                let expressionHeight = ref.height/22.5*RNG4
                facePaths.push(this.generateOval(ref.leftEye[0],ref.leftEye[1]+expressionHeight/0.15,expressionWidth,expressionHeight,0.2,"#00000000","#222222BB"))
                facePaths.push(this.generateOval(ref.rightEye[0],ref.rightEye[1]+expressionHeight/0.15,expressionWidth,expressionHeight,0.2,"#00000000","#222222BB"))
                facePaths.push(this.generateOval(ref.leftEye[0],ref.leftEye[1]+expressionHeight/0.1,expressionWidth,expressionHeight,0.2,"#00000000","#222222BB"))
                facePaths.push(this.generateOval(ref.rightEye[0],ref.rightEye[1]+expressionHeight/0.1,expressionWidth,expressionHeight,0.2,"#00000000","#222222BB"))
                break
            }case 1:{//Eye Scar left
                let expressionWidth = ref.width/57.5*RNG3
                let expressionHeight = ref.height/4.5*RNG4
                facePaths.push(this.generateOvalP(ref.leftEye,expressionWidth,expressionHeight,-0.02,"#660000","none"))
                break
            }case 2:{//Eye Scar right
                let expressionWidth = ref.width/57.5*RNG3
                let expressionHeight = ref.height/4.5*RNG4
                facePaths.push(this.generateOvalP(ref.rightEye,expressionWidth,expressionHeight,-0.02,"#660000","none"))
                break
            }
        }
        
        //eyebrows (Begins from 300)
        let browStyle= -1
        for (let i=0; i<accessories.length; i++){
            if (accessories[i]-300 >=0 && accessories[i]-300 <=99){
                browStyle = accessories[i]-300
                break
            }
        }
        switch(browStyle){ //(I used a weird format for case here to avoid scope issues + my IDE was being weird)
            case -1: //No eyebrow
            default:{
                break
            }
            case 0:{ //Sadd
                let lineLen = ref.width/3.5*RNG3
                let expressionLevel = ref.height/9.5
                facePaths.push(this.generateLine(ref.rightBrow[0]+lineLen/2,ref.rightBrow[1],ref.rightBrow[0]-lineLen/2,ref.rightBrow[1]+expressionLevel))
                facePaths.push(this.generateLine(ref.leftBrow[0]+lineLen/2,ref.leftBrow[1]+expressionLevel,ref.leftBrow[0]-lineLen/2,ref.leftBrow[1]))
                break
            }case 1:{ //Angy
                let lineLen = ref.width/3.5*RNG3
                let expressionLevel = ref.height/9.5
                facePaths.push(this.generateLine(ref.rightBrow[0]+lineLen/2,ref.rightBrow[1]+expressionLevel,ref.rightBrow[0]-lineLen/2,ref.rightBrow[1]))
                facePaths.push(this.generateLine(ref.leftBrow[0]+lineLen/2,ref.leftBrow[1],ref.leftBrow[0]-lineLen/2,ref.leftBrow[1]+expressionLevel))
                break
            }case 2:{ //Seriously?
                let lineLen = ref.width/3.5*RNG3
                let expressionLevel = ref.height/20
                facePaths.push(this.generateLine(ref.rightBrow[0]+lineLen/2,ref.rightBrow[1]+expressionLevel,ref.rightBrow[0]-lineLen/2,ref.rightBrow[1]+expressionLevel))
                facePaths.push(this.generateLine(ref.leftBrow[0]+lineLen/2,ref.leftBrow[1]+expressionLevel,ref.leftBrow[0]-lineLen/2,ref.leftBrow[1]+expressionLevel))
                break
            }case 3:{ //Suprised
                let lineLen = ref.width/3.5*RNG3
                let expressionLevel = -(ref.height/20)
                facePaths.push(this.generateLine(ref.rightBrow[0]+lineLen/2,ref.rightBrow[1]+expressionLevel,ref.rightBrow[0]-lineLen/2,ref.rightBrow[1]+expressionLevel))
                facePaths.push(this.generateLine(ref.leftBrow[0]+lineLen/2,ref.leftBrow[1]+expressionLevel,ref.leftBrow[0]-lineLen/2,ref.leftBrow[1]+expressionLevel))
                break
            }case 4:{ //Sass 
                let lineLen = ref.width/3.5*RNG3
                let expressionLevel = -(ref.height/10)
                facePaths.push(this.generate4PointBezier([ref.rightBrow[0]+lineLen/2,ref.rightBrow[1]],[ref.rightBrow[0],ref.rightBrow[1]+expressionLevel] ,[ref.rightBrow[0],ref.rightBrow[1]+expressionLevel] , [ref.rightBrow[0]-lineLen/2,ref.rightBrow[1]+expressionLevel]))
                facePaths.push(this.generate4PointBezier([ref.leftBrow[0]+lineLen/2,ref.leftBrow[1]],[ref.leftBrow[0],ref.leftBrow[1]+expressionLevel/2] ,[ref.leftBrow[0],ref.leftBrow[1]+expressionLevel/2] , [ref.leftBrow[0]-lineLen/2,ref.leftBrow[1]]))
                break
            }case 5:{ //Filrt
                let lineLen = ref.width/3.5*RNG3
                let expressionLevel = -(ref.height/10)
                facePaths.push(this.generate4PointBezier([ref.leftBrow[0]+lineLen/2,ref.leftBrow[1]],[ref.leftBrow[0],ref.leftBrow[1]+expressionLevel] ,[ref.leftBrow[0],ref.leftBrow[1]+expressionLevel] , [ref.leftBrow[0]-lineLen/2,ref.leftBrow[1]+expressionLevel]))
                facePaths.push(this.generate4PointBezier([ref.rightBrow[0]+lineLen/2,ref.rightBrow[1]],[ref.rightBrow[0],ref.rightBrow[1]+expressionLevel/2] ,[ref.rightBrow[0],ref.rightBrow[1]+expressionLevel/2] , [ref.rightBrow[0]-lineLen/2,ref.rightBrow[1]]))
                break
            }case 6:{ //Real Suprised
                let lineLen = ref.width/3.5*RNG3
                let expressionLevel = -(ref.height/10)
                facePaths.push(this.generate4PointBezier([ref.leftBrow[0]+lineLen/2,ref.leftBrow[1]+expressionLevel/2],[ref.leftBrow[0],ref.leftBrow[1]+expressionLevel] ,[ref.leftBrow[0],ref.leftBrow[1]+expressionLevel] , [ref.leftBrow[0]-lineLen/2,ref.leftBrow[1]+expressionLevel/2]))
                facePaths.push(this.generate4PointBezier([ref.rightBrow[0]+lineLen/2,ref.rightBrow[1]+expressionLevel/2],[ref.rightBrow[0],ref.rightBrow[1]+expressionLevel] ,[ref.rightBrow[0],ref.rightBrow[1]+expressionLevel] , [ref.rightBrow[0]-lineLen/2,ref.rightBrow[1]+expressionLevel/2]))
                break
            }
        }


        RNG1 = util.propC(1.2,0.8,ref.eyeRand1)
        RNG2 = util.propC(1.2,0.8,ref.eyeRand2)
        RNG3 = util.propC(1.2,0.8,ref.eyeRand3)
        RNG4 = util.propC(1.2,0.8,ref.eyeRand4)

        //The eye glossary!
        switch(eyeStyle){ //(I used a weird format for case here to avoid scope issues + my IDE was being weird)
            case 0:{ //Hollow Beanz
                facePaths.push(this.generateCircleP(ref.leftEye, ref.width/24))
                facePaths.push(this.generateCircleP(ref.rightEye, ref.width/24))
                break
            }case 1:{ //Smol Beanz
                facePaths.push(this.generateDotP(ref.leftEye))
                facePaths.push(this.generateDotP(ref.rightEye))
                break
            }case 2:{ //Beeg Beanz
                facePaths.push(this.generateOvalP(ref.leftEye, ref.height/12*1.3*util.propC(1.2,0.8,ref.eyeRand1), ref.height/6,0,"#222222", "#ffffff"))
                facePaths.push(this.generateOvalP(ref.rightEye, ref.height/12*1.3*util.propC(1.2,0.8,ref.eyeRand1), ref.height/6,0,"#222222", "#ffffff"))
                break
            }case 3:{ //smol Horzantal
                let lineLen = ref.width/4.6*RNG1
                facePaths.push(this.generateLine(ref.leftEye[0]+lineLen/2,ref.leftEye[1],ref.leftEye[0]-lineLen/2,ref.leftEye[1]))
                facePaths.push(this.generateLine(ref.rightEye[0]+lineLen/2,ref.rightEye[1],ref.rightEye[0]-lineLen/2,ref.rightEye[1]))
                break
            }case 4:{ //beeg horizantal
                let lineLen = ref.width/2.8*RNG1
                facePaths.push(this.generateLine(ref.leftEye[0]+lineLen/2,ref.leftEye[1],ref.leftEye[0]-lineLen/2,ref.leftEye[1]))
                facePaths.push(this.generateLine(ref.rightEye[0]+lineLen/2,ref.rightEye[1],ref.rightEye[0]-lineLen/2,ref.rightEye[1]))
                break
            }case 5:{ //smol vert
                let lineLen = ref.height/4.6*RNG1
                facePaths.push(this.generateLine(ref.leftEye[0],ref.leftEye[1]+lineLen/2,ref.leftEye[0],ref.leftEye[1]-lineLen/2))
                facePaths.push(this.generateLine(ref.rightEye[0],ref.rightEye[1]+lineLen/2,ref.rightEye[0],ref.rightEye[1]-lineLen/2))
                break
            }case 6:{ //beeg vert
                let lineLen = ref.height/3*RNG1
                facePaths.push(this.generateLine(ref.leftEye[0],ref.leftEye[1]+lineLen/2,ref.leftEye[0],ref.leftEye[1]-lineLen/2))
                facePaths.push(this.generateLine(ref.rightEye[0],ref.rightEye[1]+lineLen/2,ref.rightEye[0],ref.rightEye[1]-lineLen/2))
                break
            }case 7:{ //unimpressed double line
                let lineLen = ref.width/3.5*RNG1
                facePaths.push(this.generateLine(ref.leftEye[0]+lineLen/2,ref.leftEye[1]+12,ref.leftEye[0]-lineLen/2,ref.leftEye[1]+12))
                facePaths.push(this.generateLine(ref.rightEye[0]+lineLen/2,ref.rightEye[1]+12,ref.rightEye[0]-lineLen/2,ref.rightEye[1]+12))
                facePaths.push(this.generateLine(ref.leftEye[0]+lineLen/2,ref.leftEye[1]-12,ref.leftEye[0]-lineLen/2,ref.leftEye[1]-12))
                facePaths.push(this.generateLine(ref.rightEye[0]+lineLen/2,ref.rightEye[1]-12,ref.rightEye[0]-lineLen/2,ref.rightEye[1]-12))
                break
            }case 8:
            default:{ //YAiY
                let lineLen = ref.width/3.5*RNG1
                facePaths.push(this.generateLine(ref.rightEye[0]+lineLen/2,ref.rightEye[1],ref.rightEye[0]-lineLen/2,ref.rightEye[1]+22))
                facePaths.push(this.generateLine(ref.leftEye[0]+lineLen/2,ref.leftEye[1]+22,ref.leftEye[0]-lineLen/2,ref.leftEye[1]))
                facePaths.push(this.generateLine(ref.rightEye[0]+lineLen/2,ref.rightEye[1],ref.rightEye[0]-lineLen/2,ref.rightEye[1]-22))
                facePaths.push(this.generateLine(ref.leftEye[0]+lineLen/2,ref.leftEye[1]-22,ref.leftEye[0]-lineLen/2,ref.leftEye[1]))
                break
            }case 9:{ //unimpressed stare
                let lineLen = ref.width/3*RNG1
                let eyeVert = ref.height/4.1*RNG2
                facePaths.push(this.generatePartialOval(ref.leftEye[0],ref.leftEye[1],lineLen/2.5,eyeVert/1.5,0,180,0.2,"#000000", "#666666"))
                facePaths.push(this.generatePartialOval(ref.rightEye[0],ref.rightEye[1],lineLen/2.5,eyeVert/1.5,0,180,0.2,"#000000", "#666666"))
                facePaths.push(this.generateLine(ref.leftEye[0]+lineLen/2,ref.leftEye[1]+0,ref.leftEye[0]-lineLen/2,ref.leftEye[1]+0))
                facePaths.push(this.generateLine(ref.rightEye[0]+lineLen/2,ref.rightEye[1]+0,ref.rightEye[0]-lineLen/2,ref.rightEye[1]+0))
                break
            }case 10:{ //holding in a laugh
                let lineLen = ref.width/3.5*RNG1
                let eyeVert = ref.height/4.1*RNG2
                facePaths.push(this.generatePartialOval(ref.leftEye[0],ref.leftEye[1]+12,lineLen/2,eyeVert/1.1,180,360,0.2,"#000000", "#FFFFFF"))
                facePaths.push(this.generatePartialOval(ref.rightEye[0],ref.rightEye[1]+12,lineLen/2,eyeVert/1.1,180,360,0.2,"#000000", "#FFFFFF"))
                facePaths.push(this.generateLine(ref.leftEye[0]+lineLen/2,ref.leftEye[1]+12,ref.leftEye[0]-lineLen/2,ref.leftEye[1]+12))
                facePaths.push(this.generateLine(ref.rightEye[0]+lineLen/2,ref.rightEye[1]+12,ref.rightEye[0]-lineLen/2,ref.rightEye[1]+12))
                break
            }

            case 100:{ //Plus sign
                let lineLen = ref.width/2.8*RNG1
                facePaths.push(this.generateOval(ref.leftEye[0],ref.leftEye[1],ref.height/12*1.3*util.propC(1.2,0.8,ref.eyeRand1), ref.height/6,-1,"#222222", "#ffffff"))
                facePaths.push(this.generateOval(ref.rightEye[0],ref.rightEye[1],ref.height/12*1.3*util.propC(1.2,0.8,ref.eyeRand1), ref.height/6,-1,"#222222", "#ffffff"))
                break
            }case 101:{ //Star
                let lineLen = ref.width*RNG1
                facePaths.push(this.generateOval(ref.leftEye[0],ref.leftEye[1],ref.height/8*1.3*util.propC(1.2,0.8,ref.eyeRand1), ref.height/4,-0.5,"#222222", "#EEEE44"))
                facePaths.push(this.generateOval(ref.rightEye[0],ref.rightEye[1],ref.height/8*1.3*util.propC(1.2,0.8,ref.eyeRand1), ref.height/4,-0.5,"#222222", "#EEEE44"))
                break
            }case 102:{ //Advert vision left
                let lineLen = ref.width/3*RNG1
                let eyeVert = ref.height/4.3*RNG2
                facePaths.push(this.generateLine(ref.leftEye[0]+lineLen/2,ref.leftEye[1],ref.leftEye[0]-lineLen/2,ref.leftEye[1]))
                facePaths.push(this.generateLine(ref.rightEye[0]+lineLen/2,ref.rightEye[1],ref.rightEye[0]-lineLen/2,ref.rightEye[1]))
                facePaths.push(this.generatePartialOval(ref.leftEye[0]+lineLen/3,ref.leftEye[1],lineLen/4,eyeVert/2,0,180,0.2,"#000000", "#666666"))
                facePaths.push(this.generatePartialOval(ref.rightEye[0]+lineLen/3,ref.rightEye[1],lineLen/4,eyeVert/2,0,180,0.2,"#000000", "#666666"))
                break
            }case 103:{ //Advert vision right
                let lineLen = ref.width/3*RNG1
                let eyeVert = ref.height/4.3*RNG2
                facePaths.push(this.generateLine(ref.leftEye[0]+lineLen/2,ref.leftEye[1],ref.leftEye[0]-lineLen/2,ref.leftEye[1]))
                facePaths.push(this.generateLine(ref.rightEye[0]+lineLen/2,ref.rightEye[1],ref.rightEye[0]-lineLen/2,ref.rightEye[1]))
                facePaths.push(this.generatePartialOval(ref.leftEye[0]-lineLen/3,ref.leftEye[1],lineLen/4,eyeVert/2,0,180,0.2,"#000000", "#666666"))
                facePaths.push(this.generatePartialOval(ref.rightEye[0]-lineLen/3,ref.rightEye[1],lineLen/4,eyeVert/2,0,180,0.2,"#000000", "#666666"))
                break
            }case 104:{ //Angy Boll
                let lineLen = ref.width/3.8*RNG1
                let eyeVert = ref.height/4.3*RNG2
                facePaths.push(this.generatePartialOval(ref.leftEye[0],ref.leftEye[1],lineLen/2,eyeVert/1.1,-60,150,0.2,"#000000", "#BB5555"))
                facePaths.push(this.generatePartialOval(ref.rightEye[0],ref.rightEye[1],lineLen/2,eyeVert/1.1,30,240,0.2,"#000000", "#BB5555"))
                facePaths.push(this.generateLine(ref.leftEye[0]-lineLen/2,ref.leftEye[1]+0.2*eyeVert,ref.leftEye[0],ref.leftEye[1]-0.8*eyeVert))
                facePaths.push(this.generateLine(ref.rightEye[0]+lineLen/2,ref.rightEye[1]+0.2*eyeVert,ref.rightEye[0],ref.rightEye[1]-0.8*eyeVert))
                break
            }case 105:{ //hearts
                let lineLen = ref.width/3*RNG1
                let eyeVert = ref.height/4.3*RNG2
                facePaths.push(this.generatePartialOval(ref.leftEye[0],ref.leftEye[1]+eyeVert/3.5,lineLen/1.8,eyeVert/0.9,-30,210,-0.2,"#00000000", "#EEBBBB"))
                facePaths.push(this.generatePartialOval(ref.rightEye[0],ref.rightEye[1]+eyeVert/3.5,lineLen/1.8,eyeVert/0.9,-30,210,-0.2,"#00000000", "#EEBBBB"))
                facePaths.push(this.generatePartialOval(ref.leftEye[0],ref.leftEye[1]+eyeVert/3.5,lineLen/1.7,eyeVert/0.9,0,180,-0.2,"#000000", "#EEBBBB"))
                facePaths.push(this.generatePartialOval(ref.rightEye[0],ref.rightEye[1]+eyeVert/3.5,lineLen/1.7,eyeVert/0.9,0,180,-0.2,"#000000", "#EEBBBB"))
                facePaths.push(this.generatePartialOval(ref.leftEye[0]+lineLen/3.5,ref.leftEye[1]+eyeVert/2.5,lineLen/4,eyeVert/2,210,360,0.2,"#000000", "#EEBBBB"))
                facePaths.push(this.generatePartialOval(ref.rightEye[0]+lineLen/3.5,ref.rightEye[1]+eyeVert/2.5,lineLen/4,eyeVert/2,210,360,0.2,"#000000", "#EEBBBB"))
                facePaths.push(this.generatePartialOval(ref.leftEye[0]-lineLen/3.5,ref.leftEye[1]+eyeVert/2.5,lineLen/4,eyeVert/2,180,330,0.2,"#000000", "#EEBBBB"))
                facePaths.push(this.generatePartialOval(ref.rightEye[0]-lineLen/3.5,ref.rightEye[1]+eyeVert/2.5,lineLen/4,eyeVert/2,180,330,0.2,"#000000", "#EEBBBB"))
                break
            }case 106:{ //Bouta Cry
                facePaths.push(this.generateOvalWonky(ref.leftEye[0],ref.leftEye[1], ref.height/4, ref.height/4,-0.44,"#222222", "#BBCCFF"))
                facePaths.push(this.generateOvalWonky(ref.rightEye[0],ref.rightEye[1], ref.height/4, ref.height/4,-0.44,"#222222", "#BBCCFF"))
                break
            }
        }

        RNG1 = util.propC(1.2,0.8,ref.mouthRand1)
        RNG2 = util.propC(1.2,0.8,ref.mouthRand2)
        RNG3 = util.propC(1.2,0.8,ref.mouthRand3)
        RNG4 = util.propC(1.2,0.8,ref.mouthRand4)
    
        //The mouth glossary!
        switch(mouthStyle){
            case 0:{ //Emotionless
                let mouthWidth = ref.width/3.4*RNG1
                facePaths.push(this.generateLine(ref.mouth[0]-mouthWidth/2,ref.mouth[1],ref.mouth[0]+mouthWidth/2,ref.mouth[1]))
                break
            }case 1:{ //Angy
                let mouthWidth = ref.width/4.4*RNG1
                let angynessLevel = ref.height/7*RNG2
                facePaths.push(this.generateLine(ref.mouth[0]-mouthWidth/2,ref.mouth[1]+angynessLevel/2,ref.mouth[0],ref.mouth[1]-angynessLevel/2))
                facePaths.push(this.generateLine(ref.mouth[0]+mouthWidth/2,ref.mouth[1]+angynessLevel/2,ref.mouth[0],ref.mouth[1]-angynessLevel/2))
                break
            }case 2:{ //Angy opn
                let mouthWidth = ref.width/2.5*RNG1
                let angynessLevel = ref.height/4*RNG2
                facePaths.push(this.generateLine(ref.mouth[0]-mouthWidth/2,ref.mouth[1]+angynessLevel/2,ref.mouth[0],ref.mouth[1]-angynessLevel/2))
                facePaths.push(this.generateLine(ref.mouth[0]+mouthWidth/2,ref.mouth[1]+angynessLevel/2,ref.mouth[0],ref.mouth[1]-angynessLevel/2))
                facePaths.push(this.generateLine(ref.mouth[0]+mouthWidth/2,ref.mouth[1]+angynessLevel/2,ref.mouth[0]-mouthWidth/2,ref.mouth[1]+angynessLevel/2))
                break
            }case 3:{ //Smle
                let mouthWidth = ref.width/4.4*RNG1
                let angynessLevel = ref.height/7*RNG2
                facePaths.push(this.generateLine(ref.mouth[0]-mouthWidth/2,ref.mouth[1]-angynessLevel/2,ref.mouth[0],ref.mouth[1]+angynessLevel/2))
                facePaths.push(this.generateLine(ref.mouth[0]+mouthWidth/2,ref.mouth[1]-angynessLevel/2,ref.mouth[0],ref.mouth[1]+angynessLevel/2))
                break
            }case 4:{ //Smle opn
                let mouthWidth = ref.width/2.5*RNG1
                let angynessLevel = ref.height/4*RNG2
                facePaths.push(this.generateLine(ref.mouth[0]-mouthWidth/2,ref.mouth[1]-angynessLevel/2,ref.mouth[0],ref.mouth[1]+angynessLevel/2))
                facePaths.push(this.generateLine(ref.mouth[0]+mouthWidth/2,ref.mouth[1]-angynessLevel/2,ref.mouth[0],ref.mouth[1]+angynessLevel/2))
                facePaths.push(this.generateLine(ref.mouth[0]+mouthWidth/2,ref.mouth[1]-angynessLevel/2,ref.mouth[0]-mouthWidth/2,ref.mouth[1]-angynessLevel/2))
                break
            }case 5: //AAAAAAAaaaAAAAAAAaaaaaaAAAAA
            default:{
                let mouthWidth = ref.height/10*RNG1
                let mouthHeight = ref.height/5*RNG2
                facePaths.push(this.generateOval(ref.mouth[0],ref.mouth[1],mouthWidth,mouthHeight,0.00,"#000000","#EEBBBB"))
                break
            }case 6:{ //Smle round
                let mouthWidth = ref.width/2.5*RNG1
                let angynessLevel = ref.height/2.8*RNG2
                facePaths.push(this.generatePartialOval(ref.mouth[0],ref.mouth[1]-angynessLevel/2,mouthWidth/2,angynessLevel,0,180,0,"#000000","#EEBBBB"))
                facePaths.push(this.generateLine(ref.mouth[0]-mouthWidth/2,ref.mouth[1]-angynessLevel/2,ref.mouth[0]+mouthWidth/2,ref.mouth[1]-angynessLevel/2))
                break
            }case 7:{ //Sad round
                let mouthWidth = ref.width/2.5*RNG1
                let angynessLevel = ref.height/2.5*RNG2
                facePaths.push(this.generatePartialOval(ref.mouth[0],ref.mouth[1]+angynessLevel/2,mouthWidth/2,angynessLevel,180,360,0,"#000000","#EEBBBB"))
                facePaths.push(this.generateLine(ref.mouth[0]-mouthWidth/2,ref.mouth[1]+angynessLevel/2,ref.mouth[0]+mouthWidth/2,ref.mouth[1]+angynessLevel/2))
                break
            }case 8:{ //Very Emotionless
                let mouthWidth = ref.width/99*RNG1
                facePaths.push(this.generateLine(ref.mouth[0]-mouthWidth/2,ref.mouth[1],ref.mouth[0]+mouthWidth/2,ref.mouth[1]))
                break
            }case 9:{ //Mildly happy
                let mouthWidth = ref.width/3.4*RNG1
                let emotionLevel = ref.height/7.7*RNG2
                facePaths.push(this.generate4PointBezier([ref.mouth[0]-mouthWidth/2,ref.mouth[1]],[ref.mouth[0]-mouthWidth/4,ref.mouth[1]+emotionLevel],[ref.mouth[0]+mouthWidth/4,ref.mouth[1]+emotionLevel],[ref.mouth[0]+mouthWidth/2,ref.mouth[1]]))
                break
            }case 10:{ //Mildly unhappy
                let mouthWidth = ref.width/3.4*RNG1
                let emotionLevel = ref.height/9.7*RNG2
                facePaths.push(this.generate4PointBezier([ref.mouth[0]-mouthWidth/2,ref.mouth[1]],[ref.mouth[0]-mouthWidth/5,ref.mouth[1]-emotionLevel],[ref.mouth[0]+mouthWidth/5,ref.mouth[1]-emotionLevel],[ref.mouth[0]+mouthWidth/2,ref.mouth[1]]))
                break
            }case 11:{ //ツ
                let mouthWidth = ref.width/3.4*RNG1
                let emotionLevel = ref.height/7.7*RNG2
                facePaths.push(this.generate4PointBezier([ref.mouth[0]-mouthWidth/2,ref.mouth[1]],[ref.mouth[0]-mouthWidth/4,ref.mouth[1]+emotionLevel/2],[ref.mouth[0]+mouthWidth/4,ref.mouth[1]+emotionLevel/2],[ref.mouth[0]+mouthWidth/2,ref.mouth[1]-emotionLevel/2]))
                break
            }case 12:{ //~
                let mouthWidth = ref.width/3.4*RNG1
                let emotionLevel = ref.height/9.7*RNG2
                facePaths.push(this.generate4PointBezier([ref.mouth[0]-mouthWidth/2,ref.mouth[1]],[ref.mouth[0]-mouthWidth/5,ref.mouth[1]+emotionLevel],[ref.mouth[0]+mouthWidth/5,ref.mouth[1]-emotionLevel],[ref.mouth[0]+mouthWidth/2,ref.mouth[1]]))
                break
            }case 13:{ //micro Smle
                let mouthWidth = ref.width/4.5*RNG1
                let angynessLevel = ref.height/5.1*RNG2
                facePaths.push(this.generatePartialOval(ref.mouth[0],ref.mouth[1]-angynessLevel/2,mouthWidth/2,angynessLevel,0,180,0,"#000000","#EEBBBB"))
                facePaths.push(this.generateLine(ref.mouth[0]-mouthWidth/2,ref.mouth[1]-angynessLevel/2,ref.mouth[0]+mouthWidth/2,ref.mouth[1]-angynessLevel/2))
                break
            }case 14:{ //micro Sad 
                let mouthWidth = ref.width/4.5*RNG1
                let angynessLevel = ref.height/4.5*RNG2
                facePaths.push(this.generatePartialOval(ref.mouth[0],ref.mouth[1]+angynessLevel/2,mouthWidth/2,angynessLevel,180,360,0,"#000000","#EEBBBB"))
                facePaths.push(this.generateLine(ref.mouth[0]-mouthWidth/2,ref.mouth[1]+angynessLevel/2,ref.mouth[0]+mouthWidth/2,ref.mouth[1]+angynessLevel/2))
                break
            }


            case 100:{ //Blep Left
                let mouthWidth = ref.width/2.5*RNG1
                let angynessLevel = ref.height/5.8*RNG2
                facePaths.push(this.generatePartialOval(ref.mouth[0]-mouthWidth/4,ref.mouth[1]-angynessLevel/2,mouthWidth/4,angynessLevel,0,180,0,"#000000","#EEBBBB"))
                facePaths.push(this.generateLine(ref.mouth[0]-mouthWidth/2,ref.mouth[1]-angynessLevel/2,ref.mouth[0]+mouthWidth/2,ref.mouth[1]-angynessLevel/2))
                break
            }case 101:{ //Blep Reft
                let mouthWidth = ref.width/2.5*RNG1
                let angynessLevel = ref.height/5.8*RNG2
                facePaths.push(this.generatePartialOval(ref.mouth[0]+mouthWidth/4,ref.mouth[1]-angynessLevel/2,mouthWidth/4,angynessLevel,0,180,0,"#000000","#EEBBBB"))
                facePaths.push(this.generateLine(ref.mouth[0]-mouthWidth/2,ref.mouth[1]-angynessLevel/2,ref.mouth[0]+mouthWidth/2,ref.mouth[1]-angynessLevel/2))
                break
            }case 102:{ //Cross
                let mouthWidth = ref.width/4.5*RNG1
                let angynessLevel = ref.height/4.5*RNG2
                facePaths.push(this.generateLine(ref.mouth[0]-mouthWidth/2,ref.mouth[1]-angynessLevel/2,ref.mouth[0]+mouthWidth/2,ref.mouth[1]+angynessLevel/2))
                facePaths.push(this.generateLine(ref.mouth[0]+mouthWidth/2,ref.mouth[1]-angynessLevel/2,ref.mouth[0]-mouthWidth/2,ref.mouth[1]+angynessLevel/2))
                break
            }case 103:{ //Granny Face
                let mouthWidth = ref.width/2.5*RNG1
                let angynessLevel = ref.height/7*RNG2
                facePaths.push(this.generateLine(ref.mouth[0]-mouthWidth/2,ref.mouth[1],ref.mouth[0]+mouthWidth/2,ref.mouth[1]))
                facePaths.push(this.generateLine(ref.mouth[0]-mouthWidth/2-angynessLevel/4,ref.mouth[1]+angynessLevel/2,ref.mouth[0]-mouthWidth/2+angynessLevel/4,ref.mouth[1]-angynessLevel/2))
                facePaths.push(this.generateLine(ref.mouth[0]+mouthWidth/2+angynessLevel/4,ref.mouth[1]+angynessLevel/2,ref.mouth[0]+mouthWidth/2-angynessLevel/4,ref.mouth[1]-angynessLevel/2))
                break
            }case 104:{ //Derpy McDroll
                let mouthWidth = ref.width/4*RNG1
                let mouthHeight = ref.height/4*RNG2
                facePaths.push(this.generateOval(ref.mouth[0],ref.mouth[1],mouthWidth,mouthHeight,0.00,"#00000000","#EEBBBB"))
                facePaths.push(this.generatePartialOval(ref.mouth[0],ref.mouth[1],mouthWidth,mouthHeight,80,400,0.00,"#000000","#EEBBBB"))
                facePaths.push(this.generatePartialOval(ref.mouth[0]+mouthWidth/2,ref.mouth[1]+mouthHeight*Math.sqrt(3)/2,mouthWidth/3,mouthHeight/3,-30,150,0.00,"#000000","#EEBBBB"))
                break
            }case 105:{ //munch
                let mouthWidth = ref.width/3.4*RNG1
                let emotionLevel = ref.height/9.7*RNG2
                facePaths.push(this.generate4PointBezier([ref.mouth[0]-mouthWidth/2,ref.mouth[1]],[ref.mouth[0]-mouthWidth/5,ref.mouth[1]+emotionLevel],[ref.mouth[0]+mouthWidth/5,ref.mouth[1]-emotionLevel],[ref.mouth[0]+mouthWidth/2,ref.mouth[1]]))
                if (ref.angleX<=0)
                    facePaths.push(this.generate4PointBezier([ref.mouth[0]+mouthWidth/1.6,ref.mouth[1]-emotionLevel],
                                                             [ref.mouth[0]+mouthWidth/2,ref.mouth[1]],
                                                             [ref.mouth[0]+mouthWidth/2,ref.mouth[1]],
                                                             [ref.mouth[0]+mouthWidth/1.6,ref.mouth[1]+emotionLevel]))
                else
                    facePaths.push(this.generate4PointBezier([ref.mouth[0]+mouthWidth/1.6,ref.mouth[1]-emotionLevel],
                                                             [ref.mouth[0]+mouthWidth/2,ref.mouth[1]],
                                                             [ref.mouth[0]+mouthWidth/2,ref.mouth[1]],
                                                             [ref.mouth[0]+mouthWidth/1.6,ref.mouth[1]+emotionLevel]))
                break
            }
        }

        RNG1 = util.propC(1.2,0.8,ref.accRand1)
        RNG2 = util.propC(1.2,0.8,ref.accRand2)
        RNG3 = util.propC(1.2,0.8,ref.accRand3)
        RNG4 = util.propC(1.2,0.8,ref.accRand4)

        //hats (starts from 400)
        let hats= 0
        for (let i=0; i<accessories.length; i++){
            if (accessories[i]-400 >=0 && accessories[i]-400 <=99){
                hats = accessories[i]-400
                break
            }  
        }
        switch(hats){ //(I used a weird format for case here to avoid scope issues + my IDE was being weird)
            case -1: //No 
            default:{
                break
            }case 0:{//tophat
                let hatHeight = ref.height/1.1*RNG2
                let brimWidth = ref.width/1.2*RNG3
                let brimHeight = ref.width/3.8*RNG4
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height-hatHeight/2,brimWidth/2,hatHeight/2,-0,360,0.4,"#00000000","#444444"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height,brimWidth,brimHeight,-60,240,0,"#000000","#444444"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height-brimHeight/2.5,brimWidth/2,brimHeight/2,-0,180,0,"#000000","#444444"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height-hatHeight,brimWidth/2,brimHeight/2,-0,360,0,"#000000","#444444"))
                facePaths.push(this.generateLine(ref.centerX-brimWidth/2,ref.centerY-ref.height-brimHeight/2.5,ref.centerX-brimWidth/2,ref.centerY-ref.height-hatHeight))
                facePaths.push(this.generateLine(ref.centerX+brimWidth/2,ref.centerY-ref.height-brimHeight/2.5,ref.centerX+brimWidth/2,ref.centerY-ref.height-hatHeight))
                break
            }case 1:{//TALL tophat
                let hatHeight = ref.height/0.3*RNG2
                let brimWidth = ref.width/1.2*RNG3
                let brimHeight = ref.width/3.8*RNG4
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height-hatHeight/2,brimWidth/2,hatHeight/2,-0,360,0.4,"#00000000","#444444"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height,brimWidth,brimHeight,-60,240,0,"#000000","#444444"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height-brimHeight/2.5,brimWidth/2,brimHeight/2,-0,180,0,"#000000","#444444"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height-hatHeight,brimWidth/2,brimHeight/2,-0,360,0,"#000000","#444444"))
                facePaths.push(this.generateLine(ref.centerX-brimWidth/2,ref.centerY-ref.height-brimHeight/2.5,ref.centerX-brimWidth/2,ref.centerY-ref.height-hatHeight))
                facePaths.push(this.generateLine(ref.centerX+brimWidth/2,ref.centerY-ref.height-brimHeight/2.5,ref.centerX+brimWidth/2,ref.centerY-ref.height-hatHeight))
                break
            }case 2:{//Straw hat
                let brimWidth = ref.width/0.7*RNG3
                let brimHeight = ref.width/2.7*RNG4
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/1.5,brimWidth,brimHeight,-70,250,0,"#000000","#d1be88"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/1.3-brimHeight/2.5,brimWidth/2.4,brimHeight*1.2,180,360,0,"#000000","#d1be88"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/1.3-brimHeight/2.5,brimWidth/2.4,brimHeight/2,-0,180,0,"#AA3333","none"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/1.3-brimHeight/2.5+10,brimWidth/2.4,brimHeight/2,-0,180,0,"#AA3333","none"))
                facePaths.push(this.generate4PointBezier([ref.centerX-brimWidth/1.3,ref.centerY-ref.height/1.3-brimHeight/2.5],
                                                         [ref.centerX-brimWidth/3.4,ref.centerY-ref.height/1.3-brimHeight/2.5],
                                                         [ref.centerX-brimWidth/3.4,ref.centerY-ref.height/1.3-brimHeight/2.5],
                                                         [ref.centerX-brimWidth/1.5,ref.centerY-ref.height/1.3-brimHeight/9], "#AA3333"))
                break
            }case 3:{//Baseball cap red
                let brimWidth = ref.width/1.2*RNG3
                let brimHeight = ref.width/1.9*RNG4
                if (ref.angleX<=0)
                    facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth*1.8,brimHeight/2.5,-90,90,0.03,"#000000","#AA3333"))
                else
                    facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth*1.8,brimHeight/2.5,90,270,0.03,"#000000","#AA3333"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth,brimHeight/2.5,-0,360,0,"#00000000","#DDDDDD"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth,brimHeight,180,360,0,"#000000","#DDDDDD"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth,brimHeight/2.5,-0,180,0,"#00000000","#DDDDDD"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5+brimHeight/2.9,brimWidth/1.99,brimHeight*1.34,180,360,0,"#000000","#AA3333"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth,brimHeight/2.5,-0,180,0,"#000000","none"))
                break
            }case 4:{//Baseball cap gren
                let brimWidth = ref.width/1.2*RNG3
                let brimHeight = ref.width/1.9*RNG4
                if (ref.angleX<=0)
                    facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth*1.8,brimHeight/2.5,-90,90,0.03,"#000000","#33AA33"))
                else
                    facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth*1.8,brimHeight/2.5,90,270,0.03,"#000000","#33AA33"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth,brimHeight/2.5,-0,360,0,"#00000000","#DDDDDD"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth,brimHeight,180,360,0,"#000000","#DDDDDD"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth,brimHeight/2.5,-0,180,0,"#00000000","#DDDDDD"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5+brimHeight/2.9,brimWidth/1.99,brimHeight*1.34,180,360,0,"#000000","#33AA33"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth,brimHeight/2.5,-0,180,0,"#000000","none"))
                break
            }case 5:{//Baseball cap bleu
                let brimWidth = ref.width/1.2*RNG3
                let brimHeight = ref.width/1.9*RNG4
                if (ref.angleX<=0)
                    facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth*1.8,brimHeight/2.5,-90,90,0.03,"#000000","#3333AA"))
                else
                    facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth*1.8,brimHeight/2.5,90,270,0.03,"#000000","#3333AA"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth,brimHeight/2.5,-0,360,0,"#00000000","#DDDDDD"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth,brimHeight,180,360,0,"#000000","#DDDDDD"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth,brimHeight/2.5,-0,180,0,"#00000000","#DDDDDD"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5+brimHeight/2.9,brimWidth/1.99,brimHeight*1.34,180,360,0,"#000000","#3333AA"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth,brimHeight/2.5,-0,180,0,"#000000","none"))
                break
            }case 6:{//Baseball cap bee
                let brimWidth = ref.width/1.2*RNG3
                let brimHeight = ref.width/1.9*RNG4
                if (ref.angleX<=0)
                    facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth*1.8,brimHeight/2.5,-90,90,0.03,"#000000","#CCBB22"))
                else
                    facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth*1.8,brimHeight/2.5,90,270,0.03,"#000000","#CCBB22"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth,brimHeight/2.5,-0,360,0,"#00000000","#222222"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth,brimHeight,180,360,0,"#000000","#222222"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth,brimHeight/2.5,-0,180,0,"#00000000","#222222"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5+brimHeight/2.9,brimWidth/1.99,brimHeight*1.34,180,360,0,"#000000","#CCBB22"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth,brimHeight/2.5,-0,180,0,"#000000","none"))
                break
            }case 7:{//hardhat
                let brimWidth = ref.width/1*RNG3
                let brimHeight = ref.width/1.22*RNG4
                if (ref.angleX<=0){
                    facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth*1.3,brimHeight/2.5,-90,90,0.03,"#000000","#CCAA33"))
                }else{
                    facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth*1.3,brimHeight/2.5,90,270,0.03,"#000000","#CCAA33"))
                }
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth,brimHeight/2.5,-0,360,0,"#00000000","#CCAA33"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth,brimHeight,180,360,0,"#000000","#CCAA33"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth,brimHeight/2.5,-0,180,0,"#000000","#CCAA33"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/1.3,brimWidth*0.93,brimHeight/2.5,-0,180,0,"#000000","none"))
                if (ref.angleX<=0){
                    facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5-brimHeight/2.4,brimWidth/1.99,brimHeight/2,270,360,0,"#000000","none"))
                    facePaths.push(this.generateCircle(ref.centerX+brimWidth/2,ref.centerY-ref.height/2.5-brimHeight/2.5-brimHeight/2.4,brimWidth/5,0,"#000000","#AABBEE"))
                }else{
                    facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5-brimHeight/2.4,brimWidth/1.99,brimHeight/2,180,270,0,"#000000","none"))
                    facePaths.push(this.generateCircle(ref.centerX-brimWidth/2,ref.centerY-ref.height/2.5-brimHeight/2.5-brimHeight/2.4,brimWidth/5,0,"#000000","#AABBEE"))
                }
                break
            }case 8:{//HELIKOPTER
                let brimWidth = ref.width/1.2*RNG3
                let brimHeight = ref.width/1.9*RNG4
                if (ref.angleX<=0)
                    facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth*1.6,brimHeight/2.5,-90,90,0.03,"#000000","#3333AA"))
                else
                    facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth*1.6,brimHeight/2.5,90,270,0.03,"#000000","#3333AA"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth,brimHeight/2.5,-0,360,0,"#00000000","#33AA33"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth,brimHeight,180,360,0,"#000000","#33AA33"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth,brimHeight/2.5,-0,180,0,"#00000000","#33AA33"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth,brimHeight/2.5,-90,90,0,"#00000000","#AAAA33"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/1.5,brimWidth,brimHeight/2.5,-90,90,0,"#00000000","#AAAA33"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth,brimHeight,270,360,0,"#000000","#AAAA33"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth,brimHeight/2.5,-0,90,0,"#00000000","#AAAA33"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5+brimHeight/2.9,brimWidth/1.99,brimHeight*1.34,180,360,0,"#000000","#AA3333"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth,brimHeight/2.5,-0,180,0,"#000000","none"))
                facePaths.push(this.generateOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight*1.44,2,brimWidth/9,0,"#000000","#AABBEE"))
                facePaths.push(this.generateOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight*1.74,brimWidth/3,2,0,"#000000","#AABBEE"))
                break
            }case 9:{//Beaniee
                let brimWidth = ref.width/1*RNG3
                let brimHeight = ref.width/1.1*RNG4
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/9,brimWidth,brimHeight/4.5,-0,360,0,"#00000000","#666666"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/9,brimWidth,brimHeight,180,360,0,"#000000","#666666"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/9,brimWidth,brimHeight/4.5,-0,180,0,"#000000","#666666"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/9,brimWidth*0.15,brimHeight,185,355,0,"#000000","none"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/9,brimWidth*0.5,brimHeight,188,352,0,"#000000","none"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/9,brimWidth*0.75,brimHeight,192,348,0,"#000000","none"))
                facePaths.push(this.generatePartialOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/2.5,brimWidth*0.93,brimHeight/4.5,-0,180,0,"#000000","none"))
                facePaths.push(this.generateOval(ref.centerX,ref.centerY-ref.height/2.5-brimHeight/0.86,brimWidth/6,brimWidth/6,0,"#000000","#666666"))
                break
            }case 10:{//flower
                let brimWidth = ref.width/1*RNG3
                let brimHeight = ref.width/1.1*RNG4
                facePaths.push(this.generateOvalWonky(ref.leftEye[0],ref.leftEye[1]-ref.height/1.7, ref.height/4, ref.height/4,-0.64,"#EEEEEE", "#DDDDDD"))
                facePaths.push(this.generateOvalWonky(ref.leftEye[0],ref.leftEye[1]-ref.height/1.7, ref.height/99, ref.height/99,0,"#EEAA66", "#DDDDDD"))
            }
            
        }
        //glasses (starts from 500)
        let glasses= -1
        for (let i=0; i<accessories.length; i++){
            if (accessories[i]-500 >=0 && accessories[i]-500 <=99){
                glasses = accessories[i]-500
                break
            }  
        }
        switch(glasses){ //(I used a weird format for case here to avoid scope issues + my IDE was being weird)
            case -1: //No 
            default:{
                break
            }case 0:{//distinguised gentlemen
                let glassSize = ref.height/3.1*RNG1
                facePaths.push(this.generateCircleP(ref.leftEye,glassSize,0,"#EECC66"))
                facePaths.push(this.generateLine(ref.leftEye[0]+10+glassSize,ref.leftEye[1],ref.leftEye[0]+glassSize+10,ref.leftEye[1]+glassSize*2,"#EECC66"))
                break
            }case 1:{//Grey square glasses
                let glassSize = ref.width/3.1*RNG1
                let glassCenterPull = ref.width/17*RNG1
                facePaths.push(this.generateOval(ref.leftEye[0]-glassCenterPull,ref.leftEye[1],glassSize,glassSize*0.6,0.2,"#555555","#00226622"))
                facePaths.push(this.generateOval(ref.rightEye[0]+glassCenterPull,ref.rightEye[1],glassSize,glassSize*0.6,0.2,"#555555","#00226622"))
                facePaths.push(this.generate4PointBezier([ref.leftEye[0]-glassCenterPull-glassSize,ref.leftEye[1]],
                                                         [(ref.leftEye[0]+ref.rightEye[0])/2,ref.leftEye[1]-glassSize/3.5],
                                                         [(ref.leftEye[0]+ref.rightEye[0])/2,ref.leftEye[1]-glassSize/3.5],
                                                         [ref.rightEye[0]+glassCenterPull+glassSize,ref.rightEye[1]],"#555555"))
                break
            }case 2:{//3d glasses
                let glassSize = ref.width/2.9*RNG1
                let glassCenterPull = ref.width/17*RNG1
                facePaths.push(this.generateOval(ref.leftEye[0]-glassCenterPull,ref.leftEye[1],glassSize,glassSize*0.6,0.25,"#DDDDDD","#88000055"))
                facePaths.push(this.generateOval(ref.rightEye[0]+glassCenterPull,ref.rightEye[1],glassSize,glassSize*0.6,0.25,"#DDDDDD","#00008855"))
                facePaths.push(this.generate4PointBezier([ref.leftEye[0]-glassCenterPull-glassSize,ref.leftEye[1]],
                                                         [(ref.leftEye[0]+ref.rightEye[0])/2,ref.leftEye[1]-glassSize/3.5],
                                                         [(ref.leftEye[0]+ref.rightEye[0])/2,ref.leftEye[1]-glassSize/3.5],
                                                         [ref.rightEye[0]+glassCenterPull+glassSize,ref.rightEye[1]],"#DDDDDD"))
                break
            }case 3:{//harry potty
                let glassSize = ref.width/3.1*RNG1
                let glassCenterPull = ref.width/17*RNG1
                facePaths.push(this.generateOval(ref.leftEye[0]-glassCenterPull,ref.leftEye[1],glassSize,glassSize,0,"#111111","#44226644"))
                facePaths.push(this.generateOval(ref.rightEye[0]+glassCenterPull,ref.rightEye[1],glassSize,glassSize,0,"#111111","#44226644"))
                facePaths.push(this.generate4PointBezier([ref.leftEye[0]-glassCenterPull-glassSize,ref.leftEye[1]],
                                                         [(ref.leftEye[0]+ref.rightEye[0])/2,ref.leftEye[1]-glassSize/3.5],
                                                         [(ref.leftEye[0]+ref.rightEye[0])/2,ref.leftEye[1]-glassSize/3.5],
                                                         [ref.rightEye[0]+glassCenterPull+glassSize,ref.rightEye[1]],"#111111"))
                break
            }case 4:{//hey beter
                let glassSize = ref.width/5.1*RNG1
                let glassCenterPull = ref.width/17*RNG1
                facePaths.push(this.generateOval(ref.leftEye[0]-glassCenterPull,ref.leftEye[1],glassSize,glassSize,0,"#111111","#44226688"))
                facePaths.push(this.generateOval(ref.rightEye[0]+glassCenterPull,ref.rightEye[1],glassSize,glassSize,0,"#111111","#44226688"))
                facePaths.push(this.generate4PointBezier([ref.leftEye[0]-glassCenterPull-glassSize,ref.leftEye[1]],
                                                         [(ref.leftEye[0]+ref.rightEye[0])/2,ref.leftEye[1]-glassSize/3.5],
                                                         [(ref.leftEye[0]+ref.rightEye[0])/2,ref.leftEye[1]-glassSize/3.5],
                                                         [ref.rightEye[0]+glassCenterPull+glassSize,ref.rightEye[1]],"#111111"))
                break
            }case 5:{//red semiframe
                let glassSize = ref.width/3.1*RNG1
                let glassCenterPull = ref.width/17*RNG1
                facePaths.push(this.generatePartialOval(ref.leftEye[0]-glassCenterPull,ref.leftEye[1],glassSize,glassSize*0.6,-20,200,0,"#AA3333","#22222222"))
                facePaths.push(this.generatePartialOval(ref.rightEye[0]+glassCenterPull,ref.rightEye[1],glassSize,glassSize*0.6,-20,200,0,"#AA3333","#22222222"))
                facePaths.push(this.generate4PointBezier([ref.leftEye[0]-glassCenterPull-glassSize,ref.leftEye[1]],
                                                         [(ref.leftEye[0]+ref.rightEye[0])/2,ref.leftEye[1]-glassSize/3.5],
                                                         [(ref.leftEye[0]+ref.rightEye[0])/2,ref.leftEye[1]-glassSize/3.5],
                                                         [ref.rightEye[0]+glassCenterPull+glassSize,ref.rightEye[1]],"#AA3333"))
                break
            }case 6:{//avaitor
                let glassSize = ref.width/3.1*RNG1
                let glassCenterPull = ref.width/17*RNG1
                facePaths.push(this.generatePartialOval(ref.leftEye[0]-glassCenterPull,ref.leftEye[1],glassSize,glassSize*0.8,0,180,0,"#999999","#224444AA"))
                facePaths.push(this.generatePartialOval(ref.rightEye[0]+glassCenterPull,ref.rightEye[1],glassSize,glassSize*0.8,0,180,0,"#999999","#224444AA"))
                facePaths.push(this.generatePartialOval(ref.leftEye[0]-glassCenterPull,ref.leftEye[1],glassSize,glassSize*0.5,180,360,0.22,"#999999","#224444AA"))
                facePaths.push(this.generatePartialOval(ref.rightEye[0]+glassCenterPull,ref.rightEye[1],glassSize,glassSize*0.5,180,360,0.22,"#999999","#224444AA"))
                facePaths.push(this.generate4PointBezier([ref.leftEye[0]-glassCenterPull-glassSize,ref.leftEye[1]],
                                                         [(ref.leftEye[0]+ref.rightEye[0])/2,ref.leftEye[1]-glassSize/3.5],
                                                         [(ref.leftEye[0]+ref.rightEye[0])/2,ref.leftEye[1]-glassSize/3.5],
                                                         [ref.rightEye[0]+glassCenterPull+glassSize,ref.rightEye[1]],"#999999"))
                break
            }case 7:{//meme sunglass
                let glassSize = ref.width/3.1*RNG1
                let glassCenterPull = ref.width/17*RNG1
                facePaths.push(this.generatePartialOval(ref.leftEye[0]-glassCenterPull,ref.leftEye[1],glassSize,glassSize*0.6,0,180,0.1,"#111111","#222222DD"))
                facePaths.push(this.generatePartialOval(ref.rightEye[0]+glassCenterPull,ref.rightEye[1],glassSize,glassSize*0.6,0,180,0.1,"#111111","#222222DD"))
                facePaths.push(this.generatePartialOval(ref.leftEye[0]-glassCenterPull,ref.leftEye[1],glassSize/1.3,glassSize/1.3*0.6,15,70,0.1,"#EEEEEEDD","none"))
                facePaths.push(this.generatePartialOval(ref.rightEye[0]+glassCenterPull,ref.rightEye[1],glassSize/1.3,glassSize/1.3*0.6,15,70,0.1,"#EEEEEEDD","none"))
                facePaths.push(this.generatePartialOval(ref.leftEye[0]-glassCenterPull,ref.leftEye[1],glassSize,glassSize*0.2,180,360,0.3,"#111111","#222222DD"))
                facePaths.push(this.generatePartialOval(ref.rightEye[0]+glassCenterPull,ref.rightEye[1],glassSize,glassSize*0.2,180,360,0.3,"#111111","#222222DD"))
                facePaths.push(this.generate4PointBezier([ref.leftEye[0]-glassCenterPull-glassSize,ref.leftEye[1]],
                                                         [(ref.leftEye[0]+ref.rightEye[0])/2,ref.leftEye[1]-glassSize/3.5],
                                                         [(ref.leftEye[0]+ref.rightEye[0])/2,ref.leftEye[1]-glassSize/3.5],
                                                         [ref.rightEye[0]+glassCenterPull+glassSize,ref.rightEye[1]],"#111111"))
                break
            }case 8:{//beeg sunglass
                let glassSize = ref.width/3.1*RNG1
                let glassCenterPull = ref.width/17*RNG1
                facePaths.push(this.generatePartialOval(ref.leftEye[0]-glassCenterPull,ref.leftEye[1]-glassSize/3,glassSize,glassSize,0,180,0.12,"#111111","#222222DD"))
                facePaths.push(this.generatePartialOval(ref.rightEye[0]+glassCenterPull,ref.rightEye[1]-glassSize/3,glassSize,glassSize,0,180,0.12,"#111111","#222222DD"))
                facePaths.push(this.generatePartialOval(ref.leftEye[0]-glassCenterPull,ref.leftEye[1]-glassSize/3,glassSize/1.3,glassSize/1.3,15,70,0.12,"#EEEEEEDD","none"))
                facePaths.push(this.generatePartialOval(ref.rightEye[0]+glassCenterPull,ref.rightEye[1]-glassSize/3,glassSize/1.3,glassSize/1.3,15,70,0.12,"#EEEEEEDD","none"))
                facePaths.push(this.generatePartialOval(ref.leftEye[0]-glassCenterPull,ref.leftEye[1]-glassSize/3,glassSize,glassSize*0.2,180,360,0.3,"#111111","#222222DD"))
                facePaths.push(this.generatePartialOval(ref.rightEye[0]+glassCenterPull,ref.rightEye[1]-glassSize/3,glassSize,glassSize*0.2,180,360,0.3,"#111111","#222222DD"))
                facePaths.push(this.generate4PointBezier([ref.leftEye[0]-glassCenterPull-glassSize,ref.leftEye[1]],
                                                         [(ref.leftEye[0]+ref.rightEye[0])/2,ref.leftEye[1]-glassSize/3.5],
                                                         [(ref.leftEye[0]+ref.rightEye[0])/2,ref.leftEye[1]-glassSize/3.5],
                                                         [ref.rightEye[0]+glassCenterPull+glassSize,ref.rightEye[1]],"#111111"))
                break
            }
        }
        
        
        return facePaths
    }

    

    //smudge area of multiple paths
    //allPaths should be an array of paths
    smudgeAreas(allPaths, centerX, centerY, smudgeWidth, smudgeHeight, smudgeX, smudgeY, ctx=null){
        allPaths.forEach(path => {
            path.smudgeArea(centerX, centerY, smudgeWidth, smudgeHeight, smudgeX, smudgeY, ctx)
        });
    }
}

module.exports = {
    Generator: Generator
}