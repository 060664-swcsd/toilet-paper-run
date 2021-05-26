
let TILESIZE = 27;

// constant enums for tile types
let ENUM = 0,
    E = () => 
        // quick function to return the incremented version of global ENUM
        // with parenthesis you can just wrap the addition call and return the second argument
        (
            ENUM += 1,
            ENUM
        )

const AIR   = ENUM; // 0
const WALL  = E();  // 1
const PAPER = E();  // etc
const DOOR  = E();
const LOCKDOOR = E();

// bystanders
const BYS1 = E(),
      BYS2 = E(),
      BYS3 = E(),
      BYSTANDERS = {
          [BYS1]: true,
          [BYS2]: true,
          [BYS3]: true
      };

const GUARD = E();

var randomProperty = (object) =>  {
    var keys = Object.keys(object);
    return object[keys[Math.floor(keys.length * Math.random())]];
};

// items
const ITEM_VACCINE = E(),
      ITEM_KEY = E(),
      ITEMS = {
          [ITEM_VACCINE]: true,
          [ITEM_KEY]: true
      };

// unicode characters of the tiles
const TILE_CORRESPONDANCE = {
    [AIR]  : "",
    [WALL] : "🧱",
    [PAPER]: "🧻",
    [DOOR] : "🚪",
    [LOCKDOOR] : "🔒",
    [BYS1] : "🧍",
    [BYS2] : "🧍‍♀️",
    [BYS3] : "👪",
    [GUARD] : "👮",

    [ITEM_VACCINE] : '💉',
    [ITEM_KEY    ] : '🗝️'
}


function _levelBoardFromStr(str) {
    let lines = str.split('\n');
    let level = [];
    let charmap = {
        [" "] : AIR,
        ["W"] : WALL,
        ["V"] : ITEM_VACCINE,
        ["P"] : PAPER,
        ["B"] : function() {
            let keys = Object.keys(BYSTANDERS);

            return +keys[Math.floor(Math.random() * keys.length)];
        },
        ["D"] : DOOR,
        ["K"] : ITEM_KEY,
        ["L"] : LOCKDOOR,
        ["G"] : GUARD,
    }
    for (var i = 0; i < lines.length; i++) {
        level[i] = lines[i].split('').map(function(element) {
            let t = charmap[element];
            if (t != null) {
                if (typeof t == "function") return t();
                else return t;
            }
            return AIR;
        });
    }
    return level;
}


class Game {
    constructor() {
        // this exists so that you can do new Game();
    
        this.startTime = Date.now();
        this.elapsedDT = 0;
        this.isPlaying = false;

        this.err       = null;
        this.debug     = true;

        //
        this.paperGoal               = 0;
        this.papers                  = 0;
        this.currentLevel            = 0;
        this.currentGrid             = [];
        this.levels                  = [];
        this.playerPosition          = [ 0, 0 ];
        this.playerLerpPosition      = [ 0, 0 ];
        this.playerItems             = [];

        this.guards                  = [];
        this.guardWantPosition       = [];
        this.guardsMoves             = 4;

        //
        this.selectedItem            = -1;
        this.cachedLevelWidthInTiles = -1;

        this.playerStartImmune       = -1;
        this.playerIsImmune          = false;
    }

    // toilet paper run core game functions
    log() {
        if (this.debug != true) return;

        console.log(Array.prototype.slice.call(arguments, 0).join("\t"));
    }

 

    // gets the longest row in a level
    // used for positioning
    getLongestRowInLevel() {
        if ((
            this.currentLevel < 0
                ||
            this.currentLevel > this.levels.length
        )) {
            this.isPlaying = false;
            this.err       = `Level out of bounds
[${this.currentLevel} out of ${this.levels.length}]`;
            return -1;
        }

        if (this.cachedLevelWidthInTiles === -1) {
            let curlvl = this.levels[this.currentLevel],
                length = 0;
            
            for (var i = 0; i < curlvl.grid.length; i++) {
                let row = curlvl.grid[i];
                if (length <= row.length) {
                    length = row.length;
                }
            }

            this.cachedLevelWidthInTiles = length;
            // return length;
        }

        return this.cachedLevelWidthInTiles;
    }

    getRandomGuardPosition(y, x) {
        let want = {
            [y + 0] : [ x + 1, x - 1 ],
            [y + 1] : [ x ],
            [y - 1] : [ x ]
        },
        legalPositions = [],
        grid = this.currentGrid;
    
        for (var row in want) {
            let choices = want[row];

            if (grid[row] === undefined)
                continue;
            
            for (var i = 0; i < choices.length; i++) {
                let xpos = choices[i];
                if (grid[row][xpos] != null && grid[row][xpos] === AIR)
                    legalPositions.push([parseInt(row), xpos]);
            }
        }

        if (legalPositions.length < 1) {
            return [y, x];
        }

        let r = Math.floor(Math.random() * legalPositions.length);
        return legalPositions[r];
    }

