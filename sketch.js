let ENUM = 0;
E=_=>(ENUM+=1,ENUM)

const AIR = ENUM;
const WALL = E();
const PAPER = E();
const DOOR = E();
// bystanders
const BYS1 = E();
const BYS2 = E();
const BYS3 = E();
const BYS4 = E();
const BYS5 = E();

let DELTA = 0;

let TILE_COR = {
  [AIR]: "",
  [WALL]: "🧱",
  [PAPER]: "🧻",
  [DOOR]: "🚪",//
  [BYS1]: "🧍",
  [BYS2]: "🧍‍♀️",
  [BYS3]: "👪",
  [BYS4]: "",
  [BYS5]: ""
}

let BYSTANDERS = {
  [BYS1]: true,
  [BYS2]: true,
  [BYS3]: true,
  [BYS4]: true,
  [BYS5]: true
  
}

let LV1 = {
  grid: [
    [WALL, WALL, WALL, WALL , WALL, WALL, WALL, WALL, WALL , WALL],
    [WALL, AIR , AIR , AIR  , AIR , AIR , AIR , AIR , AIR  , WALL],
    [WALL, AIR , AIR , AIR  , AIR , AIR , WALL, WALL, AIR  , WALL],
    [WALL, AIR , AIR , PAPER, AIR , AIR , WALL, AIR , AIR  , WALL],
    [WALL, AIR , AIR , AIR  , AIR , AIR , WALL, AIR , WALL , WALL],
    [WALL, AIR , AIR , AIR  , AIR , AIR , WALL, AIR , PAPER, WALL],
    [WALL, WALL, WALL, DOOR , WALL, WALL, WALL, WALL, WALL , WALL],
  ],
  spawnpoint: [1, 5],
  total_papers: 2, // todo: not hardcode
  info: (width, height) => {
    textSize(17);
    text('The pandemic has been rough\nThe bathroom had no more toilet paper\nAnd the store is running out\nAvoid all the crazies and rid the worries of running out on the toilet', width/2, height/16);
  }
}

let LV2 = {
  grid: [
    [WALL, WALL, WALL, WALL, WALL, WALL, WALL , WALL, WALL, WALL, DOOR, WALL],
    [WALL, AIR , AIR , AIR , AIR , AIR , AIR  , AIR , AIR , WALL, AIR , WALL],
    [WALL, AIR , AIR , AIR , AIR , AIR , AIR  , AIR , BYS2, WALL, AIR , WALL],
    [WALL, AIR , AIR , BYS1, AIR , AIR , AIR  , AIR , AIR , WALL, AIR , WALL],
    [WALL, AIR , AIR , AIR , AIR , AIR , PAPER, AIR , BYS1, WALL, AIR , WALL],
    [WALL, AIR , BYS2, AIR , BYS3, AIR , AIR  , AIR , AIR , AIR , AIR , WALL],
    [WALL, AIR , AIR , AIR , AIR , AIR , AIR  , AIR , AIR , AIR , AIR , WALL],
    [WALL, WALL, WALL, WALL, WALL, WALL, WALL , WALL, WALL, WALL, WALL, WALL],
  ],
  spawnpoint: [1, 1],
  total_papers: 1,
  info: (width, height) => {
    textSize(17);
    text("Beware of others\nSometimes they don't care about the mask mandate(s)\nTheir selfishness will lead to your downfall", width / 2, height / 16)
  }
}

let LEVELS = [LV1, LV2];
let CURLVL = 0;
let CURGRID = []
let WIDTH = 650;
let HEIGHT = 400;
let PLAYING = false;
let GOAL = 0;
let PAPERS = 0;

let err = null;

function valid_level() {
  return !(CURLVL < 0 || CURLVL > LEVELS.length)
}

let LONGEST_CACHE = null;
function determine_level_width() {
  if (!valid_level()) {
    err = `Level out of bounds\n[${CURLVL} out of ${LEVELS.length}]`;
    return;
  }
  let level = LEVELS[CURLVL];
  let length = 0;
  for (var i = 0; i < level.grid.length; i++) {
    row = level.grid[i];
    if (length <= row.length)
      length = row.length;
  }
  if (!LONGEST_CACHE)
    LONGEST_CACHE = length;
  return length
}

function get_level() {
  determine_level_width()
  if (err != null) return;
  var ld = LEVELS[CURLVL];
  PLAYING = true;
  player_pos[0] = ld.spawnpoint[0];
  player_pos[1] = ld.spawnpoint[1];
  PAPERS = 0;
  GOAL = ld.total_papers;
  // copy the grid
  CURGRID = []
  for (var x = 0; x < ld.grid.length; x++) {
    CURGRID[x] = []
    for (var y = 0; y < ld.grid[x].length; y++) {
      CURGRID[x][y] = ld.grid[x][y];
    }
  }
  console.log("Started", CURLVL);
  console.log("Total level width:", LONGEST_CACHE)
}

