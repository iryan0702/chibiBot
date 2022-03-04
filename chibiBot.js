// The main program which acts as the interface between the user and the framework
// In order: 
// Contains the collection of steps required to generate one image of a chibi
// Contains the logic to process user input to customize a chibi
// Contains several animation functions to generate an animation based on a chibi

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

//given a ref, create a chibi of it with a given file name
function create(ref, fileName, outputToMainDirectory = false){
    ref.updatePoints()
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

    // generate base potato head and draw
    headPaths = gen.generateHeadPath(ref,ctx)
    let headPath = headPaths.headPath
    let headLRRef = headPaths.headLRRef
    let hairPath = headPaths.hairPath
    headPath.setFillStyle(ref.faceColor)
    headPath.addNoise(2,2)
    headPath.smoothPoints()
    headPath.draw(ctx, false)

    let leftRef = headLRRef.points[0]
    let rightRef = headLRRef.points[headLRRef.points.length-1]

    let bangPath = gen.generateHairBangs(ref, leftRef, rightRef, ctx)
    bangPath.reversePath()
    hairPath.addPath(bangPath)

    hairPath.setFillStyle(ref.hairColor)
    hairPath.addNoise(2,2)
    hairPath.smoothPoints()
    hairPath.draw(ctx, false)

    //generate face paths and draw
    facePaths = gen.generateFacePaths(ref)
    facePaths.forEach(path =>{
        path.addNoise(2,2)
        path.smoothPoints()
        path.draw(ctx, false)
    })

    // final draw and export
    const buffer = canvas.toBuffer("image/png");

    const fs = require("fs");
    outFileName = `./generatedImages/${fileName}.png`
    if(outputToMainDirectory){
        outFileName = `./${fileName}.png`
    }
    fs.writeFileSync(outFileName, buffer);

    console.log("created " + outFileName)

    return outFileName
}

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

