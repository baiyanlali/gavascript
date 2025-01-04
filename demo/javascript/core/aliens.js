export const aliens_game = `
BasicGame block_size=5
    SpriteSet
        background > Immovable img=oryx/space1 hidden=True
        base    > Immovable    color=WHITE img=oryx/space5
        avatar  > FlakAvatar   stype=sam img=oryx/spaceship1 blueprint=Spaceship
        missile > Missile
            sam  > orientation=UP    color=BLUE singleton=True img=oryx/bullet2
            bomb > orientation=DOWN  color=RED  speed=0.5 img=oryx/bullet2
        alien   > Bomber       stype=bomb   prob=0.05  cooldown=3 speed=0.8  blueprint=UFO
            alienGreen > img=oryx/alien3
            alienBlue > img=oryx/alien1
        portal  > invisible=True hidden=True
            portalSlow  > SpawnPoint   stype=alienBlue  cooldown=16   total=20
            portalFast  > SpawnPoint   stype=alienGreen  cooldown=12   total=20
    
    LevelMapping
        . > background
        0 > background base
        1 > background portalSlow
        2 > background portalFast
        A > background avatar

    TerminationSet
        SpriteCounter      stype=avatar               limit=0 win=False
        MultiSpriteCounter stype1=portal stype2=alien limit=0 win=True
        
    InteractionSet
        avatar  EOS  > stepBack
        alien   EOS  > turnAround
        missile EOS  > killSprite

        base bomb > killBoth
        base sam > killBoth

        base   alien > killSprite
        avatar alien > killSprite scoreChange=-1
        avatar bomb  > killSprite scoreChange=-1
        alien  sam   > killSprite scoreChange=2`;

export const aliens_map = `
1.............................
000...........................
000...........................
..............................
..............................
..............................
..............................
....000......000000.....000...
...00000....00000000...00000..
...0...0....00....00...00000..
................A.............`;

export const sokoban_game = `
BasicGame square_size=40
    SpriteSet
        floor > Immovable img=newset/floor2 blueprint=VGDLFloor
        hole   > Immovable color=DARKBLUE img=oryx/cspell4 blueprint=VGDLHole
        avatar > MovingAvatar img=oryx/knight1
        box    > Passive img=newset/block1 shrinkfactor=0.8 blueprint=VGDLEnemy
        wall > Immovable img=oryx/wall3 autotiling=True blueprint=VGDLBrick
    LevelMapping
        H > floor hole
        C > floor box
        W > floor wall
        P > floor avatar
    InteractionSet
        avatar wall > stepBack
        box avatar  > bounceForward
        box hole    > killSprite scoreChange=1
        box wall box  > undoAll
    TerminationSet
        SpriteCounter stype=box    limit=0 win=True`

// export const sokoban_map = `
// wwwwwwwwwwwww
// w........w..w
// w...1.......w
// w...A.1.w.0ww
// www.w1..wwwww
// w.......w.0.w
// w.1........ww
// w..........ww
// wwwwwwwwwwwww`


export const sokoban_map = 
`
WWWWWWWWWWWW
W    W     W
W C  W  H  W
W    WW    W
W    W     W
W        WWW
W  P W  C HW
W   W      W
WWWWWWWWWWWW`

// export const fps_test = `
// BasicGame square_size=40 FPS=true
//     SpriteSet
//         floor > Immovable img=newset/floor2 blueprint=VGDLFloor
//         hole   > Immovable color=DARKBLUE img=oryx/cspell4 blueprint=VGDLHole
//         avatar > FPSAvatar img=oryx/knight1 speed=0.1
//         box    > Passive img=newset/block1 shrinkfactor=0.5 blueprint=VGDLEnemy
//         wall > Immovable img=oryx/wall3 autotiling=True blueprint=VGDLBrick
//     LevelMapping
//         H > floor hole
//         C > floor box
//         W > floor wall
//         P > floor avatar
//     InteractionSet
//         avatar wall > stepBack
//         box avatar  > bounceForward
//         box wall box  > undoAll
//         box hole    > killSprite scoreChange=1
//     TerminationSet
//         SpriteCounter stype=box    limit=0 win=True
// `
// export const aliens_game = `
// BasicGame
//     SpriteSet
//         floor > Immovable hidden=True img=oryx/grass autotiling=True
//         carcass > Immovable color=BROWN img=oryx/worm2 shrinkfactor=0.6
//         goat > stype=avatar
//             angry  > Chaser  color=ORANGE img=oryx/bird3
//             scared > Fleeing color=BLUE img=oryx/bird1
//         avatar > MovingAvatar img=oryx/princess1
//         wall > Immovable img=oryx/tree2

//     InteractionSet
//         goat   wall goat   > stepBack
//         avatar wall    > stepBack
//         avatar  angry  > killSprite scoreChange=-1
//         carcass scared > killSprite
//         scared avatar  > transformTo stype=carcass scoreChange=1
//         scared carcass > transformTo stype=angry

//     LevelMapping
//         0 > scared floor
//         . > floor
//         A > floor avatar
//         w > floor wall

//     TerminationSet
//         SpriteCounter stype=scared win=True
//         SpriteCounter stype=avatar win=False`

// export const aliens_map = `
// wwwwwwwwwwwwwwwwwwwwwwww
// wwww....w0..ww......0www
// w.....w.w.......ww....ww
// w...0...0.ww..A.www....w
// w.wwww.wwwww....ww...www
// w........w.........0..ww
// ww...w0.....ww...www...w
// ww....ww...wwww....w...w
// www..............w.....w
// wwwwww...0..wwwwww....ww
// wwwwwwwwwwwwwwwwwwwwwwww
// `