function setup()
{
  console.log(PAPER);
  createCanvas(WIDTH, HEIGHT);
  //🧻
//🛒
  
  setTimeout(get_level, 500);
  if (typeof onTPRunLoad !== "undefined") {
    onTPRunLoad();
  }
}

let tile_size = 26;
let player_pos = [0,0],
lerp_pos = [0, 0];



function draw()
{ 
  DELTA += deltaTime;
  background(220);
  if (!PLAYING)
    return;
  textAlign(CENTER)

  if (err != null) {
    text(err, width/2, height/2);
    return;
  }

  var ld = LEVELS[CURLVL];

  // draw level routine
  
  textSize(tile_size - 2);

  for (var x = 0; x < CURGRID.length; x++) {
    let row = CURGRID[x];
    for (var y = 0; y < row.length; y++) {
      let tile = row[y];
      let wx = width / 2 + tile_size * y - (tile_size * LONGEST_CACHE / 2.25);
      let wy = height / 1.5 + tile_size * x - (tile_size * ld.grid.length / 2);  
      
      if (tile in TILE_COR) {
        text(TILE_COR[tile], wx, wy);
      }
      // textSize(10);
      // text(""+y+","+x, wx, wy);
      
      if (BYSTANDERS[tile] != null) {
        noStroke();
        fill(0, 255, 0, 63.75 * Math.abs(Math.sin(DELTA / 1024)));
        ellipse(wx, wy - 8, tile_size * 3);
        fill(0, 0, 0, 255);

        //console.log("Bystanders");
        //let n = neighbors(y, x, () => true)
      }
    }
  }

  let t;
  if (PAPERS === GOAL)
    t = "Get to the door!";
  else
    t = "" + PAPERS + "/" + GOAL;
  text(t, width/2, height/(1+1/16));


  text(frameCount, 10, 10);
  
  // draw the player
  { 
    //console.log(lerp_pos)
    lerp_pos[0] = lerp(lerp_pos[0], player_pos[0], 0.15);
    lerp_pos[1] = lerp(lerp_pos[1], player_pos[1], 0.15);
    let x = lerp_pos[0];
    let y = lerp_pos[1];
    let wx = width / 2 + tile_size * x - (tile_size * LONGEST_CACHE / 2.25);
    let wy = height / 1.5 + tile_size * y - (tile_size * ld.grid.length / 2);  
    text('🛒', wx, wy);
  }

  ld.info(width, height);
}

function neighbors(y, x,

  filter = (tile) => tile != AIR

) {
  
    let n = 0;

  //
  // 2 # 1
  // 

  let pos = {
    [y]: [x + 1, x - 1],
    [y + 1]: [x, x + 1, x - 1],
    [y - 1]: [x, x + 1, x - 1]
  }

  let grid = CURGRID;

  for (var row in pos) {
    //console.log(row);
    let others = pos[row];

    if (grid[row] === undefined)
      continue;

    for (var i = 0; i < others.length; i++) {
      let xpos = others[i];
      
      if (grid[row][xpos] != null && filter(grid[row][xpos]))
        n += 1;
    }
  }

  return n;
}

function attemptMove(dirx, diry) {
  // dont move if game isn't even started
  if (!PLAYING)
    return;
  
  let grid = CURGRID;
  let [px, py] = player_pos;
  let current_tile = grid[py][px];
  let next_tile = grid[py + diry][px + dirx];

  // get the neighbors of the next tile to count for
  // bystanders
  let neighbors_of_next = neighbors(py + diry, px + dirx, (t) => BYSTANDERS[t] != null);
  console.log(neighbors_of_next);

  // we cant move while we're inside a wall
  // TODO: kill
  if (current_tile === WALL)
    return;
  
  // we cant move into a wall
  if (next_tile === WALL)
    return;

  // if toilet paper, update score
  if (next_tile === PAPER) {
    console.log("Pick up paper!");
    grid[py + diry][px + dirx] = AIR;
    PAPERS += 1;
  }

  // if we hit a door
  if (next_tile === DOOR) {
    // check if we have enough toilet papers
    console.log(PAPERS, GOAL);
    if (PAPERS >= GOAL) {
      PLAYING = false;
      CURLVL += 1;
      setTimeout(get_level, 500);
    } else {
      return;
    }
  }
    
  // if we haven't returned by now, then update player position
  player_pos[0] += dirx;
  player_pos[1] += diry;

  // if that worked and didnt return, then we have a problem
  if (neighbors_of_next > 0) {
    // todo: yuck message
    PLAYING = false;
    setTimeout(get_level, 1500);
  }
  return true;
}

function keyPressed() {
  if (keyCode === LEFT_ARROW) {
    attemptMove(-1, 0);
  } else if (keyCode === RIGHT_ARROW) {
    attemptMove(1, 0);
  } else if (keyCode === UP_ARROW) {
    attemptMove(0, -1);
  } else if (keyCode === DOWN_ARROW) {
    attemptMove(0, 1);
  }
}