    loadLevel() {
        // load current grid into the game
        this.currentGrid = [];

        this.guards                  = [];
        this.guardWantPosition       = [];
        this.guardsMoves             = 5;

        let rlength = this.getLongestRowInLevel();
        let level   = this.levels[this.currentLevel];
        for (var x = 0; x < level.grid.length; x++) {
            this.currentGrid[x] = [];
            for (var y = 0; y < rlength; y++) {
                this.currentGrid[x][y] = level.grid[x][y];

            }
        }

        for (var x = 0; x < level.grid.length; x++) {
            for (var y = 0; y < rlength; y++) {
                if (level.grid[x][y] === GUARD) {
                    this.guards.push([y, x]);
                    this.guardWantPosition.push(this.getRandomGuardPosition(x, y));
                }
            }
        }
        console.log(this.guardWantPosition);

        this.isPlaying = true;
        this.papers    = 0;
        this.paperGoal = level.totalPapers;

        this.playerPosition    = [level.spawnpoint[0], level.spawnpoint[1]];
        this.lastDir           = [0, 0];
        this.playerItems       = [];
        this.playerStartImmune = -1;
        this.playerIsImmune    = false;
        this.selectedItem      = -1;
        this.log(`Loaded Level ${this.currentLevel + 1}`);
    }

    getCorrectDrawPos(x, y) {

        let wx = (height / 2) + (TILESIZE * y) - (this.currentGrid.length * TILESIZE) / 3;
        let wy = (width / 2) + (TILESIZE * x) - ((this.cachedLevelWidthInTiles - 1) * TILESIZE) / 2;

        return [wx, wy];

        /*
                wx = (height / 2) + (TILESIZE * y) - (this.currentGrid.length * TILESIZE) / 3,
                        wy = (width / 2) + (TILESIZE * x) - ((this.cachedLevelWidthInTiles - 1) * TILESIZE) / 2;
        
        */
    }

    // p5js logic to bind with game
    draw() {
        this.elapsedDT += deltaTime;

        //let width = WIDTH,
        //    height = HEIGHT;
        
        background(220);

        if (!this.isPlaying) {
            textSize(169);

            textAlign(CENTER)
            
            push()
                translate(width / 2, height / 2)
                rotate(radians(frameCount * 5));
                text(TILE_CORRESPONDANCE[PAPER], 0, 0);
            pop()

            if (this.err !== null) {
                fill('red');
                textSize(23);
                text(this.err, width / 2, height / 16) 
            }
        } else {
            let rlength = this.getLongestRowInLevel(),
                level = this.levels[this.currentLevel];

            // draw the little info text
            level.infoText?.apply(level, [width, height]);
            
            noStroke();

            let t;
            if (this.papers === this.paperGoal) {
                t = "Get to the door!";
                fill(0, 155, 0);
            } else {
                t = "Papers: " + this.papers + "/" + this.paperGoal;
            }
            text(t, width/2, height/(1+1/16));
            fill(0, 0, 0);

            if (this.playerIsImmune && (Date.now() - this.playerStartImmune) > 30000) {
                this.playerIsImmune = false;
                this.playerStartImmune = -1;
            }

            // draw the items
            textSize(20);
            text("Items:", width - width / 16, height / 2);
            
            for (var index = 0; index < this.playerItems.length; index++) {
                var item = this.playerItems[index],
                    wx = width - width / 16,
                    wy = height / 2 + (TILESIZE * (index + 2));
                
                text(TILE_CORRESPONDANCE[item], wx, wy);

                if (this.selectedItem != -1 && this.selectedItem === index) {
                    fill(255, 0, 0, 63.75) // * Math.abs(Math.sin(this.elapsedDT / 1024)));
                    ellipse(wx, wy - 8, TILESIZE * 2);
                    fill(0, 0, 0, 255);
                }
        
            }

            // draw the vaccine cooldown
            if (this.playerIsImmune) {
                var MAX = (2 * PI);
                var FRAC = ((Date.now() - this.playerStartImmune) / 1000) / 30;
                
                let x = width / 8 - 30
                let y = height / 2

                fill(255 * FRAC, 255 * (1 - FRAC), 0)
                arc(x, y, 60, 60, 0, MAX - MAX * FRAC, PIE);
                fill(0, 0, 0, 255)
                text(Math.floor(30 * (1 - FRAC)), x, y + 6)
            }

            // draw the tiles
            let NOUNICODE = false;

            textSize(NOUNICODE === false ? (TILESIZE - 2) : 7);
            for (var y = 0; y < this.currentGrid.length; y++) {
                for (var x = 0; x < rlength; x++) {


                    let tile = this.currentGrid[y][x];
                    let dp = this.getCorrectDrawPos(x, y),
                        wx = dp[0],
                        wy = dp[1];
                    if (tile in TILE_CORRESPONDANCE && !NOUNICODE) {
                        text(TILE_CORRESPONDANCE[tile], wy, wx);
                    } else {
                        text(NOUNICODE?`(${x},${y})`:``, wy, wx);
                    }
                    
                    if (BYSTANDERS[tile] === true && this.playerIsImmune === false) {
            
                        fill(0, 255, 0, 63.75 * Math.abs(Math.sin(this.elapsedDT / 1024)));
                        ellipse(wy, wx - 8, TILESIZE * 3);
                        fill(0, 0, 0, 255);
                    }

                        //console.log(tile);
                }
            }

            for (var pos in this.guardWantPosition) {
                let [y, x] = this.guardWantPosition[pos],
                    tile = this.currentGrid[y][x],
                    rWidth = 12;
                let dp = this.getCorrectDrawPos(x, y),
                    wx = dp[0],
                    wy = dp[1];
                    
                    fill(255, 0, 0, 200 * Math.abs(Math.sin(this.elapsedDT / 256)));
                    rect(wy - rWidth, wx - rWidth - 9, rWidth * 2, rWidth * 2);
                    fill(0, 0, 0, 255);
                
            }
            textSize(TILESIZE);

            // draw the player
            { 
                this.playerLerpPosition[0] = lerp(this.playerLerpPosition[0], this.playerPosition[0], 0.15);
                this.playerLerpPosition[1] = lerp(this.playerLerpPosition[1], this.playerPosition[1], 0.15);
                let [x, y] = this.playerLerpPosition;
                
                let dp = this.getCorrectDrawPos(x, y),
                    wx = dp[0],
                    wy = dp[1];
                text('🛒', wy, wx);
            }
            // console.log(level.infoText);
        }
    }