// begin user input:
while(userInput != "exit" && userInput != "quit"){
    displayText = ""
    if(mode == "creation"){ //define user prompt based on current page
        if(firstPrompt){
            displayText += "Welcome to chibiBot.js!" + "\n"
            displayText += "The following is a random chibi:" + "\n"
            displayText += "=====\n"
            firstPrompt = false
        }
        displayText += "[0] Wideness:\t\t" + ref.widthScale + "\n"
        displayText += "[1] Eye Wideness:\t" + ref.eyeSeperation + "\n"
        displayText += "[2] Eye Height:\t\t" + ref.eyeHeight + "\n"
        displayText += "[3] Mouth Height:\t" + ref.mouthHeight + "\n"
        displayText += "[4] Hair Color:\t\t" + ref.hairColor + "\n"
        displayText += "[5] Skin Color:\t\t" + ref.faceColor + "\n"
        displayText += "[6] Seed (sets all values):\t\t" + ref.baseSeed + "\n"
        displayText += "=====" + "\n"
        displayText += "Enter a category number and a value to adjust any value, (e.g. '1 0.8' sets eye wideness to 0.8)" + "\n"
        displayText += "or enter nothing to continue:"
    }else if(mode == "pose"){
        displayText += "Adjust the pose of your chibi!" + "\n"
        displayText += "[0] Expression (preset [1-3] values):\t" + setExpression + "\n"
        displayText += ">\t(0: happy, 1: angry, 2: sad, 3: surprised, 4: misc)" + "\n"
        displayText += "[1] Mouth Style:\t" + ref.mouthStyle + "\n"
        displayText += "[2] Eye Style:\t\t" + ref.eyeStyle + "\n"
        displayText += "[3] Accessories:\t[" + ref.accessories + "]   (-1 to clear)\n"
        displayText += "[4] Scale:\t\t" + ref.scale + "\n"
        displayText += "[5] X Angle:\t\t" + ref.angleX + "\n"
        displayText += "[6] Y Angle:\t\t" + ref.angleY + "\n"
        displayText += "Or [7] to choose a preset animation!" + "\n"
        displayText += "=====" + "\n"
        displayText += "Enter a category number and a value to adjust any value, (e.g. '4 138')" + "\n"
        displayText += "or enter nothing to create an image of your chibi!:"
    }else if(mode == "animation"){
        displayText += "Choose an animation!" + "\n"
        displayText += "[0/Default] Looking around:\n"
        displayText += "[1] Bouncing Chibi:\n"
        displayText += "[2] 40 Random Chibis:\n"
        displayText += "[3] All Accessories:\n"
        displayText += "====="
    }else{
        console.log("Something went wrong! Please try again!")
        break;
    }

    console.log(displayText)
    userInput = prompt("> Input: ");

    // process userinput based on page and input value
    args = userInput.split(" ")
    if(args.length == 1 && args[0] == ''){ //empty input, move to next page or create
        if(mode == "creation"){
            mode = "pose"
        }else if(mode == "pose"){
            create(ref, "output", true)
            break;
        }else{
            lookingAroundAnimation(ref)
            break;
        }
    }else{
        category = parseInt(args[0]) 
        if(mode == "creation"){ //creation values
            if(category == 0){
                value = parseFloat(args[1]) 
                ref.widthScale = Math.max(0.8, Math.min(1.6, value))
                ref.updateScale(ref.scale)
            }else if(category == 1){
                value = parseFloat(args[1]) 
                ref.eyeSeperation = Math.max(0.3, Math.min(0.9, value))
            }else if(category == 2){
                value = parseFloat(args[1]) 
                ref.eyeHeight = Math.max(-0.09, Math.min(-0.03, value))
            }else if(category == 3){
                value = parseFloat(args[1]) 
                ref.mouthHeight = Math.max(-0.4, Math.min(-0.2, value))
            }else if(category == 4){
                value = args[1]
                ref.hairColor = value
            }else if(category == 5){
                value = args[1]
                ref.faceColor = value
            }else if(category == 6){
                value = parseFloat(args[1])  //take seed and update
                ref.baseSeed = Math.floor(Math.max(0, Math.min(999999, value)))
                ref.setAllSeededValues(ref.baseSeed)
            }
        }else if(mode == "pose"){ //pose values
            if(category == 0){
                value = parseInt(args[1]) 
                bigPresetList = [ 
                    [[6,10,[]], [9,8,[]]], //happy presets
                    [[1,102,[301]], [10,104,[]]], //angry presets
                    [[7,106,[300]], [14,3,[]]], //sad presets
                    [[5,0,[306]], [5,101,[]]], //surprised presets
                    [[104,1,[]], [11,103,[304]]] //special presets
                ]
                subList = bigPresetList[value]
                randList = subList[Math.floor(subList.length * Math.random())]

                ref.mouthStyle = randList[0]
                ref.eyeStyle = randList[1]
                ref.accessories = randList[2]
            }else if(category == 1){
                value = parseInt(args[1]) 
                ref.mouthStyle = value
            }else if(category == 2){
                value = parseInt(args[1]) 
                ref.eyeStyle = value
            }else if(category == 3){ //accessories addition or clearing
                value = parseInt(args[1]) 
                if(value == -1){
                    ref.accessories = []
                }else{
                    ref.accessories.push(value)
                }
            }else if(category == 4){
                value = parseFloat(args[1]) 
                ref.scale = Math.max(50, Math.min(600, value))
                ref.updateScale(ref.scale)
            }else if(category == 5){
                value = parseFloat(args[1]) 
                ref.angleX = Math.max(-20, Math.min(20, value))
            }else if(category == 6){
                value = parseFloat(args[1]) 
                ref.angleY = Math.max(-25, Math.min(-5, value))
            }else if(category == 7){
                mode = "animation"
            }
        }else if(mode == "animation"){ // choose an animation
            value = parseInt(args[0])
            if(value == 0){
                lookingAroundAnimation(ref)
            }else if(value == 1){
                bounceAnimation(ref)
            }else if(value == 2){
                randomChibiAnimation(40)
            }else if(value == 3){
                allAccessoriesAnimation(ref)
            }else{
                lookingAroundAnimation(ref)
            }
            break;
        }
    }
    console.log("=====")
}


//////
//code for animation: looking around
//////
function lookingAroundAnimation(ref){
    fileNames = []
    nextFileName = 0
    for(let x = -20; x <= 20; x += 4){
        ref.angleX = x
        ref.angleY = -5
        imageFileName = create(ref, nextFileName)
        fileNames.push(imageFileName)
        nextFileName += 1
    }
    for(let y = -5; y >= -25; y -= 2){
        ref.angleX = 20
        ref.angleY = y
        imageFileName = create(ref, nextFileName)
        fileNames.push(imageFileName)
        nextFileName += 1
    }
    for(let x = 20; x >= -20; x -= 4){
        ref.angleX = x
        ref.angleY = -25
        imageFileName = create(ref, nextFileName)
        fileNames.push(imageFileName)
        nextFileName += 1
    }
    for(let y = -25; y <= -5; y += 2){
        ref.angleX = -20
        ref.angleY = y
        imageFileName = create(ref, nextFileName)
        fileNames.push(imageFileName)
        nextFileName += 1
    }
    renderGif(fileNames, 5)
}

