
let DEBUG = false;

// Sound
let audioCtx = null;
let coinBuffer = null;
let laserBuffer = null;
let fallBuffer = null;
let currentSource = null;
let osc = null;

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

        const response2 = await fetch("sound/dig.wav");
        const arrayBuffer2 = await response2.arrayBuffer();
        laserBuffer = await audioCtx.decodeAudioData(arrayBuffer2);

        const response3 = await fetch("sound/fall.wav");
        const arrayBuffer3 = await response3.arrayBuffer();
        fallBuffer = await audioCtx.decodeAudioData(arrayBuffer3);
    }
}

/*
async function playOnce(audioBuffer) {
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;

    source.loop = false;

    source.connect(audioCtx.destination);
    source.start(0);
    currentSource = source;
}
*/


document.addEventListener("click", initAudioAndLoad, {once: true});



function playCoin() {
    if(!audioCtx || !coinBuffer) return;

    const source = audioCtx.createBufferSource();
    source.buffer = coinBuffer;
    source.connect(audioCtx.destination);
    source.start(0);
}

function playLaser() {
    if(!audioCtx || !laserBuffer) return;

    const source = audioCtx.createBufferSource();
    source.buffer = laserBuffer;
    source.connect(audioCtx.destination);
    source.start(0);
}

function playFall() {
    if(!audioCtx || !fallBuffer) return;
 /*   osc = audioCtx.createOscillator();
   osc.type = "square";
   osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
   
    osc.connect(audioCtx.destination);
    osc.start();*/

    const source = audioCtx.createBufferSource();
    source.buffer = fallBuffer;
    source.connect(audioCtx.destination);
    source.start(0);
    currentSource = source;
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
 let level = 1;

 //let tileMap = await fetchCSV();




const spritesheetWidth = 160;
const spritesheetHeight = 320;
 
/*
var colorArray = [
    '#2C3E50',
    '#E74C3C',
    '#ECF0F1',
    '#3498DB',
    '#2980B9'
];*/

window.addEventListener('keydown', function(event){
    player.setInput(event.code);

    // if(event.code === "ArrowLeft") {
    //    // player.moveLeft();
    // }

    // if(event.code === "ArrowRight") {
    //   //  player.moveRight();
    // }

    //  if(event.code === "ArrowUp") {
    //    // player.moveUp();
    // }

    // if(event.code === "ArrowDown") {
    //   //  player.moveDown();
    // }

    // if(event.code === "KeyZ") {
    //     player.digHoleLeft();
    // }

    // if(event.code === "KeyX") {
    //     player.digHoleRight();
    // }
});

window.addEventListener("keyup", function(event) {
    player.animation.length = 1;
    
     player.setInput("");
   
    
   
});

const collider = {
    enemies: [],
    player: null,
    checkCollision: function() { 
        //const isCollided = this.enemies.some((enemy)=> player.isCollidingWith(enemy));
        this.enemies.forEach(enemy => {
            if(player.isCollidingWith(enemy)) {
                if(player.y < enemy.y) {  
                    player.y = Math.floor(enemy.y) - 33;       
                }
            else {
                player.setCollisionState(true);
                }
            } // end of if
        
        });
    }
}; // end of collider

class Animation {
    constructor(sprites) {
        this.sprites = sprites;
       
        this.animationIndex = 0;
        this.length = 3;
        this.frame = 0;
        this.loop = true;
    }

    animate(x, y) {
        if(this.loop || Math.floor(this.frame) < this.length) {
            c.drawImage(this.sprites, (Math.floor(this.frame) % this.length) * 32, this.animationIndex * 32, 32, 32, x, y, 32, 32);
        }
    }

    setAnimationIndex(index) {
        this.animationIndex = index;
    }
}

// Graphics

// Create a sprite for the player.
const playerSprite = new Image(128,192);
playerSprite.src = "graphics/player_animation3.png";
const playerAnimation = new Animation(playerSprite);

// Create a sprite for the enememies.
const npcSprite = new Image(128,192);
npcSprite.src = "graphics/enemy_animation3.png";
const npcAnimation = new Animation(npcSprite);

// Create animations for the bricks.
const tileAnimationSprite = new Image(128,64);
tileAnimationSprite.src = "graphics/brick_animation.png";
const tileAnimation = new Animation(tileAnimationSprite);


class TileMap {

    constructor(mapData) {
       
        this.blocks = this.createBlocksFromMap(mapData);
        this.data = [];
        this.width = 28; // Width in blocks.
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

            if(xc < 27) {
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

        let x = Math.floor((x_coord + 16) / 32);
        let y = Math.floor((y_coord + 16) / 32);

        let block = this.blocks[y*this.width+x];
        DEBUG && console.log("x:",x);
        DEBUG && console.log("y:",y);
        return block;
    }

    renameTileBlock(x_coord, y_coord, name) {
         let x = parseInt(x_coord / 32);
        let y = parseInt(y_coord / 32);

        this.blocks[y*this.width+x].name = name;
    }

    replaceTile(x_coord, y_coord, index, name) {
        let centerX = x_coord + 16;
        let centerY = y_coord + 16;

        let indexY = Math.floor(centerY / 32);
        let indexX = Math.floor(centerX / 32);
                            
        //let newBlock = new TileBlock(indexX * 32, indexY * 32, index, name);
        //tileMap.blocks[indexY * tileMap.width + indexX] = newBlock;
        tileMap.blocks[indexY * tileMap.width + indexX].index = index;
        tileMap.blocks[indexY * tileMap.width + indexX].name = name;
    }

    replaceTileBlock(x_coord, y_coord) {
        
        let x = parseInt(x_coord / 32);
        let y = parseInt(y_coord / 32);

        let oldBlock = this.blocks[y*this.width+x];
        let newBlock = new TileBlock(oldBlock.x, oldBlock.y, 0, "empty", 0, 0);
        this.blocks[y*this.width+x] = newBlock;
    }

    restoreWall(x_coord, y_coord) {
        setTimeout(() => {

        let centerX = x_coord + 16;
        let centerY = y_coord + 16;

        let indexY = Math.floor(centerY / 32);
        let indexX = Math.floor(centerX / 32);

        this.blocks[indexY * this.width + indexX].index = 1;
        this.blocks[indexY * this.width + indexX].name = "wall";
          
            this.draw(bgCtx);
          
        }, 8500);
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
      // if(player.y + player.height < 
        collisionState && lives--;
    }

    isCollidingWith(other) {
        return(
            (this.x + this.width) >= (other.x) && 
            this.x <= (other.x + other.width) && 
            (this.y + this.height) >= (other.y) &&
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
        this.velocity = 300;
        this.fallSpeed = 200;
        this.lastTime = 0;

        // will replace dx and dy.
        this.velocityX;
        this.velocityY;

        this.hitboxWidth = 20;
        this.hitboxHeight = 28;

        this.ignoreGravity = false;
        this.justExitedLadder = false;

        // Initial state
        this.currentState = "idle";
    }

    addAnimation(animation) {
        this.animation = animation;
       
        // this.animation.start();
    }

    snapToLadder(x, y) {    
        let tiles = this.tileMap.getOverlappingTiles(x, y, 32, 64);

        tiles.forEach(t => {
            if(t.name === "ladder" && Math.abs(t.x * 32 - x) < 20) {
                this.x = t.x * 32; // Snap pixel perfect.
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
    
    isTrapped() {
        let tiles = this.tileMap.getOverlappingTiles(this.x-1, this.y, 96, 31);
      
      //  tiles.forEach(t=> console.log(t));
       
        return ( tiles[0].name === "wall" && tiles[1].name === "wall");  
    }

    isHittingLeftWall() {
        // const neighborLeftUp =  this.tileMap.getTileBlock(this.x-32, this.y);
        // const neighborLeftDown = this.tileMap.getTileBlock(this.x-32, this.y+31);

         const hitboxX = this.x + (32 - this.hitboxWidth) / 2;
        const hitboxY = this.y + (32 - this.hitboxHeight);

        let tiles = this.tileMap.getOverlappingTiles(hitboxX-1, hitboxY, this.hitboxWidth, this.hitboxHeight);
        return tiles.some(t => t.name === "wall" || t.name === "solid");

        // if((this.isCollidingWith(neighborLeftUp) && neighborLeftUp.name == "wall") || 
        //     this.isCollidingWith(neighborLeftDown) && neighborLeftDown.name == "wall") {
        //         return true;
        // }
        // return false;
    }

    isHittingRightWall() {
        // const neighborRightUp =  this.tileMap.getTileBlock(this.x+32, this.y);
        // const neighborRightDown = this.tileMap.getTileBlock(this.x+32, this.y+31);

        const hitboxX = this.x + (32 - this.hitboxWidth) / 2; // 6 pixels less wide than actual size.
        const hitboxY = this.y + (32 - this.hitboxHeight);

         let tiles = this.tileMap.getOverlappingTiles(hitboxX+1, hitboxY, this.hitboxWidth, this.hitboxHeight);
        return tiles.some(t => t.name === "wall" || t.name === "solid");

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
        if (t.name === "wall" || t.name === "solid") {
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
        if (t.name === "wall" || t.name === "solid") {
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
            if (t.name === "wall" || t.name === "solid") {
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
        return tiles.some(t => t.name === "wall" || t.name === "border" || t.name === "solid"); 
    }

    isHittingRoof() {
        // const neighborUpLeft =  this.tileMap.getTileBlock(this.x, this.y-32);
        // const neighborUpRight = this.tileMap.getTileBlock(this.x+31, this.y-32);

        //  if((this.isCollidingWith(neighborUpLeft) && neighborUpLeft.name == "wall")
        //         || (this.isCollidingWith(neighborUpRight) && neighborUpRight.name == "wall")) {
                       
        //         return true; 
        // }
        // return false;

        const hitboxX = this.x;// + (32 - this.hitboxWidth) / 2;
        const hitboxY = this.y;// + (32 - this.hitboxHeight);
        
        //let tiles = this.tileMap.getOverlappingTiles(this.x, this.y+1, 32, 32); 
        let tiles = this.tileMap.getOverlappingTiles(hitboxX, hitboxY+1, this.hitboxWidth, this.hitboxHeight); 
        return tiles.some(t => t.name === "wall"); 
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
        const feetY = Math.round(this.y)+31;//hitboxY + this.hitboxHeight;

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
      //  return tiles.some(t => t.name === "ladder" && t.x * 32 === this.x);
      return tiles.some(t => t.name === "ladder" && Math.abs(t.x * 32 - hitboxX) < 16);
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

    collectGold() {
        let tiles = this.tileMap.getOverlappingTiles(this.x, this.y, 32, 32);
        tiles.forEach(t => {
            if(t.name === "gold") {
                this.tileMap.replaceTileBlock(t.x * 32, t.y * 32);
               
               
            }
        });
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

        this.index = index;
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

        this.input = "";
    }

    setInput(input) {

        this.input = input;

       
        
    console.log(this.currentState);

    }

    digHoleLeft() {
        if(this.isHittingFloor()) {
           
            if(tileMap.getTileBlock(this.x - 32, this.y + 32).name === "wall") {
                playLaser();
                this.animation.setAnimationIndex(6);
                tileAnimation.length = 2;
                     tileAnimation.animate(this.x - 32, this.y + 32);  
                tileMap.replaceTile(this.x - 32, this.y + 32, 0, "empty");
                this.tileMap.draw(bgCtx);
                tileMap.restoreWall(this.x - 32, this.y + 32); // Set timeout to restore the wall after 8 sec.
            }
        }
    }

    digHoleRight() {
        if(this.isHittingFloor()) {
           
             if(tileMap.getTileBlock(this.x + 32, this.y + 32).name === "wall") {
                playLaser();
                 this.animation.setAnimationIndex(5); 
                  tileAnimation.length = 2;
                     tileAnimation.animate(this.x + 32, this.y + 32);   
                tileMap.replaceTile(this.x+32, this.y+32, 0, "empty");
                this.tileMap.draw(bgCtx);
                tileMap.restoreWall(this.x + 32, this.y + 32); // Set timeout to restore the wall after 8 sec.
             }
        }
    }

    

    draw() {
        if(this.animation === null) {
            c.fillStyle = '#ffffff';
            c.fillRect(this.x, this.y, 32, 32);
        }
        else {
            this.animation.animate(this.x, this.y);

             // For easier bug fixing. Remove later.
            c.font = "24px Arial";
            c.fillStyle = "yellow";
            c.fillText(this.currentState, this.x, this.y - 8);
        }
    }

    update(delta) {
        super.update();
 
      if (typeof this.animation.frame !== "number" || isNaN(this.animation.frame)) { this.animation.frame = 0; }

    this.animation.frame += this.velocity * delta * 0.03;
    tileAnimation.frame += this.velocity * delta * 0.03;

    if(this.velocity == 0) {
        this.animation.frame = 0;
    }

        if(this.ignoreGravity) {
                    this.ignoreGravity = false;
                 }
                 else {
                    this.fallSpeed = 220;
                 }

        // state object
         const state = Object.freeze({
            CLIMB: "climb",
            DIG: "dig",
            FALL: "fall",
            SWING: "swing",
            IDLE: "idle",
            WALK: "walk",
            COLLECT: "collect"
        });

         switch(this.currentState) {
            // Climb
            case state.CLIMB:
               // console.log("climb............");
                this.velocityX = 0; this.velocityY = 150 * delta;

                this.animation.setAnimationIndex(2);
                this.animation.length = 1;

                if(this.input === "ArrowUp") {
                    this.snapToLadder(this.x, this.y);

                    if(!this.isHittingRoof() && !this.isAtLadderTop()) {
                        this.shiftPosition(this.velocityX, -this.velocityY);
                        this.resolveLadderTop();
                    }

                    this.animation.length = 2;
                }
              
                 if(this.input === "ArrowDown") {
                    this.snapToLadder(this.x, this.y);

                  
                        this.shiftPosition(this.velocityX, this.velocityY);
                        this.resolveFloorCollision();
                    

                     if(!this.isClimbingLadder()) {
                        this.currentState = "fall";
                    }

                    this.animation.length = 2;
                }

                if(this.input === "ArrowLeft") {
                    this.currentState = "walk";
                }

                 if(this.input === "ArrowRight") {
                    this.currentState = "walk";
                }

                break;
            // Collect
             case state.COLLECT:
                    
                 this.collectGold();
                  playCoin();    
                 this.tileMap.draw(bgCtx);
                score+=250; // collect gold and increase the score by 250.
                
                this.currentState = "fall";
                break;
            // Dig
             case state.DIG:
                this.animation.length = 1;
                
                tileAnimation.setAnimationIndex(0);

                if(this.input === "KeyZ") {
                    this.digHoleLeft();
                           
                }

                 if(this.input === "KeyX") {
                    this.digHoleRight();
                       
                }
                
                if(this.input === "") {
                    this.currentState = "idle";
                }
                break;
            // Fall
             case state.FALL:    
                 console.log("state=FALL");

              // TODO: play sound once and stop at the right moment.
                  //    playFall();
                     

                // osc.stop(audioCtx.currentTime + 0.1);

                 this.animation.setAnimationIndex(3);
                 this.animation.length = 1;

                 this.velocityX = 0; this.velocityY = this.fallSpeed * delta;
                
                this.shiftPosition(this.velocityX, this.velocityY);

                if(this.isHittingFloor()) {
                        this.isPlayingSound = true;
                        this.resolveFloorCollision();
                        this.currentState = "idle";
                    }
     
               if(this.isClimbingLadder()) {
                   this.currentState = "climb";
               }
               
               if(this.isCollectingGold()) {
                    this.currentState = "collect";
               }

               if(this.isRopeSwinging()) {
                    this.currentState = "swing";
               }
                break;
            // Swing
            case state.SWING:
               
                this.animation.length = 1;
                this.velocityX = this.velocity * delta; this.velocityY = 0;

                if(this.input === "ArrowLeft") {
                    if(!this.isHittingLeftWall()) {
                        this.shiftPosition(-this.velocityX, this.velocityY);
                        this.resolveRightWallCollision();
                    }
                    this.animation.length = 3;
                    this.animation.setAnimationIndex(7);
                }

                if(this.input === "ArrowRight") {
                    if(!this.isHittingRightWall()) {
                        this.shiftPosition(this.velocityX, this.velocityY);
                        this.resolveRightWallCollision();
                    }
                    this.animation.length = 3;
                     this.animation.setAnimationIndex(4);
                }

                 if(this.input === "ArrowDown") {
                    this.currentState = "fall";
                }
                
                if(this.isClimbingLadder()) {
                    this.currentState = "climb";
                }

                if(!this.isRopeSwinging()) {
                    this.currentState = "fall";
                }
                break;
            // Walk
             case state.WALK:
                
                this.velocityY = 0;

                if(this.input === "ArrowLeft") {
                         
                    this.velocityX = -this.velocity * delta; 
                   
                    if(this.x > 0 && !this.isHittingLeftWall()) {
                        this.shiftPosition(this.velocityX, this.velocityY);
                        this.resolveLeftWallCollision();
                    }
          
                    this.animation.setAnimationIndex(1); 
                }

               if(this.input === "ArrowRight") {
                     
                    this.velocityX = this.velocity * delta;
                    
                    if(this.x < 864 && !this.isHittingRightWall()) {
                        this.shiftPosition(this.velocityX, this.velocityY);  
                        this.resolveRightWallCollision();     
                    }

                     this.animation.setAnimationIndex(0); 
                }

                 if(this.input === "") {
                        
                    this.currentState = "idle";
                }
              
                // animation    
                this.animation.length = 3;
            
                // move
                //if(!this.isHittingLeftWall() && this.x > 0) {  
                  //  this.shiftPosition(this.velocityX, this.velocityY);
               //}

               // TODO. Won't work unless I know which direction I'm moving. 
                // resolve
               // this.resolveLeftWallCollision();

               if(this.isFreefalling()) {
                this.currentState = "fall";
               }
                // on key up or velocity 0 return to idle.
                
                if(this.isCollectingGold()) {
                    this.currentState = "collect";
                }

                if(this.isRopeSwinging()) {
                    this.currentState = "swing";
                }
                break; 
            // Idle
            case state.IDLE:
                console.log("IDLE");
               this.animation.length = 1;

                this.velocityX = 0;
                this.velocityY = 0;

                // Idle next to a ladder.
                if(this.isClimbingLadder()) {
                   this.currentState = "climb";
                   //this.snapToLadder();
                }

                if(this.input === "ArrowLeft" || this.input === "ArrowRight") {       
                    this.currentState = "walk";   
                }
 
                if(this.input === "KeyZ" || this.input === "KeyX") {
                    this.currentState = "dig";
                }

                if(this.isFreefalling()) {
                   
                    this.currentState = "fall";
                }
                break;
            
        }

        this.draw();
    }
}

class NPC extends MovingCharacter {

    constructor(x, y, tilemap) {
        super(x, y, tilemap);
       
        this.direction = "right";
    
        this.enemies = [];
        this.animationIndex = 1;
        this.velocity = 150;

        this.junctions = [];
        this.junctionPoint = null;
        this.lastPlayerPosition = {x: 0, y: 0};

        this.playerRef = undefined;

        this.direction = "";
        this.targetX;
        this.floor;
        
        this.hasGold = false;
    }

    /*
    checkCollision() {
        return this.enemies.some(enemy => this.isCollidingWith(enemy));
    }*/

    isCloseTo(npc) {
         return(
            (this.x + this.width) >= npc.x && 
            this.x <= (npc.x + npc.width) && 
            (this.y + this.height) >= npc.y &&
            this.y <= (npc.y + npc.height));  
    }

    aiStep() {
         this.floor = Math.floor(this.y/96);
        let targetFloor = Math.floor(player.y / 96);
         let nearestLadderX = this.findNearestLadderOnFloor();
       // let distanceToTarget = Math.abs(Math.round(this.x) - Math.round(nearestLadderX));
       
       

        if (Math.abs(this.floor - targetFloor) > 1) {
            
            this.targetX = nearestLadderX;
           
            if(this.isClimbingLadder()) { // found a ladder.
               
                this.climbToward(targetFloor);  
            } 

           
        }
        else {
                this.targetX = player.x;          
        }
       
        let distanceToTarget = Math.abs(Math.floor(this.x) - Math.floor(this.targetX));

        if(distanceToTarget > 4) {
         this.moveTowardTargetX();
        }

       

    }
    
    climbToward(targetY) {
        
       let directionSign = Math.sign(targetY - Math.floor(this.y/96));
       
      if(directionSign !== 0) {
            this.currentState = "idle"; 
            this.direction = directionSign === -1 ? "up" : "down";         
        }

        console.log("DIRECTION", this.direction);
    }

    moveTowardTargetX() {
        let direction = Math.sign(this.targetX - this.x);
       
        // Will move horizontally if there is a distance to the ladder.
        if(direction === -1) {
            this.direction = "left"
        }
        
        if(direction === 1) {
            this.direction = "right";
        }

       
    }
     

    findNearestLadder() {
        let n = 0;
        let directionX = Math.sign(player.x - this.x);
        let offsetY = player.y > this.y ? 1 : 0;
        let tile = undefined;
        let tileY = Math.floor(this.y / 32);
        let tileX = Math.floor(this.x / 32);

        // Scan left or right.
        while(n < tileMap.width) {
           
            tile = tileMap.blocks[(tileY + offsetY) * tileMap.width + tileX + directionX * n];
            
            if(tile.name === "ladder") {
                //alert(tile.x);
                return tile.x;
            }

            if(tile.name === "wall") {
                break;
            }
            n++;
        }
        return this.x;
    }

    findNearestLadderOnFloor() {
       
        let junctionsUp = [];
        let junctionsDown = [];
        let junctions = [];
        let n = 1;
        let tileLeft = null; let tileRight = null;
        let tileLeftBelow = null; let tileRightBelow = null;

        let tileY = Math.floor(this.y / 32);
        let tileX = Math.floor(this.x / 32);

        // Include ladders at current position. Perhaps unnecessary.
       /* let tile = tileMap.blocks[tileY * tileMap.width + tileX];
        let tileBelow = tileMap.blocks[(tileY + 1) * tileMap.width + tileX];

        if(tile.name === "ladder") {
            junctionsUp.push(tile);
        }

         else if(tileBelow.name === "ladder") {
            junctionsDown.push(tile);
        }
       else {*/

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


        // Prioritize junctions up or down depending on where the player is.
       if(Math.floor(player.y/96) < this.floor) { // Player is global for now. Temporary fix because of a bug.
           junctions = junctionsUp.concat(junctionsDown);
           
       }
       else {
        junctions = junctionsDown.concat(junctionsUp);
       }

       if(junctions.length === 0) {
        return this.x;
       }

      // junctions.sort((a, b) => Math.abs(a.x - player.x) - Math.abs(b.x - player.x));
       return junctions[0].x;
    }
    

    

    draw() {   
         
          if(this.animation === null) {
            c.fillStyle = c.fillStyle = '#3498DB';;
            c.fillRect(this.x, this.y, 32, 32);
        }
        else {
            this.animation.animate(this.x, this.y);
             // For easier bug fixing. Remove later.
            c.font = "24px Arial";
            c.fillStyle = "yellow";
            c.fillText(this.currentState, this.x, this.y - 8);
        }
    }

     update(delta) {
        super.update();
 
         if (typeof this.animation.frame !== "number" || isNaN(this.animation.frame)) { this.animation.frame = 0; }

    this.animation.frame += this.velocity * delta * 0.03;
   
    if(this.velocity == 0) {
        this.animation.frame = 0;
    }
 
    /*
                     this.enemies.forEach(enemy => {
                    if(this.isCloseTo(enemy)) {
                        
                       // this.x += Math.sign(this.x - enemy.x) * 1;
                    
                            this.y += Math.sign(this.y - enemy.y) * 0.5;
                        
                    
                    }
                });*/
                
        const state = Object.freeze({
            CLIMB: "climb",
            FALL: "fall",
            SWING: "swing",
            IDLE: "idle",
            WALK: "walk",
            COLLECT: "collect",
            DECIDE: "decide",
            TRAPPED: "trapped"
        });

        switch(this.currentState) {
            // Climb
            case state.CLIMB:
                console.log("climb............");
                this.velocityX = 0; this.velocityY = 80 * delta;

                this.animation.setAnimationIndex(2);
                this.animation.length = 1;

                if(this.direction === "up") {
                    this.snapToLadder(this.x, this.y);

                    if(!this.isHittingRoof() && !this.isAtLadderTop()) {
                        this.shiftPosition(this.velocityX, -this.velocityY);
                        this.resolveLadderTop();
                        console.log("UP!");
                    }

                    this.animation.length = 2;
                }
              
                 if(this.direction === "down") {
                    this.snapToLadder(this.x, this.y);
                    this.shiftPosition(this.velocityX, this.velocityY);
                    this.resolveFloorCollision();

                     if(!this.isClimbingLadder()) {
                        this.currentState = "fall";
                    }

                    this.animation.length = 2;
                }

                if(this.direction === "left") {
                    this.currentState = "walk";
                }

                 if(this.direction=== "right") {
                    this.currentState = "walk";
                }

                 if(this.isAtLadderTop()) {
                   this.resolveLadderTop();
                    this.currentState = "idle"; // Set to idle when reaching the top of the ladder.
                    
                }

                if(this.isHittingFloor()) {
                    this.resolveFloorCollision();
                    this.currentState = "idle";
                }
                
                break;
            // Collect
             case state.COLLECT:
                    
             
                this.collectGold();
                this.hasGold = true;
                this.tileMap.draw(bgCtx);  
             
                
                              
                this.currentState = "idle";
                break;
            // Trapped
            case state.TRAPPED:
                
                console.log("TRAPPED");

                if(this.direction === "up") {

                    // tileMap.replaceTile(this.x, this.y, 3, "ladder"); 
                   
                      this.tileMap.draw(bgCtx); 

                    setTimeout(() => {
                            
                          this.y -= 33;
                     
                       
                      // TODO: How to check if the guards get stuck in the floor and to make them climb up again.
                      //if(tileMap.getTileBlock(this.x, this.y).id === 0) {
                       
                        // this.direction = "up";
                       this.currentState = "climb";
                         
                       
                     // }

                    //   else {
                    //      console.log(tileMap.getTileBlock(this.x, this.y));
                    //     this.y = 32; this.x = 400;
                    //     this.currentState = "fall";
                     
                    //   }
                       
                       
                    }, 2000);

                   this.direction = "";
                    
                }

                if(this.direction === "down") {
                    this.animation.setAnimationIndex(3);
                    this.animation.length = 1;
                    
                }
                else {
                    this.animation.setAnimationIndex(5);
                    this.animation.length = 2;
                 
                     
                }

                break;
            // Fall
             case state.FALL:    
                 console.log("state=FALL");
                 this.animation.setAnimationIndex(3);
                 this.animation.length = 1;

                 this.velocityX = 0; this.velocityY = this.fallSpeed * delta;
                          
                this.shiftPosition(this.velocityX, this.velocityY);
                
                if(this.isHittingFloor()) {
                        this.resolveFloorCollision();
                       
                        if(this.isTrapped()) {
            
                            tileMap.replaceTile(this.x, this.y, 10, "wall");
                             this.x = tileMap.getTileBlock(this.x, this.y).x;

                            if(this.hasGold) {
                             
                                tileMap.replaceTile(this.x, this.y - 32, 7, "gold");
                                this.hasGold = false;
                            }
                            tileMap.draw(bgCtx);
                                
                            // Set timeout for the escape.
                           setTimeout(() => {
                           
                            this.direction = "up";
                               
                           }, 4500);

                          
                           this.currentState = "trapped";
                           this.direction = "down";
                        }
                        else {
                        this.currentState = "idle";
                    }
                }
     
               else if(this.isClimbingLadder()) {
                   this.currentState = "climb";
               }
               
               else if(this.isCollectingGold() && !this.hasGold) {
                    this.currentState = "collect";
               }

               else if(this.isRopeSwinging()) {
                    this.currentState = "swing";
               }

                break;
            // Swing
            case state.SWING:
              
                this.animation.setAnimationIndex(4);
                this.animation.length = 1;
                this.velocityX = this.velocity * delta; this.velocityY = 0;

                if(this.direction === "left") {
                    this.shiftPosition(-this.velocityX, this.velocityY);
                    this.animation.length = 3;
                }

                if(this.direction === "right") {
                    this.shiftPosition(this.velocityX, this.velocityY);
                    this.animation.length = 3;
                }

                 if(this.direction === "down") {
                    this.currentState = "fall";
                }
               
                /*
                if(this.isClimbingLadder()) {
                    this.currentState = "idle";
                    this.direction = "";
                }*/

                if(!this.isRopeSwinging()) {
                    this.currentState = "fall";
                }
                break;
           
            // Walk
             case state.WALK:
                
                this.velocityY = 0;

                if(this.direction === "left") {
                         
                    this.velocityX = -this.velocity * delta; 
                   
                    if(this.x > 0 && !this.isHittingLeftWall()) {
                        this.shiftPosition(this.velocityX, this.velocityY);
                        this.resolveLeftWallCollision();
                    }
          
                    this.animation.setAnimationIndex(1); 
                }

               if(this.direction === "right") {
                     
                    this.velocityX = this.velocity * delta;
                    
                    if(this.x < 864 && !this.isHittingRightWall()) {
                        this.shiftPosition(this.velocityX, this.velocityY);  
                        this.resolveRightWallCollision();     
                    }

                     this.animation.setAnimationIndex(0); 
                }

                // Since this is done programmatically something other than keyboard must set to idle.
                 if(this.direction === "" || this.isClimbingLadder()) {
                         
                    this.currentState = "idle";
                }

                // animation    
                this.animation.length = 3;

               if(this.isFreefalling()) {
                this.currentState = "fall";
               }
                // on key up or velocity 0 return to idle.
                
                if(this.isCollectingGold() && !this.hasGold) {
                    this.currentState = "collect";
                }

                if(this.isRopeSwinging()) {
                    this.currentState = "swing";
                }
                break; 
            // Idle
            case state.IDLE:
              this.aiStep();
                console.log("IDLE");
               this.animation.length = 1;

                this.velocityX = 0;
                this.velocityY = 0;

                // Idle next to a ladder.
                if(this.direction === "up" || this.direction === "down") {
                   this.currentState = "climb"; 
                   
                   //this.snapToLadder();
                  // alert("climb");
                }
                else if(this.direction === "left" || this.direction === "right") {       
                    this.currentState = "walk";   
                }


                break;

                // decide
                case state.DECIDE:
                     
                      this.currentState = "idle";
                    break;
            
        }
        
       /* if(this.isRopeSwinging()) {
          this.aiStep();
        } */

      /* this.lastPlayerPosition.x = this.playerRef.x;
        this.lastPlayerPosition.y = this.playerRef.y;*/

         if(this.ignoreGravity) {
                    this.ignoreGravity = false;
                 }
                 else {
                    this.fallSpeed = 220;
                 }

        this.draw();
    }
    
}

const textString = await fetch(`http://127.0.0.1:5500/levels/level${level}.CSV`).then(r => r.text())
let rawMap = textString.split(",").map(m => m.trim());

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
const player = new Player(0,0, tileMap, {x: 300, y: 200});
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
let delta = 0;
function animate(time) {
   
   
    requestAnimationFrame(animate);
        
       

    delta = lastTime ? (time - lastTime) / 1000 : 0; // seconds
    delta = Math.min(delta, 0.017);
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
    // npc2.update(delta);
    // npc3.update(delta);

      
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