    getFilteredNeighbors(
        y = 0,
        x = 0,
        filter = () => true
    ) {
        // gets amount of similar tiles that pass the filter()

        let want = {
                [y + 0] : [ x + 1, x - 1 ],
                [y + 1] : [ x + 1, x - 1, x],
                [y - 1] : [ x + 1, x - 1, x]
            },
            n = 0,
            grid = this.currentGrid;
        
        for (var row in want) {
            let choices = want[row];

            if (grid[row] === undefined)
                continue;
            
            for (var i = 0; i < choices.length; i++) {
                let xpos = choices[i];
                if (grid[row][xpos] != null && filter(grid[row][xpos]))
                    n += 1;
            }
        }

        return n;
    }

    checkLevelCompletion() {
        // check our score and continue to next level if needed
        if (this.papers === this.paperGoal) {
            this.isPlaying     = false;
            this.currentLevel += 1;
            this.start();
        }

        // idk why this is here i thought it was implicit
        return -3;
    }

    pickupPaper(px, py) {
        let grid = this.currentGrid;
        
        grid[py][px] = AIR;

        this.papers += 1;
    }

    attemptMove(
        dirx = 0,
        diry = 0,
    ) {
        // dirx and diry represent the axis the player should move on
        // dx = 1 ? right : dx = 0 ? nowhere : left
        // dy = 1 ? down  : dy = 0 ? nowhere : up

        let grid     = this.currentGrid,
            px       = this.playerPosition[0],
            py       = this.playerPosition[1],
            ourTile  = grid[py][px],
            nextTile = grid[py + diry][px + dirx];

        // test case 1: idk how we are in a wall, but we're stuck
        if (ourTile === WALL)
            return -1;
        
        // test case 2: we're gonna move into a wall, locked door, or guard
        if (nextTile === WALL || nextTile === LOCKDOOR || nextTile === GUARD)
            return -2;

        // test case 3: we're hitting a door
        if (nextTile === DOOR) 
            return this.checkLevelCompletion();

        // test case 4: the next tile is toilet paper
        if (nextTile === PAPER)
            this.pickupPaper(px + dirx, py + diry);

        // test case 5: the next tile is an item
        if (ITEMS[nextTile] === true) {
            this.playerItems.push(nextTile);
            this.currentGrid[py + diry][px + dirx] = AIR;
        }

        // we have vaccine so treat bystanders as walls
        if (BYSTANDERS[nextTile] === true && this.playerIsImmune)
            return;
        
        // we're past all the test cases, attempt the move
        this.playerPosition[0] += dirx;
        this.playerPosition[1] += diry;

        // detect if we went into the path of bystanders
        let neighbors = this.getFilteredNeighbors(py + diry,
                                                  px + dirx,
                                                  (t) =>
                                                    BYSTANDERS[t] === true
                                                 );
        // if we're innoculated, then don't restart, else restart because that's not sanitary
        if (neighbors > 0 && !this.playerIsImmune) {
            this.isPlaying = false;
            this.start();
        }

        // todo: separate guard moving into next method
        this.guardsMoves -= 1;
        if (this.guardsMoves === 0) {
            // clear the grid of all the guards, then set the guards to the next position
            for (var pos in this.guards) {
                let guard = this.guards[pos];
                this.log("GUARD:", guard)
                grid[guard[1]][guard[0]] = AIR;
                this.guards = this.guards.slice(0);
            }

            let v = [];
            for (var pos2 in this.guardWantPosition) {
                let guard = this.guardWantPosition[pos2];
                this.log("GUARD2:", guard)
                grid[guard[0]][guard[1]] = GUARD;
                this.guards[pos2] = [guard[1],guard[0]];
                v.push(this.getRandomGuardPosition(guard[0], guard[1]));
            }

            this.guardWantPosition = v;



        } else if (this.guardsMoves < 0) {
            this.guardsMoves = 4;
        }

        return 1;
    }

