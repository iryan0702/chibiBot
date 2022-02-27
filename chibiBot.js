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
    let ref = new Ref(1000, 1000, width, height, length, angleX, angleY, eyeSeperation, eyeHeight, mouthHeight, ctx, seed)

    // generate base potato head and draw
    headPaths = gen.generateHeadPath(ref,ctx)
    let headPath = headPaths.headPath
    let hairlineTopPath = headPaths.hairlineTopPath
    let hairlineBottomPath = headPaths.hairlineBottomPath
    headPath.addNoise(2,2)
    headPath.smoothPoints()
    headPath.draw(ctx, true)

    hairlineTopPath.addNoise(2,2)
    hairlineTopPath.smoothPoints()
    hairlineTopPath.draw(ctx, true)

    hairlineBottomPath.addNoise(2,2)
    hairlineBottomPath.smoothPoints()
    hairlineBottomPath.draw(ctx, true)

    let bangPath = gen.generateHairBangs(ref, hairlineTopPath, hairlineBottomPath)
    bangPath.addNoise(2,2)
    bangPath.smoothPoints()
    bangPath.draw(ctx, true)

    //generate face paths and draw
    facePaths = gen.generateFacePaths(ref,eyes,mouth)
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

    return fileName
}


//[gif production] all file names for the final gif
fileNames = []


// random generation: used to check variety and outliers
// gifSpeed = 50
// for(let i = 0; i < 10; i++){
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
gifSpeed = 10
for(let i = 0; i < 20; i++){
    //eyes,mouth,width, height, length, angleX, angleY, eyeSeperation, eyeHeight, mouthHeight,fileName
    let eyes = 102
    let mouth = 7

    let width = 200
    let height = 180
    let length = 200
    let angleX = -20+(i*2)
    let angleY = -5-i
    let eyeSeperation = 0.60
    let eyeHeight = -0.06
    let mouthHeight = -0.45
    let seed = "nft"
    let fileName = i
    let imageFileName = create(eyes,mouth,width, height, length, angleX, angleY, eyeSeperation, eyeHeight, mouthHeight, seed, fileName)
    fileNames.push(imageFileName)
}
for(let i = 0; i < 20; i++){
    //eyes,mouth,width, height, length, angleX, angleY, eyeSeperation, eyeHeight, mouthHeight,fileName
    let eyes = 2
    let mouth = 3
    let width = 200
    let height = 180
    let length = 200
    let angleX = 20-(i*2)
    let angleY = -25
    let eyeSeperation = 0.60
    let eyeHeight = -0.06
    let mouthHeight = -0.45
    let seed = "nft"
    let fileName = i+20
    let imageFileName = create(eyes,mouth,width, height, length, angleX, angleY, eyeSeperation, eyeHeight, mouthHeight, seed, fileName)
    fileNames.push(imageFileName)
}


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
