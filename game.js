
let DEBUG = false;

// Sound
let audioCtx = null;
let coinBuffer = null;

async function initAudioAndLoad() {
    if(!audioCtx) {
        audioCtx = new (window.AudioContext)();

        if(audioCtx.state === "suspended") {
            await audioCtx.resume();
        }
    }

    

    if(!coinBuffer) {
        const response = await fetch("sound/collect.wav");
        const arrayBuffer = await response.arrayBuffer();
        coinBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    }
}

document.addEventListener("click", initAudioAndLoad, {once: true});

function playCoin() {
    if(!audioCtx || !coinBuffer) return;

    const source = audioCtx.createBufferSource();
    source.buffer = coinBuffer;
    source.connect(audioCtx.destination);
    source.start(0);
}


let canvas = document.querySelector('canvas', {alpha: false});
canvas.focus();

canvas.width = window.innerWidth;
canvas.height = 1000;

let c = canvas.getContext('2d');
c.fillStyle = 'black';
c.fillRect(0,0, canvas.width, canvas.height);

 // Create a background canvas for better performance.
let bgCanvas = document.createElement("canvas", {alpha: false});
bgCanvas.width = window.innerWidth;
bgCanvas.height = 1000;
let bgCtx = bgCanvas.getContext("2d");
bgCtx.fillStyle = 'blue';

 let score = 0;
 let lives = 4;
 let level = 5;

 //let tileMap = await fetchCSV();

const textString = await fetch("http://127.0.0.1:5500/levels/level2.CSV").then(r => r.text())


 let rawMap = textString.split(",").map(m => m.trim());

const spritesheetWidth = 160;
const spritesheetHeight = 320;
 

var colorArray = [
    '#2C3E50',
    '#E74C3C',
    '#ECF0F1',
    '#3498DB',
    '#2980B9'
];

var mouse = {
    x: undefined,
    y: undefined
}

let direction = "left";

var maxRadius = 40;
var minRadius = 2;



window.addEventListener('keydown', function(event){
    if(event.code === "ArrowLeft") {
        player.moveLeft();
    }

    if(event.code === "ArrowRight") {
        player.moveRight();
    }

     if(event.code === "ArrowUp") {
        player.moveUp();
    }

    if(event.code === "ArrowDown") {
        player.moveDown();
    }

    if(event.code === "KeyZ") {
        player.digHoleLeft();
    }

    if(event.code === "KeyX") {
        player.digHoleRight();
    }
});

window.addEventListener("keyup", function(event) {
    player.animation.length = 1;
});

const collider = {
    enemies: [],
    player: null,
    checkCollision: function() { 
        const isCollided = this.enemies.some((enemy)=> player.isCollidingWith(enemy));
        player.setCollisionState(isCollided);
    },
   
};

class Animation {
    constructor(sprites) {
        this.sprites = sprites;
       
        this.animationIndex = 0;
        this.length = 3;
        this.frame = 0;
    }

    animate(x, y) {
        c.drawImage(this.sprites, (Math.floor(this.frame) % this.length) * 32, this.animationIndex * 32, 32, 32, x, y, 32, 32);
    }

    setAnimationIndex(index) {
        this.animationIndex = index;
    }
}

// Create a sprite for the player.
const playerSprite = new Image(96,96);
playerSprite.src = "graphics/player_animation3.png";
const playerAnimation = new Animation(playerSprite);

// create a sprite for the enememies
const npcSprite = new Image(96,96);
npcSprite.src = "graphics/enemy_animation3.png";
const npcAnimation = new Animation(npcSprite);

class TileMap {

    constructor(mapData) {
       
        this.blocks = this.createBlocksFromMap(mapData);
        this.data = [];
        this.width = 26;
        this.height = 21;
        this.images = null;
    }

