// import
const{Path} = require("./path.js") 
const{Util} = require("./util.js") 
const{Ref} = require("./ref.js") 
const{Generator} = require("./generator.js") 
const{createCanvas} = require('canvas')

//constants
radian = Math.PI / 180   // radian conversion
const canvasWidth = 2000;
const canvasHeight = 2000;
const gen = new Generator()
const util = new Util()

//combined main function to create and output a chibi image based on the inputs
function create(eyes,mouth,width, height, length, angleX, angleY, eyeSeperation, eyeHeight, mouthHeight, seed, fileName){
    return createXY(canvasWidth/2, canvasHeight/2, eyes,mouth,width, height, length, angleX, angleY, eyeSeperation, eyeHeight, mouthHeight, seed, fileName)
}

function createXY(centerX, centerY, eyes,mouth,width, height, length, angleX, angleY, eyeSeperation, eyeHeight, mouthHeight, seed, fileName){
    //create
    canvas = createCanvas(canvasWidth, canvasHeight);
    ctx = canvas.getContext("2d");

    //background
    ctx.fillStyle = "#EEEEEE";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    //Brush style
    brushWidth = 20;
    ctx.lineWidth = brushWidth;
    ctx.lineCap = 'round';
    //Initialize Reference
    let ref = new Ref(centerX, centerY, width, height, length, angleX, angleY, eyeSeperation, eyeHeight, mouthHeight, ctx, seed)

    // generate base potato head and draw
    headPaths = gen.generateHeadPath(ref,ctx)
    let headPath = headPaths.headPath
    let headLRRef = headPaths.headLRRef
    let hairPath = headPaths.hairPath
    headPath.setFillStyle("#FAEACF")
    headPath.addNoise(2,2)
    headPath.smoothPoints()
    headPath.draw(ctx, false)

    let leftRef = headLRRef.points[0]
    let rightRef = headLRRef.points[headLRRef.points.length-1]

    let bangPath = gen.generateHairBangs(ref, leftRef, rightRef, ctx)
    bangPath.reversePath()
    hairPath.addPath(bangPath)

    hairPath.setFillStyle("#3B3834")
    hairPath.addNoise(2,2)
    hairPath.smoothPoints()
    hairPath.draw(ctx, false)

    //generate face paths and draw
    facePaths = gen.generateFacePaths(ref,eyes,mouth)
    facePaths.forEach(path =>{
        path.addNoise(2,2)
        path.smoothPoints()
        path.draw(ctx, false)
    })

    //draw points
    // ref.DrawRefPoints()

    // final draw and export
    const buffer = canvas.toBuffer("image/png");

    const fs = require("fs");
    fileName = `./generatedImages/image${fileName}.png`
    fs.writeFileSync(fileName, buffer);

    console.log("created " + fileName)

    return fileName
}


//[gif production] all file names for the final gif
fileNames = []


// random generation: used to check variety and outliers
// gifSpeed = 50
// for(let i = 0; i < 40; i++){
//     //eyes,mouth,width, height, length, angleX, angleY, eyeSeperation, eyeHeight, mouthHeight,fileName
//     let eyes = util.randInt(8)
//     let mouth = util.randInt(5)
//     let scale = util.randRange(50,150)/100
//     let width = util.randRange(180,260)*scale
//     let height = util.prop(100,260,util.randGauss())*scale //bias for center
//     let length = util.randRange(180,220)*scale
//     let angleX = util.randRange(-20,20)
//     let angleY = util.randRange(-5,-25)
//     let eyeSeperation = util.randRange(40,75)/100
//     let eyeHeight = util.randRange(-2,-12)/100
//     let mouthHeight = util.randRange(-60,-30)/100
//     let seed = "" + Math.random()    
//     let fileName = i
//     let imageFileName = create(eyes,mouth,width, height, length, angleX, angleY, eyeSeperation, eyeHeight, mouthHeight, seed, fileName)
//     fileNames.push(imageFileName)
// }


// consistent generation: used to check consistency when adjusting angles with the same model
// gifSpeed = 10
// for(let i = 0; i < 20; i++){
//     //eyes,mouth,width, height, length, angleX, angleY, eyeSeperation, eyeHeight, mouthHeight,fileName
//     let eyes = 102
//     let mouth = 7

