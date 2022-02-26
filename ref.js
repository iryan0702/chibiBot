//ref class:
//this class holds all the metadata regarding the coordinates related to a head's shape
//all constant factors of a chibi's head should be put here (+ rotation etc)
const{Util} = require("./util.js") 

class Ref{
    //[X reference, Y reference, Z reference] (for sphere)
    //dim [220,180,220]
    //angle [-20,-5] 
    constructor(cX, cY, width, height, length, angleX, angleY, eyeSeperation, eyeHeight, mouthHeight, ctx, faceSeed=Math.random()){
        this.centerX = cX
        this.centerY = cY
        this.width = width
        this.height = height
        this.length = length 
        this.angleX = angleX 
        this.angleY = angleY 
        this.eyeSeperation = eyeSeperation
        // 1 = half of face's X len
        this.eyeHeight = eyeHeight
        // 1 = half of face's Y height
        this.mouthHeight = mouthHeight
        // 1 = half of face's Y height
        //All of the seperation factor calculates from the point of the front of the face

        //other
        this.ctx = ctx
        this.util = new Util(ctx)

        this.setRandoms(faceSeed)
        this.calculatePoints()
    }

    setRandoms(faceSeed){
        //seed faceShapeRandom ytf
        this.util.seed(faceSeed)

        //randomness references, other generation function may reference these
        this.eyeRand1 = this.util.seededRand()
        this.eyeRand2 = this.util.seededRand()
        this.eyeRand3 = this.util.seededRand()
        this.eyeRand4 = this.util.seededRand()

        this.mouthRand1 = this.util.seededRand()
        this.mouthRand2 = this.util.seededRand()
        this.mouthRand3 = this.util.seededRand()
        this.mouthRand4 = this.util.seededRand()

        this.faceVX = this.util.seededRand() //for shifting the face very slightly randomly
        this.faceVY = this.util.seededRand()

        this.headRoundedness = (this.util.seededRand()**2)//favor unround heads
        this.cheekBulge = this.util.seededRand()
        this.chinBulge = this.util.seededRand()
    }

    calculatePoints(){
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
        let yAngleAdjustment = this.angleY*3+(this.width/200*33)

        //Compensate for the angle and the dist. betweem eyes
        this.leftEye = [(this.face[0]+this.eyeSeperation*this.width)+xAngleAdjustment, this.face[1]-this.eyeHeight*this.height]
        this.rightEye = [(this.face[0]-this.eyeSeperation*this.width)+xAngleAdjustment,this.face[1]-this.eyeHeight*this.height]

        // mouth points
        this.mouth = [this.face[0],(this.face[1]-this.mouthHeight*this.height)]//+yAngleAdjustment]
    }

    DrawRefPoints(){
        this.util.dot(this.ctx, this.HEAD_RIGHT[0],this.HEAD_RIGHT[1]);
        this.util.dot(this.ctx, this.HEAD_LEFT[0],this.HEAD_LEFT[1]);
        this.util.dot(this.ctx, this.HEAD_TOP[0],this.HEAD_TOP[1]);
        this.util.dot(this.ctx, this.HEAD_BOTTOM[0],this.HEAD_BOTTOM[1]);           //These are edge of head
        this.util.dot(this.ctx, this.HEAD_CENTER[0],this.HEAD_CENTER[1]);                        //Center point
        this.util.dot(this.ctx, this.HEAD_FRONT[0],this.HEAD_FRONT[1]);  //Back head point
        this.util.dot(this.ctx, this.HEAD_BACK[0],this.HEAD_BACK[1]);  //Front face point
    }
}

module.exports = {
    Ref: Ref
}