    keyPressed() {
        // don't do anything if we aren't playing
        if (this.isPlaying === true) {
            // also don't do anything if we arent pressing
            // arrow keys
            let arrowKeys = [ LEFT_ARROW, RIGHT_ARROW,
                               UP_ARROW  , DOWN_ARROW ];
            
            if (arrowKeys.includes(keyCode)) {
                let kc = keyCode,
                    dx = kc === LEFT_ARROW ? -1 : (kc === RIGHT_ARROW ? 1 : 0),
                    dy = kc === UP_ARROW   ? -1 : (kc === DOWN_ARROW  ? 1 : 0);
                
                let res = this.attemptMove(dx, dy);
                this.log(`Moved? ${res === 1 ? "Yay" : res}`);
            }

            // 49-57 are 1-9
            // console.log(keyCode);
            if (keyCode > 48 && keyCode < 58) {
                let idx = keyCode - 49;
                
                if (idx > -1 && this.playerItems[idx] != null) {
                    if (this.selectedItem === idx) {
                        this.selectedItem = -1;
                        this.log("Deselected item: ", idx);
                    } else {
                        this.selectedItem = idx;
                        this.log("Selected item: ", idx);
                    }
                } else {
                    this.log("Invalid item: ", idx);
                }
            }

            // enter
            if (keyCode === 13) {
                // console.log("Enter pressed");
                if (this.selectedItem !== -1) {
                    // console.log("Used item: ", this.selectedItem)
                    let item = this.playerItems.splice(this.selectedItem, 1);
                    switch (item[0]) {
                        case ITEM_VACCINE : {
                            this.playerIsImmune = true;
                            this.playerStartImmune = Date.now();
                            this.log("Used vaccine");
                            alert("You feel better about yourself.\nYou are vaccinated for 30 seconds.");
                            break;
                        }
                        case ITEM_KEY : {
                            let [x, y] = this.playerPosition;
                            let want = {
                                [y + 0] : [ x + 1, x - 1 ],
                                [y + 1] : [ x + 1, x - 1, x],
                                [y - 1] : [ x + 1, x - 1, x]
                            },
                            found = false,
                            grid = this.currentGrid;
                        
                            for (var row in want) {
                                let choices = want[row];
                    
                                if (grid[row] === undefined)
                                    continue;
                                
                                for (var i = 0; i < choices.length; i++) {
                                    let xpos = choices[i];
                                    if (!found && grid[row][xpos] != null && grid[row][xpos] == LOCKDOOR) {
                                        found = true;
                                        grid[row][xpos] = AIR;
                                        alert("You opened a locked door.");
                                    }
                                }
                            }

                            if (!found)
                                this.playerItems.push(ITEM_KEY);

                            break;
                        }
                    }
                    this.selectedItem = -1;
                }
            }
        }
    }

    // just starts the game by loading the current level
    start() {
        this.cachedLevelWidthInTiles = -1;
        this.log(`Started Loading Level ${this.currentLevel + 1}`);

        setTimeout(this.loadLevel.bind(this), 500);
    }

    // binds game functions to p5 global functions
    // and calls canvas creation
    init() {
        /*
         * Fills the default p5.js functions with the game's functions.
         */

        this.log("p5js called setup.");

        createCanvas(650, 400);

        console.log("%cToilet Paper Run", "background: #00ccff; font-family: Arial; font-size: 42px; font-color: white;")
    }
}