//     let width = 200
//     let height = 180
//     let length = 200
//     let angleX = -20+(i*2)
//     let angleY = -5-i
//     let eyeSeperation = 0.60
//     let eyeHeight = -0.06
//     let mouthHeight = -0.45
//     let seed = "wow"
//     let fileName = i
//     let imageFileName = create(eyes,mouth,width, height, length, angleX, angleY, eyeSeperation, eyeHeight, mouthHeight, seed, fileName)
//     fileNames.push(imageFileName)
// }
// for(let i = 0; i < 20; i++){
//     //eyes,mouth,width, height, length, angleX, angleY, eyeSeperation, eyeHeight, mouthHeight,fileName
//     let eyes = 2
//     let mouth = 3
//     let width = 200
//     let height = 180
//     let length = 200
//     let angleX = 20-(i*2)
//     let angleY = -25
//     let eyeSeperation = 0.60
//     let eyeHeight = -0.06
//     let mouthHeight = -0.45
//     let seed = "wow"
//     let fileName = i+20
//     let imageFileName = create(eyes,mouth,width, height, length, angleX, angleY, eyeSeperation, eyeHeight, mouthHeight, seed, fileName)
//     fileNames.push(imageFileName)
// }




// ** //
// bounce animation
// ** //

// //attempt at making an animation using the current setup
// gifSpeed = 5
// nextFileName = 0
// squishFrames = 0
// for(let x = 0; x < 0.5; x += 0.02){
//     let y = (1-4*x**2)
//     bounceAnim(x, y)
// }
// squishFrames = 5
// for(let x = 0.5; x < 0.86; x += 0.02){
//     let y = 0.5-(4*x-2.71)**2
//     bounceAnim(x, y)
// }
// squishFrames = 5
// for(let x = 0.86; x < 1.12; x += 0.02){
//     let y = 0.25-(4*x-3.92)**2
//     bounceAnim(x, y)
// }
// squishFrames = 4
// for(let x = 1.12; x < 1.2834; x += 0.02){
//     let y = 0.125-(4*x-4.78)**2
//     bounceAnim(x, y)
// }
// squishFrames = 3
// for(let x = 0; x < 20; x += 1){
//     bounceAnim(1.2834, 0.033333)
// }
// for(let x = 0; x <= 1.2; x += 0.06){
//     zoomWoah(x)
// }


// function bounceAnim(relX, relY){
//     let centerX = relX*1246
//     let centerY = 1850-(relY*1500)
//     let eyes = 2
//     let mouth = 7
//     if(squishFrames > 0){
//         squishFrames -= 1
//         eyes = 8
//         mouth = 6
//     }
//     let width = 220 + squishFrames*10
//     let height = 200 - squishFrames*10
//     let length = 220
//     let angleX = 10-30*relX/1.28
//     let angleY = -20
//     let eyeSeperation = 0.60
//     let eyeHeight = -0.06
//     let mouthHeight = -0.45
//     let seed = "wow"
//     let fileName = nextFileName
//     let imageFileName = createXY(centerX, centerY, eyes, mouth, width, height, length, angleX, angleY, eyeSeperation, eyeHeight, mouthHeight, seed, fileName)
//     fileNames.push(imageFileName)
//     nextFileName += 1
// }

// function zoomWoah(inputRel){
//     let rel = Math.min(inputRel, 1)
//     let centerX = util.prop(1600, 1000, rel)
//     let centerY = util.prop(1800, 1000, rel)
//     let eyes = 101
//     let mouth = 5
//     let width = util.prop(220, 880, rel)
//     let height = util.prop(200, 800, rel)
//     let length = util.prop(220, 880, rel)
//     let angleX = -20
//     let angleY = -20
//     let eyeSeperation = 0.60
//     let eyeHeight = -0.06
//     let mouthHeight = -0.45
//     let seed = "wow"
//     let fileName = nextFileName
//     let imageFileName = createXY(centerX, centerY, eyes, mouth, width, height, length, angleX, angleY, eyeSeperation, eyeHeight, mouthHeight, seed, fileName)
//     fileNames.push(imageFileName)
//     nextFileName += 1
// }

// // ** //
// // max angle test

// gifSpeed = 5
// nextFileName = 0
// for(let x = -20; x <= 20; x += 4){
//     angleCreate(x,-5)
// }
// for(let y = -5; y >= -25; y -= 2){
//     angleCreate(20,y)
// }
// for(let x = 20; x >= -20; x -= 4){
//     angleCreate(x,-25)
// }
// for(let y = -25; y <= -5; y += 2){
//     angleCreate(-25,y)
// }

// function angleCreate(aX, aY){
//     let centerX = 1000
//     let centerY = 1000
//     let eyes = 101
//     let mouth = 5
//     let width = 220
//     let height = 200
//     let length = 220
//     let angleX = aX
//     let angleY = aY
//     let eyeSeperation = 0.60
//     let eyeHeight = -0.06
//     let mouthHeight = -0.45
//     let seed = "joe"//""+Math.random()//
//     let fileName = nextFileName
//     let imageFileName = createXY(centerX, centerY, eyes, mouth, width, height, length, angleX, angleY, eyeSeperation, eyeHeight, mouthHeight, seed, fileName)
//     fileNames.push(imageFileName)
//     nextFileName += 1
// }