    createBlocksFromMap(map) {
        let blocks = [];
        const tileNames = ["empty", "wall", "empty", "ladder", "rope", "empty", "enemy", "gold", "border", "solid"];
        let xc = 0; let yc = 0;

        for(let n = 0; n < map.length; n++) {
                  
            let index = map[n];

            let x_offs = 0; let y_offs = 0;
            [x_offs, y_offs] = tileNames[index] == "gold" ? [0, 16] : [0, 0];

            const tileBlock = new TileBlock(xc*32, yc*32, index, tileNames[index], x_offs, y_offs);

            blocks.push(tileBlock);
            //this.data.push(index);

            if(xc < 25) {
                xc++;
            }
            else {
                xc=0;
                yc++;
            }
        }

        return blocks;
    }

     getTileBlock(x_coord, y_coord) {
        // A function to see what tile block we hit and choose action.
        // Investigate the surrounding area and check collisions. 
        // If a wall is hit don't move. If gold increase score.
        // Walls have tr, tl, br, bl set to 1.

        let x = parseInt(x_coord / 32);
        let y = parseInt(y_coord / 32);

        let block = this.blocks[y*this.width+x];
        DEBUG && console.log("x:",x);
        DEBUG && console.log("y:",y);
        return block;
    }

    replaceTileBlock(x_coord, y_coord) {
        
        let x = parseInt(x_coord / 32);
        let y = parseInt(y_coord / 32);

        let oldBlock = this.blocks[y*this.width+x];
        let newBlock = new TileBlock(oldBlock.x, oldBlock.y, 0, "empty", 0, 0);
        this.blocks[y*this.width+x] = newBlock;
    }

    setOffLimits(x_coord, y_coord) {
        let x = parseInt(x_coord / 32);
        let y = parseInt(y_coord / 32);

        let block = this.blocks[y*this.width+x];
        block.name = "wall";
    }

    setReachable(x_coord, y_coord) {
        let x = parseInt(x_coord / 32);
        let y = parseInt(y_coord / 32);

        let block = this.blocks[y*this.width+x];
        block.name = block.type;
    }

