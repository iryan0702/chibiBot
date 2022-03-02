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
function create(eyes, mouth, brows, width, height, length, angleX, angleY, eyeSeperation, eyeHeight, mouthHeight, seed, fileName){
    createXY(canvasWidth/2, canvasHeight/2, eyes, mouth, brows, width, height, length, angleX, angleY, eyeSeperation, eyeHeight, mouthHeight, seed, fileName)
}

function createXY(centerX, centerY, eyes, mouth, brows, width, height, length, angleX, angleY, eyeSeperation, eyeHeight, mouthHeight, seed, fileName){
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
    headPath.addNoise(2,2)
    headPath.smoothPoints()
    headPath.draw(ctx, true)

    console.log(headLRRef)
    let leftRef = headLRRef.points[0]
    let rightRef = headLRRef.points[headLRRef.points.length-1]
    console.log(leftRef)
    console.log(rightRef)

    let bangPath = gen.generateHairBangs(ref, leftRef, rightRef, ctx)
    bangPath.addNoise(2,2)
    bangPath.smoothPoints()
    bangPath.draw(ctx, true)

    //generate face paths and draw
    facePaths = gen.generateFacePaths(ref,eyes,mouth,brows)
    facePaths.forEach(path =>{
        path.addNoise(2,2)
        path.smoothPoints()
        path.draw(ctx, true)
    })

    //draw points
    ref.DrawRefPoints()

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




//attempt at making an animation using the current setup
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
//     let brows = 101
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
//     let imageFileName = createXY(centerX, centerY, eyes, mouth, brows, width, height, length, angleX, angleY, eyeSeperation, eyeHeight, mouthHeight, seed, fileName)
//     fileNames.push(imageFileName)
//     nextFileName += 1
// }

// function zoomWoah(inputRel){
//     let rel = Math.min(inputRel, 1)
//     let centerX = util.prop(1600, 1000, rel)
//     let centerY = util.prop(1800, 1000, rel)
//     let eyes = 101
//     let mouth = 5
//     let brows = 101
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
//     let imageFileName = createXY(centerX, centerY, eyes, mouth, brows, width, height, length, angleX, angleY, eyeSeperation, eyeHeight, mouthHeight, seed, fileName)
//     fileNames.push(imageFileName)
//     nextFileName += 1
//     }



//Single image test code
    gifSpeed = 10

    let centerX = 1000
    let centerY = 1000
    let eyes = 2
    let mouth = 5
    let brows = 104
    let width = 220
    let height = 200
    let length = 220
    let angleX = -10
    let angleY = -8
    let eyeSeperation = 0.60
    let eyeHeight = -0.06
    let mouthHeight = -0.45
    let seed = "wow"
    let fileName = "nextFileName"

    createXY(centerX, centerY, eyes, mouth, brows, width, height, length, angleX, angleY, eyeSeperation, eyeHeight, mouthHeight, seed, fileName)





// render gif
var Gm = require("gm");
const ref = require("./ref.js")
newGm = Gm()

fileNames.forEach( fileName =>{
    newGm = newGm.in(fileName)
})
newGm.delay(gifSpeed)
.resize(2000,2000)
.write("out.gif", function(err){
  if (err) throw err;
  console.log("out.gif created");
});