// user input system
// ***
const prompt = require("prompt-sync")({ sigint: true });
userInput = "none"
mode = "creation"
firstPrompt = true
setExpression = ""

validMouthValues = []
validEyeValues = []
// saved ref
let ref = new Ref(1000, 1000)

while(userInput != "exit" && userInput != "quit"){
    displayText = ""
    if(mode == "creation"){
        if(firstPrompt){
            displayText += "Welcome to chibiBot.js!" + "\n"
            displayText += "The following is a random chibi" + "\n"
            displayText += "=====\n"
            firstPrompt = false
        }
        displayText += "[0] Wideness:\t\t" + ref.widthScale + "\n"
        displayText += "[1] Eye Wideness:\t" + ref.eyeSeperation + "\n"
        displayText += "[2] Eye Height:\t\t" + ref.eyeHeight + "\n"
        displayText += "[3] Mouth Height:\t" + ref.mouthHeight + "\n"
        displayText += "[4] Seed (sets values [0-3]):\t\t" + ref.baseSeed + "\n"
        displayText += "=====" + "\n"
        displayText += "Enter a category number and a value to adjust any value, (e.g. '4 138')" + "\n"
        displayText += "or enter nothing to continue:"
    }else if(mode == "pose"){
        displayText += "Adjust the pose of your chibi!" + "\n"
        displayText += "[0] Expression (preset [1-3] values):\t" + setExpression + "\n"
        displayText += "[1] Mouth Type:\t\t" + ref.mouthType + "\n"
        displayText += "[2] Eye Type:\t\t" + ref.eyeType + "\n"
        displayText += "[3] Eyebrow Type:\t" + ref.eyebrowType + "\n"
        displayText += "[4] Accessory:\t\t" + "" + "\n"
        displayText += "[5] Scale:\t\t" + ref.scale + "\n"
        displayText += "[6] X Angle:\t\t" + ref.angleX + "\n"
        displayText += "[7] Y Angle:\t\t" + ref.angleY + "\n"
        displayText += "Or [8] to choose a preset animation!" + "\n"
        displayText += "=====" + "\n"
        displayText += "Enter a category number and a value to adjust any value, (e.g. '4 138')" + "\n"
        displayText += "or enter nothing to create an image of your chibi!:"
    }else if(mode == "animation"){
        console.log("No animation yet!")
        break;
    }else{
        console.log("Something went wrong! Please try again!")
        break;
    }
    console.log(displayText)
    userInput = prompt("> Input: ");

    args = userInput.split(" ")
    if(args.length == 1 && args[0] == ''){
        if(mode == "creation"){
            mode = "pose"
        }else if(mode == "pose"){
            //create
            break;
        }else{
            //create
            break;
        }
    }else{
        category = parseInt(args[0]) 
        value = parseFloat(args[1]) 
        if(isNaN(category) || isNaN(value)){
            console.log("Invalid input! Please try again!")
        }else{
            if(mode == "creation"){
                if(category == 0){
                    ref.widthScale = Math.max(0.8, Math.min(1.6, value))
                    ref.updateScale(ref.scale)
                }else if(category == 1){
                    ref.eyeSeperation = Math.max(0.3, Math.min(0.9, value))
                }else if(category == 2){
                    ref.eyeHeight = Math.max(-0.09, Math.min(-0.03, value))
                }else if(category == 3){
                    ref.mouthHeight = Math.max(-0.4, Math.min(-0.2, value))
                }else if(category == 4){
                    ref.baseSeed = Math.floor(Math.max(0, Math.min(99999, value)))
                    ref.setAllSeededValues(ref.baseSeed)
                }
            }else if(mode == "pose"){
                if(category == 0){
                    ref.widthScale = Math.max(0.8, Math.min(1.6, value))
                    ref.updateScale(ref.scale)
                }else if(category == 1){
                    ref.mouthType = Math.floor(value)
                }else if(category == 2){
                    ref.eyeType = Math.floor(value)
                }else if(category == 3){
                    ref.eyebrowType = Math.floor(value)
                }else if(category == 4){
                    
                }else if(category == 5){
                    ref.scale = Math.max(50, Math.min(600, value))
                }else if(category == 6){
                    ref.angleX = Math.max(-20, Math.min(20, value))
                }else if(category == 7){
                    ref.angleY = Math.max(-25, Math.min(-5, value))
                }else if(category == 8){
                    mode == "animation"
                }
            }
        }
    }
    console.log("=====")
}

////
// gif render
////

// // render gif
// var Gm = require("gm");
// const ref = require("./ref.js")
// newGm = Gm()

// fileNames.forEach( fileName =>{
//     newGm = newGm.in(fileName)
// })
// newGm.delay(gifSpeed)
// .resize(2000,2000)
// .write("out.gif", function(err){
//   if (err) throw err;
//   console.log("out.gif created");
// });