    getOverlappingTiles(entityX, entityY, entityWidth, entityHeight, tileSize = 32) {

        const leftTile = Math.floor(entityX / tileSize);
        const rightTile = Math.floor((entityX + entityWidth - 1) / tileSize);
        const topTile = Math.floor(entityY / tileSize);
        const bottomTile = Math.floor((entityY + entityHeight - 1) / tileSize);

        const tiles = [];
        for(let tx = leftTile; tx <= rightTile; tx++) {
            for(let ty = topTile; ty <= bottomTile; ty++) {
                // Bounds check
                if(tx >= 0 && tx < this.width && ty >= 0 && ty < this.height) {
                    const index = ty * this.width + tx;
                    const tileId = this.blocks[index].index;
                    const name = this.blocks[index].name;

                    if(tileId !== 0) { // Skip empty air tiles.
                        tiles.push({
                            x: tx, y: ty,
                            id: tileId,
                            name: name
                        });
                    }
                }
            }
        }
        return tiles; 
    }
    draw(ctx) {
        this.blocks.forEach((b) => b.draw(ctx, this.images));      
    }
}

  class Entity {

    constructor(x, y, x_offs=0, y_offs=0, pos = null) {

         this.x_offs = x_offs;
        this.y_offs = y_offs;

        const position = {
            x: x,
            y: y
        };

        this.position = position;

        this.x = x;
        this.y = y;
        this.dx = 5;
        this.dy = 5;
        this.width = 32;
        this.height = 32;
        this.collisionState = false;  
    }

    shiftPosition(dx, dy) {
         this.x += dx;
         this.y += dy;
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    setCollisionState(collisionState) {
        collisionState && lives--;
    }

    isCollidingWith(other) {
      
        return(
            (this.x + this.width) >= (other.x + other.x_offs) && 
            this.x <= (other.x + other.width) && 
            (this.y + this.height) >= (other.y  + other.y_offs) &&
            this.y <= (other.y + other.height));
     }
  }

  // A class with all the logic for moving characters.
class MovingCharacter extends Entity {

    constructor(x, y, tilemap) {
        super(x, y);
        this.tileMap = tilemap;
        this.playerAction = {fall:false, dig:false, climb:false, collect:false, swing:false};
        this.dx = 4;
        this.dy = 4;
        this.animation = null;
        this.velocity = 350;
        this.fallSpeed = 200;
        this.lastTime = 0;

        this.hitboxWidth = 20;
        this.hitboxHeight = 28;

        this.ignoreGravity = false;
        this.justExitedLadder = false;
    }

    addAnimation(animation) {
        this.animation = animation;
       
        // this.animation.start();
    }

     moveLeft() {  
       // this.velocity = 350;
        this.animation.setAnimationIndex(1); 
        this.animation.length = 3;
       
        if(!this.isHittingLeftWall() && this.x > 0) {  
            this.shiftPosition(-this.dx, 0);
        }

        this.resolveLeftWallCollision(); // TODO: Not being able to run through walls.
        
       
    }

    
     moveRight() {
       // this.velocity = 350;
        this.animation.setAnimationIndex(0);
        this.animation.length = 3;    
       
        if(!this.isHittingRightWall() && this.x < 800) {  
            this.shiftPosition(this.dx, 0);
        }    
        
       this.resolveRightWallCollision();
    }

     moveUp() {  
      // this.velocity = 320;
        this.animation.setAnimationIndex(2);
        this.animation.length = 2;

            this.snapToLadder(this.x, this.y);
        
        if(!this.isHittingRoof() && !this.isAtLadderTop()) {
            this.shiftPosition(0, -this.dy);
           // this.resolveLadderTop();
        }
        
        /*
        if(this.isAtLadderTop()){
            console.log("ladder at top");
            this.ignoreGravity = true;
            this.fallSpeed = 0;
            this.resolveLadderTop();
        }*/
    }

    moveDown() {
          //  this.velocity = 320;
            this.animation.setAnimationIndex(2);
            this.animation.length = 2;
         
            this.snapToLadder(this.x, this.y);
               
           // if(this.isHittingFloor() == false) {
                this.shiftPosition(0, this.dy);
          //  }   
          this.resolveFloorCollision();   
    }

    snapToLadder(x, y) {    
        let tiles = this.tileMap.getOverlappingTiles(x, y, 32, 64);

        tiles.forEach(t => {
            if(t.name === "ladder" && Math.abs(t.x * 32 - x) < 20) {
                this.x = t.x * 32;
            }
        });
    }

    isRopeSwinging() {
        let tiles = this.tileMap.getOverlappingTiles(this.x, this.y, 32, 32);   
        return tiles.some(t => t.name === "rope" && Math.abs(t.y * 32 - this.y) < 8);
    }

    // different behavior depending on player and NPC.
    isCollectingGold() { 
        let tiles = this.tileMap.getOverlappingTiles(this.x, this.y, 32, 32);
        return tiles.some(t => t.name === "gold" && Math.abs(t.x * 32 - this.x) < 8);
    }
    
    isHittingLeftWall() {
        // const neighborLeftUp =  this.tileMap.getTileBlock(this.x-32, this.y);
        // const neighborLeftDown = this.tileMap.getTileBlock(this.x-32, this.y+31);

         const hitboxX = this.x + (32 - this.hitboxWidth) / 2;
        const hitboxY = this.y + (32 - this.hitboxHeight);

        let tiles = this.tileMap.getOverlappingTiles(hitboxX-1, hitboxY, this.hitboxWidth, this.hitboxHeight);
        return tiles.some(t => t.name === "wall");

        // if((this.isCollidingWith(neighborLeftUp) && neighborLeftUp.name == "wall") || 
        //     this.isCollidingWith(neighborLeftDown) && neighborLeftDown.name == "wall") {
        //         return true;
        // }
        // return false;
    }

    isHittingRightWall() {
        // const neighborRightUp =  this.tileMap.getTileBlock(this.x+32, this.y);
        // const neighborRightDown = this.tileMap.getTileBlock(this.x+32, this.y+31);

        const hitboxX = this.x + (32 - this.hitboxWidth) / 2;
        const hitboxY = this.y + (32 - this.hitboxHeight);

         let tiles = this.tileMap.getOverlappingTiles(hitboxX+1, hitboxY, this.hitboxWidth, this.hitboxHeight);
        return tiles.some(t => t.name === "wall");

        // TODO: Collision box
        // if((this.isCollidingWith(neighborRightUp) && neighborRightUp.name == "wall") || 
        //     (this.isCollidingWith(neighborRightDown) && neighborRightDown.name == "wall")) {
        //         return true;
        // }
        // return false;
    }

    

     resolveRightWallCollision() {
        const hitboxX = this.x + (32 - this.hitboxWidth) / 2;
        const hitboxY = this.y + (32 - this.hitboxHeight);

         let tiles = this.tileMap.getOverlappingTiles(hitboxX, hitboxY, this.hitboxWidth, this.hitboxHeight);

        //return tiles.some(t => t.name === "wall");
        for (let t of tiles) {
        if (t.name === "wall") {
            // Compute tile boundaries
            const tileLeft = t.x * 32;

            // Push player left
           // player.x = tileLeft - player.width;

            // Correction 2026-02-05. Push this object left.
            this.x = tileLeft - this.width;
            // End of correction

            // Stop downward velocity
            //velocityY = 0;
            }
        }

    }

     resolveLeftWallCollision() {
         const hitboxX = this.x + (32 - this.hitboxWidth) / 2;
        const hitboxY = this.y + (32 - this.hitboxHeight);

         let tiles = this.tileMap.getOverlappingTiles(hitboxX, hitboxY, this.hitboxWidth, this.hitboxHeight); 
        //return tiles.some(t => t.name === "wall");
        for (let t of tiles) {
        if (t.name === "wall") {
            // Compute tile boundaries
            const tileLeft = t.x * 32;

            // Push player right
            //player.x = tileLeft + player.width;

            // Correction 2026-02-05. Push this object right.
            this.x = tileLeft + this.width;
            // End of correction.

            // Stop downward velocity
            //velocityY = 0;
            }
        }

    }

    resolveFloorCollision() {
        const hitboxX = this.x + (32 - this.hitboxWidth) / 2;
        const hitboxY = this.y + (32 - this.hitboxHeight);

         let tiles = this.tileMap.getOverlappingTiles(hitboxX, hitboxY, this.hitboxWidth, this.hitboxHeight); 
        //return tiles.some(t => t.name === "wall");

        for (let t of tiles) {
            if (t.name === "wall") {
                // Compute tile boundaries
                const tileTop = t.y * 32;

                // Push player up
                //player.y = tileTop - this.height;

                // Correction 2026-02-05. Push this object up.
                this.y = tileTop - this.height;
                // End of correction

                // Stop downward velocity
                //velocityY = 0;
               this.fallSpeed = 0;
            }
        }
        console.log("resolving floor collision");
    }

    isHittingFloor() {
        const hitboxX = this.x + (32 - this.hitboxWidth) / 2;
        const hitboxY = this.y + (32 - this.hitboxHeight);
        
        //let tiles = this.tileMap.getOverlappingTiles(this.x, this.y+1, 32, 32); 
        let tiles = this.tileMap.getOverlappingTiles(hitboxX, hitboxY+1, this.hitboxWidth, this.hitboxHeight); 
        return tiles.some(t => t.name === "wall"); 
    }

    isHittingRoof() {
        const neighborUpLeft =  this.tileMap.getTileBlock(this.x, this.y-32);
        const neighborUpRight = this.tileMap.getTileBlock(this.x+31, this.y-32);

         if((this.isCollidingWith(neighborUpLeft) && neighborUpLeft.name == "wall")
                || (this.isCollidingWith(neighborUpRight) && neighborUpRight.name == "wall")) {
                       
                return true; 
        }
        return false;
    }

    // possibly only for controlled player.
    isDigging() {
        //
    }

    resolveLadderTop() {
        const hitboxX = this.x + (32 - this.hitboxWidth) / 2;
        const hitboxY = this.y + (32 - this.hitboxHeight);

        const feetX = hitboxX + this.hitboxWidth / 2;
        const feetY = hitboxY + this.hitboxHeight;

        const tileX = Math.floor(feetX / 32);
        const tileY = Math.floor(feetY / 32);

        const feetTile = this.tileMap.blocks[tileY * this.tileMap.width + tileX];
        const tileBelowFeet = this.tileMap.blocks[(tileY + 1) * this.tileMap.width + tileX];

        if(tileBelowFeet.name === "ladder" && feetTile.name === "empty" && Math.abs(feetY - tileBelowFeet.y) < 4) {
        this.y = tileBelowFeet.y - 32;
        }
    }

    isAtLadderTop() {
        
        const hitboxX = this.x + (32 - this.hitboxWidth) / 2;
        const hitboxY = this.y + (32 - this.hitboxHeight);

        const feetX = hitboxX + this.hitboxWidth / 2;
        const feetY = hitboxY + this.hitboxHeight;

        const tileX = Math.floor(feetX / 32);
        const tileY = Math.floor(feetY / 32);

        const feetTile = this.tileMap.blocks[tileY * this.tileMap.width + tileX];
        const tileBelowFeet = this.tileMap.blocks[(tileY + 1) * this.tileMap.width + tileX];

        return (tileBelowFeet.name === "ladder" && feetTile.name === "empty");
    }

    isClimbingLadder() {
        const hitboxX = this.x + (32 - this.hitboxWidth) / 2;
        const hitboxY = this.y + (32 - this.hitboxHeight);

         let tiles = this.tileMap.getOverlappingTiles(hitboxX, hitboxY+1, this.hitboxWidth, this.hitboxHeight);
        return tiles.some(t => t.name === "ladder" && t.x * 32 === this.x);
    }

    isFreefalling() {

        const xCenter = this.x + this.width / 2;
        const yFoot = this.y + this.height + 1;

        const hitboxX = this.x + (32 - this.hitboxWidth) / 2;
        const hitboxY = this.y + (32 - this.hitboxHeight);

        //let tiles = this.tileMap.getOverlappingTiles(xCenter, yFoot, 1, 1);
        let tiles = this.tileMap.getOverlappingTiles(hitboxX, hitboxY+1, this.hitboxWidth, this.hitboxHeight);

        return(tiles.every(t => t.name === "empty" || 
            (t.name === "rope" && Math.abs(t.y*32-this.y) > 3) ||
            (t.name === "gold" && Math.abs(t.y*32-this.y) > 3)
            ));
    }

    updatePlayerAction() {  
        this.playerAction.collect = this.isCollectingGold(); 

        this.playerAction.climb = this.isClimbingLadder();
         

        if(!this.ignoreGravity) {
            this.playerAction.fall = this.isFreefalling();
        }
       
        this.playerAction.swing = this.isRopeSwinging();
    }

    update() {
        this.updatePlayerAction(); // update the state.
    }
}

class TileBlock extends Entity {

    constructor(x, y, index, name = "", x_offs, y_offs) {
        super(x, y, x_offs, y_offs);
        //this.image = new Image();

        // edited 17/1
        //this.image.src = `graphics/${value}.gif`;

        // doing this for each tile block. Should do it once with an async function.
         //this.image.src = `graphics/brick.png`;
        // end of edit

        this.index = index;
        this.tl = 0;
        this.tr = 0;
        this.bl = 0;
        this.br = 0;
        this.name = name;
        this.type = name;
    }

    draw(ctx, image) {
        if(this.index == 0) {
              ctx.drawImage(image, 32, 0, this.width, this.height, this.x, this.y, this.width, this.height);
        }
        else {
            let col = (this.index - 1) % 5;
            let row = parseInt((this.index - 1) / 5);

               ctx.drawImage(image, col*32, row*32, this.width, this.height, this.x, this.y, this.width, this.height);
        }  
    }

    update() {
        //this.draw();     
    }
}

class Player extends MovingCharacter {

    constructor(x, y, tilemap) {
        super(x, y, tilemap);

        this.dx = 4;
        this.dy = 4;  
    }

    digHoleLeft() {
        if(this.isHittingFloor()) {
            tileMap.replaceTileBlock(this.x-31, this.y+32);
             this.tileMap.draw(bgCtx);
        }
    }

    digHoleRight() {
        if(this.isHittingFloor()) {
            tileMap.replaceTileBlock(this.x+32, this.y+32);
             this.tileMap.draw(bgCtx);
        }
    }

    collectGold() {
        let tiles = this.tileMap.getOverlappingTiles(this.x, this.y, 32, 32);
        tiles.forEach(t => {
            if(t.name === "gold") {
                this.tileMap.replaceTileBlock(t.x * 32, t.y * 32);
               
                playCoin();
            }
        });
    }

    draw() {
        if(this.animation === null) {
            c.fillStyle = '#ffffff';
            c.fillRect(this.x, this.y, 32, 32);
        }
        else {
            this.animation.animate(this.x, this.y);
        }
    }

    update(delta) {
        super.update();
 
      if (typeof this.animation.frame !== "number" || isNaN(this.animation.frame)) { this.animation.frame = 0; }

    this.animation.frame += this.velocity * delta * 0.03;
    
    if(this.velocity == 0) {
        this.animation.frame = 0;
    }

         switch(true) {
            case this.playerAction.climb:
                DEBUG && console.log("CLIMB");
              
                this.dx = this.velocity * delta; this.dy = this.velocity * delta;
                break;
             case this.playerAction.collect:
                DEBUG && console.log("COLLECT");
                
                 this.collectGold();    
                 this.tileMap.draw(bgCtx);
                score+=250; // collect gold and increase score by 250.
                
                break;
             case this.playerAction.dig:
                //
                break;
             case this.playerAction.fall:
               
                 DEBUG && console.log("FALL");
                 this.animation.setAnimationIndex(3);
                 this.animation.length = 1;
                 
                this.dx = 0; this.dy = 0; // disable user control while falling.
                this.shiftPosition(0, this.fallSpeed * delta);

                if(this.isHittingFloor) {
                    this.resolveFloorCollision();
                }
                
                this.isAtLadderTop();
                this.resolveLadderTop();

                break;
            case this.playerAction.swing:
                DEBUG && console.log("SWING");
                this.animation.setAnimationIndex(4);
                
                this.dx = this.velocity * delta; this.dy = this.velocity * delta;
                break;
             default:
                 DEBUG && console.log("NORMAL");
                 this.dx = this.velocity * delta; this.dy = 0;
 
                // console.log("velocity:", delta);
                break;        
        }

        if(this.ignoreGravity) {
                    this.ignoreGravity = false;
                 }
                 else {
                    this.fallSpeed = 220;
                 }
        
        this.draw();
    }
}

class NPC extends MovingCharacter {

    constructor(x, y, tilemap) {
        super(x, y, tilemap);
       
        this.direction = "right";
        this.carryGold = false;
        this.enemies = [];
        this.animationIndex = 1;
        this.velocity = 100;

        this.junctions = [];
        this.junctionPoint = null;
        this.lastPlayerPosition = {x: 0, y: 0};

        this.playerRef = undefined;
    }

    // moveUp() {  
    //   // this.velocity = 320;
    //     this.animation.setAnimationIndex(2);
    //     this.animation.length = 2;

    //       //  this.snapToLadder(this.x, this.y);
        
    //     if(!this.isHittingRoof() && !this.isAtLadderTop()) {
    //         this.shiftPosition(0, -this.dy);
    //     }
        
    //     if(this.isAtLadderTop()){
    //         console.log("ladder at top");
    //         this.ignoreGravity = true;
    //         this.fallSpeed = 0;
    //     }
    // }

    checkCollision() {
        return this.enemies.some(enemy => this.isCollidingWith(enemy));
    }

   

    findJunctions() {
        let junctionsUp = [];
        let junctionsDown = [];
        let junctions = [];
        let n = 1;
        let tileLeft = null; let tileRight = null;
        let tileLeftBelow = null; let tileRightBelow = null;

        let tileY = Math.floor(this.y / 32);
        let tileX = Math.floor(this.x / 32);

        let tile = tileMap.blocks[tileY * tileMap.width + tileX];
        let tileBelow = tileMap.blocks[(tileY + 1) * tileMap.width + tileX];

        if(tile.name === "ladder") {
            junctionsUp.push(tile);
        }

         else if(tileBelow.name === "ladder") {
            junctionsDown.push(tile);
        }
       else {

        while(n < tileMap.width) {
            tileY = Math.floor(this.y / 32);
            tileX = Math.floor(this.x / 32);

            if(tileX + n <= tileMap.width) {
                tileRight = tileMap.blocks[tileY * tileMap.width + tileX + n];       
                tileRightBelow = tileMap.blocks[(tileY + 1) * tileMap.width + tileX + n];
                 
                 if(tileRight.name === "ladder") {
                    junctionsUp.push(tileRight);
                 }
            
                 if(tileRightBelow) {
                    if(tileRightBelow.name === "ladder") {
                        junctionsDown.push(tileRightBelow);
                    }   
                }     
            }
     
            if(tileX - n >= 0) {
                tileLeft = tileMap.blocks[tileY * tileMap.width + tileX - n ];
                tileLeftBelow = tileMap.blocks[(tileY + 1) * tileMap.width + tileX - n];

                if(tileLeft.name === "ladder") {
                    junctionsUp.push(tileLeft);
                }

                if(tileLeftBelow) {
                    if(tileLeftBelow.name === "ladder") {
                        junctionsDown.push(tileLeftBelow);
                    }
                }
            }
      
            n++;
        } 

    }

        // Prioritize junctions up or down depending on where the player is.
       if(this.playerRef.y < this.y) {
           junctions = junctionsUp.concat(junctionsDown);
           
       }
       else {
        junctions = junctionsDown.concat(junctionsUp);
       }
console.log(junctions);
        return junctions;

    //return junctionsUp;
    }

    draw() {   
         
          if(this.animation === null) {
            c.fillStyle = c.fillStyle = '#3498DB';;
            c.fillRect(this.x, this.y, 32, 32);
        }
        else {
            this.animation.animate(this.x, this.y);
            this.animation.delay = 10;
        }
    }

     update(delta) {
        super.update();

         if (typeof this.animation.frame !== "number" || isNaN(this.animation.frame)) { this.animation.frame = 0; }

    this.animation.frame += this.velocity * delta * 0.03;
   
    if(this.velocity == 0) {
        this.animation.frame = 0;
    }
 
    

    if(this.playerRef.y !== this.y && this.playerRef.y !== this.lastPlayerPosition.y) {
        this.junctions = this.findJunctions();
        console.log(this.junctions);
        this.junctionPoint = this.junctions.shift();
         console.log("found a junction point");
    }

        /* let tiles = (this.tileMap.getOverlappingTiles(this.x, this.y, 32, 32));

         for (let t of tiles) { 
            if(t.name === "ladder") {
                this.x = t.x;
            }
        };*/
   
         if(this.isAtLadderTop()) {
                        
                        console.log("now i am at the top");
                        this.junctions = this.findJunctions();
                        this.junctionPoint = this.junctions.shift();
                    }

        if(this.junctionPoint) {   
            
            if(Math.round(this.x) < this.junctionPoint.x) {
                console.log("right");
                this.moveRight();
                console.log(this.x);
            }
            else if(Math.round(this.x) > this.junctionPoint.x) {
                console.log("left");
                this.moveLeft();
                console.log(this.x);
            }  
             else if(Math.round(this.y) > this.playerRef.y) {
               
                    this.moveUp();
                    console.log(this.y);
                   
                    console.log("UP");
                    this.ignoreGravity = true;
                    this.fallSpeed = 0;
                   
                }
                else if(Math.round(this.y) < this.playerRef.y) {
                  
               
                    this.moveDown();
                           
                    console.log("DOWN");
                                   
            }
  
        }
        

         switch(true) {
            case this.playerAction.climb:
                DEBUG && console.log("enemy CLIMB");
              console.log("CLIMB");
                this.dx = 1;//this.velocity * delta; 
                 this.dy = 1;//this.velocity * delta;
                break;
             case this.playerAction.collect:
                DEBUG && console.log("COLLECT");
                
                 // TODO: NPC doesn't have this function. Different behavior than player.
                 //this.collectGold();  
                  
                 //this.tileMap.draw(bgCtx);
                //score+=250; // collect gold and increase score by 250.
                
                break;
             case this.playerAction.dig:
                //
                break;
             case this.playerAction.fall:
               
                 DEBUG && console.log("FALL");
                 this.animation.setAnimationIndex(3);
                 this.animation.length = 1;
                 
                this.dx = 0; this.dy = 0; // disable user control while falling.
                //this.shiftPosition(0, this.fallSpeed * delta);
                this.shiftPosition(0,1);
                if(this.isHittingFloor) {
                  //  this.resolveFloorCollision();
                }
                
                this.resolveLadderTop();

                break;
            case this.playerAction.swing:
                DEBUG && console.log("SWING");
                this.animation.setAnimationIndex(4);
                
                this.dx = this.velocity * delta; this.dy = this.velocity * delta;
                break;
             default:
                 DEBUG && console.log("NORMAL");
                  
                 //this.dx = this.velocity * delta; this.dy = 0;
              
                 this.dx = 1;
                 
               
                break;        
        }

       this.lastPlayerPosition.x = this.playerRef.x;
        this.lastPlayerPosition.y = this.playerRef.y;

         if(this.ignoreGravity) {
                    this.ignoreGravity = false;
                 }
                 else {
                    this.fallSpeed = 220;
                 }

        this.draw();
    }
    
}

// Create a tilemap from data.
const tileMap = new TileMap(rawMap);

// Load spritesheet.
function preloadTileImages() {
    return new Promise((resolve, reject) => {
        const img = new Image(spritesheetWidth, spritesheetHeight);
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = "graphics/brick.png";
    });
}

// Get the spritesheet and draw a tilemap from it.
async function buildBackground() {
    console.log("Preloading tiles...");
    const tileImages = await preloadTileImages();
    tileMap.images = tileImages; //spritesheet
    //console.log(tileImages);
    tileMap.draw(bgCtx);
}

// TODO: Global variabel orsakar problem när den anropas i klasser.
const player = new Player(40,480, tileMap, {x: 300, y: 200});
const npc1 = new NPC(680,480, tileMap);
const npc2 = new NPC(730,480, tileMap);
const npc3 = new NPC(700,480, tileMap);

// Add references to the other objects.
npc1.enemies.push(npc2, npc3);
npc2.enemies.push(npc1, npc3);
npc3.enemies.push(npc1, npc2);

npc1.playerRef = player;
npc2.playerRef = player;
npc3.playerRef = player;

// add animations to characters
player.addAnimation(playerAnimation);
npc1.addAnimation(npcAnimation);
npc2.addAnimation(npcAnimation);
npc3.addAnimation(npcAnimation);

collider.player = player;
collider.enemies.push(npc1);
collider.enemies.push(npc2);
collider.enemies.push(npc3);

let lastTime = 0;

function animate(time) {
   
   
    requestAnimationFrame(animate);
        
       

    const delta = lastTime ? (time - lastTime) / 1000 : 0; // seconds
    lastTime = time;

   
    c.fillStyle = "black";
    c.fillRect(0, 0, window.innerWidth, window.innerHeight);
     c.drawImage(bgCanvas, 0, 0);

     c.font = "40px Arial";
    c.fillStyle = "white";
    c.fillText(`score: ${score}`, 50, 600);
    c.fillText(`men: ${lives}`, 350, 600);
    c.fillText(`level: ${level}`, 650, 600);

   // if(!isNaN(delta)) {
    player.update(delta);

     npc1.update(delta);
     npc2.update(delta);
     npc3.update(delta);

      
    //}
    collider.checkCollision();
    //console.log(player.collisionState);
    //player.collisionState && score++;
}

await buildBackground().then(() => {animate();
 });
// window.addEventListener("click", ()=> {
//     buildBackground().then(()=> {
//         animate();
//     });
// });
// animate();