//////
//code for animation: bouncing
//////
// //attempt at making an animation using the current setup
function bounceAnimation(ref){
    squishFrames = 0
    fileNames = []
    nextFileName = 0
    ref.updateScale(200)
    baseWidth = ref.width
    baseHeight = ref.height

    for(let x = 0; x < 0.5; x += 0.02){
        let y = (1-4*x**2)
        bounceAnim(x, y, ref, squishFrames, baseWidth, baseHeight, nextFileName, fileNames)
        squishFrames -= 1
        nextFileName += 1
    }
    squishFrames = 5
    for(let x = 0.5; x < 0.86; x += 0.02){
        let y = 0.5-(4*x-2.71)**2
        bounceAnim(x, y, ref, squishFrames, baseWidth, baseHeight, nextFileName, fileNames)
        squishFrames -= 1
        nextFileName += 1
    }
    squishFrames = 5
    for(let x = 0.86; x < 1.12; x += 0.02){
        let y = 0.25-(4*x-3.92)**2
        bounceAnim(x, y, ref, squishFrames, baseWidth, baseHeight, nextFileName, fileNames)
        squishFrames -= 1
        nextFileName += 1
    }
    squishFrames = 4
    for(let x = 1.12; x < 1.2834; x += 0.02){
        let y = 0.125-(4*x-4.78)**2
        bounceAnim(x, y, ref, squishFrames, baseWidth, baseHeight, nextFileName, fileNames)
        squishFrames -= 1
        nextFileName += 1
    }
    squishFrames = 3
    for(let x = 0; x < 20; x += 1){
        bounceAnim(1.2834, 0.033333, ref, squishFrames, baseWidth, baseHeight, nextFileName, fileNames)
        squishFrames -= 1
        nextFileName += 1
    }
    for(let x = 0; x <= 1.2; x += 0.06){
        zoomWoah(x, ref, squishFrames, baseWidth, baseHeight, nextFileName, fileNames)
        squishFrames -= 1
        nextFileName += 1
    }

    renderGif(fileNames, 5)
}

function bounceAnim(relX, relY, ref, inputSquish, baseWidth, baseHeight, nextFileName, fileNames){
    let squish = Math.max(0, inputSquish)
    ref.setCenter(relX*1246, 1800-(relY*1500)) 
    ref.eyeStyle = 2
    ref.mouthStyle = 7
    if(squish > 0){
        ref.eyeStyle = 8
        ref.mouthStyle = 6
    }
    ref.width = baseWidth + squish*baseWidth/25
    ref.height = baseHeight - squish*baseHeight/25
    ref.angleX = 10-30*relX/1.28
    ref.angleY = 10-30*relX/1.28
    let imageFileName = create(ref, nextFileName)
    fileNames.push(imageFileName)
}

function zoomWoah(relX, ref, squish, baseWidth, baseHeight, nextFileName, fileNames){
    let rel = Math.min(relX, 1)
    ref.centerX = util.prop(1600, 1000, rel)
    ref.centerY = util.prop(1800, 1000, rel)
    ref.eyeStyle = 101
    ref.mouthStyle = 5
    ref.updateScale(util.prop(200, 800, rel))
    let imageFileName = create(ref, nextFileName)
    fileNames.push(imageFileName)
}

//////
// code for random chibi animation
//////
function randomChibiAnimation(amount){
    fileNames = []
    for(let i = 0; i < amount; i++){
        let newRef = new Ref(1000, 1000)
        fileNames.push(create(newRef, i))
    }
    renderGif(fileNames, 50)
}

//////
// code for testing all accessories
//////
function allAccessoriesAnimation(ref){
    fileNames = []
    for(let i = 0; i < ref.allAccessories.length; i++){
        ref.accessories = []
        ref.accessories.push(ref.allAccessories[i])
        fileNames.push(create(ref, i))
    }
    renderGif(fileNames, 50)
}

////
// gif render
////

function renderGif(fileNames, speed){
    console.log("Rendering gif!")
    // render gif
    var Gm = require("gm");
    const ref = require("./ref.js")
    newGm = Gm()

    fileNames.forEach( fileName =>{
        newGm = newGm.in(fileName)
    })
    newGm.delay(speed)
    .resize(2000,2000)
    .write("out.gif", function(err){
    if (err) throw err;
    console.log("out.gif created");
    });
}

