//ref class:
//this class holds all the metadata regarding the coordinates related to a head's shape
//all constant factors of a chibi's head should be put here (+ rotation etc)
const{Util} = require("./util.js") 

class Ref{
    constructor(cX=1000, cY=1000, baseSeed= Math.floor(Math.random()*1000000), ctx=null){

        //utilities
        this.ctx = ctx
        this.util = new Util(ctx)
        this.baseSeed = baseSeed

        // list of available options [101 - angry shadow temporarily disabled for later layering fixes]
        this.allAccessories = [100,102,200,201,202,300,301,302,303,304,305,306,400,401,402,403,404,405,406,407,408,409,410,500,501,502,503,504,505,506,507,508] 
        this.allEyes = [0,1,2,3,4,5,6,7,8,9,10,100,101,102,103,104,105,106]
        this.allMouths = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,100,101,102,103,104,105]

        //basic stats
        this.centerX = cX
        this.centerY = cY

        this.setAllSeededValues(this.baseSeed)
    }

    setAllSeededValues(seed){
        this.baseSeed = seed
        this.util = new Util(this.ctx)
        this.util.seed("" + this.baseSeed)
        this.widthScale = this.util.prop(0.8,1.75,this.util.seededRand())

        this.angleX = Math.floor(this.util.prop(-20,20.9999,this.util.seededRand())) 
        this.angleY = Math.floor(this.util.prop(-25,-5.0001,this.util.seededRand())) 

        this.updateScale(this.util.prop(100,360,this.util.seededRand()))

        this.hairColor = this.rgbToHex(Math.floor(this.util.prop(0,255.999,this.util.seededRand())),Math.floor(this.util.prop(0,255.999,this.util.seededRand())),Math.floor(this.util.prop(0,255.999,this.util.seededRand())))
        let skinTone = this.util.prop(this.util.propC(1,6,this.util.seededRand()),7.5,this.util.seededRand())
        let r = Math.min(255, Math.floor(skinTone * this.util.prop(43,47,this.util.seededRand())))
        let g = Math.min(255, Math.floor(skinTone * this.util.prop(32,35,this.util.seededRand())))
        let b = Math.min(255, Math.floor(skinTone * this.util.prop(28,32,this.util.seededRand())))
        this.faceColor = this.rgbToHex(r,g,b)

        this.eyeSeperation = this.util.prop(0.3,0.9,this.util.seededRand())
        // 1 = half of face's X len
        this.eyeHeight = this.util.prop(-0.09,-0.03,this.util.seededRand())
        // 1 = half of face's Y height
        this.mouthHeight = this.util.prop(-0.40,-0.20,this.util.seededRand())
        // 1 = half of face's Y height
        //All of the seperation factor calculates from the point of the front of the face

        this.mouthStyle = this.allMouths[Math.floor(this.util.prop(0,this.allMouths.length,this.util.seededRand()))]
        this.eyeStyle = this.allEyes[Math.floor(this.util.prop(0,this.allEyes.length,this.util.seededRand()))]
        this.accessories = []
        if(this.util.seededRand() < 0.75){ 
            this.accessories.push(this.allAccessories[Math.floor(this.util.prop(0,this.allAccessories.length,this.util.seededRand()))])
        }

        this.setRandoms()
        this.updatePoints()
    }

    setCenter(x, y){
        this.centerX = x
        this.centerY = y
    }

    updateScale(scale){
        this.scale = scale
        this.width = this.widthScale*this.scale
        this.height = this.scale
        this.length = this.scale*(this.widthScale+1)/2
        this.updatePoints()
    }

    setRandoms(){
        //seed faceShapeRandom ytf

        //randomness references, other generation function may reference these
        this.eyeRand1 = this.util.seededRand()
        this.eyeRand2 = this.util.seededRand()
        this.eyeRand3 = this.util.seededRand()
        this.eyeRand4 = this.util.seededRand()

        this.mouthRand1 = this.util.seededRand()
        this.mouthRand2 = this.util.seededRand()
        this.mouthRand3 = this.util.seededRand()
        this.mouthRand4 = this.util.seededRand()

        this.accRand1 = this.util.seededRand()
        this.accRand2 = this.util.seededRand()
        this.accRand3 = this.util.seededRand()
        this.accRand4 = this.util.seededRand()

        this.hairlineHeight = this.util.seededRand()
        this.hairLength = this.util.seededRand()

        this.isStraightBang = this.util.seededRand()
        this.bangEdgeCurves = [this.util.seededRand(), this.util.seededRand()]
        this.hairType = [this.util.seededRand(), this.util.seededRand(), this.util.seededRand()]
        this.hairRand = [this.util.seededRand(), this.util.seededRand(), this.util.seededRand()]
        this.bangSegmentRand = [[this.util.seededRand(), this.util.seededRand(), this.util.seededRand(), this.util.seededRand()],
                                [this.util.seededRand(), this.util.seededRand(), this.util.seededRand(), this.util.seededRand()],
                                [this.util.seededRand(), this.util.seededRand(), this.util.seededRand(), this.util.seededRand()]]
        this.hairMiscRand = [this.util.seededRand(), this.util.seededRand(), this.util.seededRand(), this.util.seededRand(), this.util.seededRand()]
        this.topAnchorCount = this.util.seededRand()

        this.faceVX = this.util.seededRand() //for shifting the face very slightly randomly
        this.faceVY = this.util.seededRand()

        this.headRoundedness = (this.util.seededRand()**2)//favor unround heads
        this.cheekBulge = this.util.seededRand()
        this.chinBulge = this.util.seededRand()
    }

    //update points for after angles are changed
    updatePoints(){
        this.faceAngleDirX = this.angleX/Math.abs(this.angleX) // direction [-1/1] of face
        if(isNaN(this.faceAngleDirX)) this.faceAngleDirX = 0

        //[X angle, Y angle] (deviating from the center of the circle)
        //X angle limit: -20/20 deg, Y angle limit -5/-25 deg
        this.zOffset = [this.length*Math.sin(this.angleX*radian) , this.length*Math.sin(this.angleY*radian)]
        //[Z Offset X, Z Offset Y] (Orthagonal based projection)
        //Z offset determines the front and backmost point of head

        //coordinates of reference points
        this.HEAD_CENTER = [this.centerX,this.centerY]
        this.HEAD_RIGHT = [this.centerX+this.width,this.centerY]
        this.HEAD_LEFT = [this.centerX-this.width,this.centerY]
        this.HEAD_TOP = [this.centerX,this.centerY-this.height]
        this.HEAD_BOTTOM = [this.centerX,this.centerY+this.height]
        this.HEAD_FRONT = [this.centerX-this.zOffset[0],this.centerY-this.zOffset[1]]
        this.HEAD_BACK = [this.centerX+this.zOffset[0],this.centerY+this.zOffset[1]]

        // face point + introduce randomized shift
        this.face = [this.centerX-this.zOffset[0], this.centerY-this.zOffset[1]]
        let faceVaryX = this.util.propC(-this.width/8,this.width/8,this.faceVX)
        let faceVaryY = this.util.propC(-this.height/8,this.height/8,this.faceVY)
        this.util.movePoint(this.face, faceVaryX, faceVaryY)

        // face angle adjustments for eyes and mouth
        let xAngleAdjustment = this.angleX*1.2
        let yAngleAdjustment = this.angleY*this.height/300+(this.width/200*15)


        //Compensate for the angle and the dist. betweem eyes
        this.leftEye = [(this.face[0]+this.eyeSeperation*this.width)+xAngleAdjustment, this.face[1]-this.eyeHeight*this.height]
        this.leftBrow = [this.leftEye[0], this.leftEye[1]-this.height/3]
        this.rightEye = [(this.face[0]-this.eyeSeperation*this.width)+xAngleAdjustment,this.face[1]-this.eyeHeight*this.height]
        this.rightBrow = [this.rightEye[0], this.rightEye[1]-this.height/3]

        // mouth points
        this.mouth = [this.face[0],(this.face[1]-this.mouthHeight*this.height)+yAngleAdjustment]
    }

    // hex conversion methods courtesy of https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
    componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
      
    rgbToHex(r, g, b) {
        return "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
    }

    hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : null;
    }

    DrawRefPoints(){
        if(ctx == null){
            throw "trying to draw ref on ref without ctx!"
        }
        this.util.dot(this.ctx, this.HEAD_RIGHT[0],this.HEAD_RIGHT[1]);
        this.util.dot(this.ctx, this.HEAD_LEFT[0],this.HEAD_LEFT[1]);
        this.util.dot(this.ctx, this.HEAD_TOP[0],this.HEAD_TOP[1]);
        this.util.dot(this.ctx, this.HEAD_BOTTOM[0],this.HEAD_BOTTOM[1]);           //These are edge of head
        this.util.dot(this.ctx, this.HEAD_CENTER[0],this.HEAD_CENTER[1]);                        //Center point
        this.util.dot(this.ctx, this.HEAD_FRONT[0],this.HEAD_FRONT[1]);  //Back head point
        this.util.dot(this.ctx, this.HEAD_BACK[0],this.HEAD_BACK[1]);  //Front face point
    }

    // fuse the traits of this chibi with another, randomly selecting or averaging traits from each parent
    fuse(ref2){
        this.baseSeed = this.baseSeed + "." + ref2.baseSeed
        this.util = new Util(this.ctx)
        this.util.seed("" + this.baseSeed)

        // inherit scale and angle
        this.widthScale = this.util.randInherit(this.widthScale, ref2.widthScale, 0.4, 0.2)
        this.angleX = this.util.randInherit(this.angleX, ref2.angleX, 0.4, 0.2) 
        this.angleY = this.util.randInherit(this.angleY, ref2.angleY, 0.4, 0.2)

        this.updateScale(this.util.prop(100,360,this.util.seededRand()))

        // hair Color conversion and inherit
        var myRGB = this.hexToRgb(this.hairColor)
        var yourRGB = this.hexToRgb(ref2.hairColor)

        var p1Bias = this.util.randInherit(0, 1, 0.4, 0.2)
        var newR = Math.floor(myRGB.r * p1Bias + yourRGB.r * (1-p1Bias))
        var newG = Math.floor(myRGB.g * p1Bias + yourRGB.g * (1-p1Bias))
        var newB = Math.floor(myRGB.b * p1Bias + yourRGB.b * (1-p1Bias))

        this.hairColor = this.rgbToHex(newR, newG, newB)
        
        // face Color conversion and inherit
        var myRGB = this.hexToRgb(this.faceColor)
        var yourRGB = this.hexToRgb(ref2.faceColor)

        var p1Bias = this.util.randInherit(0, 1, 0.4, 0.2)
        var newR = Math.floor(myRGB.r * p1Bias + yourRGB.r * (1-p1Bias))
        var newG = Math.floor(myRGB.g * p1Bias + yourRGB.g * (1-p1Bias))
        var newB = Math.floor(myRGB.b * p1Bias + yourRGB.b * (1-p1Bias))

        this.faceColor = this.rgbToHex(newR, newG, newB)

        // inherit some facial features
        this.eyeSeperation = this.util.randInherit(this.eyeSeperation, ref2.eyeSeperation, 0.4, 0.2)
        this.eyeHeight = this.util.randInherit(this.eyeHeight, ref2.eyeHeight, 0.4, 0.2)
        this.mouthHeight = this.util.randInherit(this.mouthHeight, ref2.mouthHeight, 0.4, 0.2)

        // inherit random discrete features
        this.mouthStyle = [this.mouthStyle, ref2.mouthStyle][Math.floor(this.util.seededRand() * 2)]
        this.eyeStyle = [this.eyeStyle, ref2.eyeStyle][Math.floor(this.util.seededRand() * 2)]

        this.accessories.push.apply(this.accessories, ref2.accessories)
        let newAccessories = []
        if(this.accessories.length > 0){
            newAccessories.push(this.accessories[Math.floor(this.util.seededRand() * this.accessories.length)])
        }
        this.accessories = newAccessories

        // inherit rest of the face features
        this.eyeRand1 = this.util.randInherit(this.eyeRand1, ref2.eyeRand1, 0.4, 0.2)
        this.eyeRand2 = this.util.randInherit(this.eyeRand2, ref2.eyeRand2, 0.4, 0.2)
        this.eyeRand3 = this.util.randInherit(this.eyeRand3, ref2.eyeRand3, 0.4, 0.2)
        this.eyeRand4 = this.util.randInherit(this.eyeRand4, ref2.eyeRand4, 0.4, 0.2)

        this.mouthRand1 = this.util.randInherit(this.mouthRand1, ref2.mouthRand1, 0.4, 0.2)
        this.mouthRand2 = this.util.randInherit(this.mouthRand2, ref2.mouthRand2, 0.4, 0.2)
        this.mouthRand3 = this.util.randInherit(this.mouthRand3, ref2.mouthRand3, 0.4, 0.2)
        this.mouthRand4 = this.util.randInherit(this.mouthRand4, ref2.mouthRand4, 0.4, 0.2)

        this.accRand1 = this.util.randInherit(this.accRand1, ref2.accRand1, 0.4, 0.2)
        this.accRand2 = this.util.randInherit(this.accRand2, ref2.accRand2, 0.4, 0.2)
        this.accRand3 = this.util.randInherit(this.accRand3, ref2.accRand3, 0.4, 0.2)
        this.accRand4 = this.util.randInherit(this.accRand4, ref2.accRand4, 0.4, 0.2)

        this.hairlineHeight = this.util.randInherit(this.hairlineHeight, ref2.hairlineHeight, 0.4, 0.2)
        this.hairLength = this.util.randInherit(this.hairLength, ref2.hairLength, 0.4, 0.2)

        this.isStraightBang = this.util.randInherit(this.isStraightBang, ref2.isStraightBang, 0.4, 0.2)
        this.topAnchorCount = this.util.randInherit(this.topAnchorCount, ref2.topAnchorCount, 0.4, 0.2)

        this.faceVX = this.util.randInherit(this.faceVX, ref2.faceVX, 0.4, 0.2) //for shifting the face very slightly randomly
        this.faceVY = this.util.randInherit(this.faceVY, ref2.faceVY, 0.4, 0.2)

        this.headRoundedness = this.util.randInherit(this.headRoundedness, ref2.headRoundedness, 0.4, 0.2)//favor unround heads
        this.cheekBulge = this.util.randInherit(this.cheekBulge, ref2.cheekBulge, 0.4, 0.2)
        this.chinBulge = this.util.randInherit(this.chinBulge, ref2.chinBulge, 0.4, 0.2)
    }
}

module.exports = {
    Ref: Ref
}