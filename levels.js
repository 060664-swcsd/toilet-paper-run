


class Level {
    constructor(
        spawnpoint = [0, 0],
        totalPapers = 2,
        grid = [],
        info = "example level"
    ) {
        this.spawnpoint  = spawnpoint;
        this.totalPapers = totalPapers;
        this.grid        = grid;
        this.info        = info;
    }

    infoText(width, height) {
        textSize(17);
        text(this.info, width / 2, height / 16)
    }
}


function onTPRunLoad() {
    // this will be binded to the game instance
    // and load our custom levels
    this.levels.push(new Level( // level 1
        [1, 5],
        2,
        _levelBoardFromStr(
`WWWWWWWWWW
W        W
W     WW W
W  P  W  W
W     W WW
W     W PW
WWWDWWWWWW`),
        'The pandemic has been rough\nThe bathroom had no more toilet paper\nAnd the store is running out\nAvoid all the crazies and rid the worries of running out on the toilet'
    ));
    this.levels.push(new Level( // level 2
        [1, 1],
        1,
        _levelBoardFromStr(
`WWWWWWWWWWDW
W        W W
W       BW W
W  B     W W
W     P BW W
W B B      W
W          W
WWWWWWWWWWWW`),
        "Beware of others\nSometimes they don't care about the mask mandate(s)\nTheir selfishness will lead to your downfall"
    ));


    this.levels.push(new Level(
        [1, 5],
        2,
        _levelBoardFromStr(
`WWWWWWW    WWW
WV    WWWWWWPW
W            W
W      B  B  W
W            W
W     WWWWWWPW
WWWDWWW    WWW`),
        `This encounter is unavoidable\nGrab the ${TILE_CORRESPONDANCE[ITEM_VACCINE]} Vaccine item, press your return key and\nPut them in their place\nSadly this strain has a rare form of vaccine immunity\nSo the effect only lasts 30s`
    ));

    this.levels.push(new Level(
        [1, 1],
        1,
        _levelBoardFromStr(
`WWWWWWWWWWWW
W W V WK  BW
W W   WWW WW
W         W
WWWWLWWWWDW
W       W
W BWBWB W
W   P   W
WWWWWWWWW`),
        `The toilet paper is ${TILE_CORRESPONDANCE[LOCKDOOR]} locked in a room with a bunch of people\nGrab the ${TILE_CORRESPONDANCE[ITEM_KEY]} Key to get out of this place`
    ));

    this.levels.push(new Level(
        [1, 1],
        6,
        _levelBoardFromStr(
`WDWWWWWWWWWWWWWW
W  WP V PWP    W
W  W     W   G W
WW WWWLWWWWWWW W
W     G      W W
W W   W   WW W W
W   W B W PW   W
W WG  W  GWWWB W
W   W P W  WP  W
WK  W   W BWWWWW
WWWWWWWWWWWW`),
        `The ${TILE_CORRESPONDANCE[GUARD]} Guards aren't happy that you're taking all this toilet paper\nAvoid them at all costs.\nYou learn that they only move every time you make 4 moves.`
    ));

    this.currentLevel = 4;
    
    //this.start();

    this.log("TPRunLoad" + this.toString());
}