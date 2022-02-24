//util class:
//the place for general utility functions
//most contains basic debug drawing tool, and randomization helpers
class Util{
    constructor(){}

    dot(ctx, x, y, size=5){
        let fill = ctx.fillStyle;
        ctx.beginPath();
        ctx.fillStyle = "#FF0000";
        ctx.arc(x, y, size, 0, 2 * Math.PI, false);
        ctx.fill()
        ctx.fillStyle = fill
    }

    //INCLUSIVE [0 to end]
    randInt(end){
        return this.randRange(0, end)
    }
    //also INCLUSIVE
    randRange(start, end){
        return start+Math.floor(Math.random()*(end+1-start))
    }
    //random gaussian value [0,1] with mean 0
    randGauss() {
        let u = 1 - Math.random(), v = 1 - Math.random();
        let num = Math.sqrt(-2.0 * Math.log(u))*Math.cos(v*2*Math.PI);
        num = num/10+0.5;
        if (num > 1 || num < 0) return randn_bm()
        return num
      }
    //vary point by random distance xVar yVar
    varyPoint(point, xVar, yVar){
        point[0] = point[0] + Math.floor((xVar*2+1)*Math.random()) - xVar
        point[1] = point[1] + Math.floor((yVar*2+1)*Math.random()) - yVar
    }
    //move point by dx, dy
    movePoint(point, dx, dy){
        point[0] = point[0] + dx
        point[1] = point[1] + dy
    }
    //given a range and a proportion, return value on range linearly
    prop(start, end, proportion){
        return start+(end-start)*proportion
    }
    //given a range and a proportion, return value on range with high bias towards center
    propC(start, end, proportion){
        let realProportion = (Math.pow(2*proportion-1,5)+1)/2
        return start+(end-start)*realProportion
    }

    //distance
    dist(p1, p2){
        return Math.sqrt((p1[0]-p2[0])**2+(p1[1]-p2[1])**2)
    }

    //interpolate point: given two points and a ratio, return a point that is that ratio down from the first to second point
    interpolatePoint(p1, p2, ratio){
        return [p1[0]+(p2[0]-p1[0])*ratio,p1[1]+(p2[1]-p1[1])*ratio]
    }

    //seeded random utils:
    //referenced – https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
    xmur3(str) {
        var h
        for(var i = 0, h = 1779033703 ^ str.length; i < str.length; i++) {
            h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
            h = h << 13 | h >>> 19;
        } return function() {
            h = Math.imul(h ^ (h >>> 16), 2246822507);
            h = Math.imul(h ^ (h >>> 13), 3266489909);
            return (h ^= h >>> 16) >>> 0;
        }
    }

    sfc32(a, b, c, d) {
        return function() {
          a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; 
          var t = (a + b) | 0;
          a = b ^ b >>> 9;
          b = c + (c << 3) | 0;
          c = (c << 21 | c >>> 11);
          d = d + 1 | 0;
          t = t + d | 0;
          c = c + t | 0;
          return (t >>> 0) / 4294967296;
        }
    }

    seed(seed){ //seed a random
        this.seed = this.xmur3(seed)
        this.rand = this.sfc32(this.seed(), this.seed(), this.seed(), this.seed());
    }

    seededRand(){ //use seeded random
        if(this.rand == undefined){
            throw "Attempted to use seeded rand without seeding first!"
        }else{
            return this.rand()
        }
    }
}

module.exports = {
    Util: Util
}