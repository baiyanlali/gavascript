// export const aliens_game = `
// BasicGame block_size=10
//   SpriteSet
//     background > Immovable randomtiling=0.9 img=oryx/floor3 hidden=True
//     goal  > Immovable color=GREEN img=oryx/doorclosed1
//     key   > Immovable color=ORANGE img=oryx/key2
//     sword > OrientedFlicker limit=5 singleton=True img=oryx/slash1
//     movable >
//       avatar  > ShootAvatar   stype=sword frameRate=8
//         nokey   > img=oryx/swordman1_0
//         withkey > color=ORANGE img=oryx/swordmankey1_0
//       enemy >
//         monsterQuick > RandomNPC cooldown=2 cons=6 img=oryx/bat1
//         monsterNormal > RandomNPC cooldown=4 cons=8 img=oryx/spider2
//         monsterSlow > RandomNPC cooldown=8 cons=12 img=oryx/scorpion1
//     wall > Immovable autotiling=true img=oryx/wall3
//
//
//   LevelMapping
//     . > background
//     g > background goal
//     + > background key
//     A > background nokey
//     1 > background monsterQuick
//     2 > background monsterNormal
//     3 > background monsterSlow
//     w > wall
//
//
//   InteractionSet
//     movable wall  > stepBack
//     #nokey goal    > stepBack
//     goal withkey  > killSprite scoreChange=1
//     enemy sword > killSprite scoreChange=2
//     enemy enemy > stepBack
//     avatar enemy > killSprite scoreChange=-1
//     nokey key     > transformTo stype=withkey
//     key  avatar   > killSprite scoreChange=1
//
//   TerminationSet
//     SpriteCounter stype=goal   win=True
//     SpriteCounter stype=avatar win=False`
//
// export const aliens_map = `
// wwwwwwwwwwwww
// wA.......w..w
// w..w........w
// w...w...w.+ww
// www.w2..wwwww
// w.......w.g.w
// w.2.........w
// w.....2.....w
// wwwwwwwwwwwww`

export const aliens_game = `

BasicGame
    SpriteSet

        platforms > solid=True
            elevator > Missile orientation=UP speed=0.1 img=newset/floor3
            cloud    > Passive img=newset/cloud2 physicstype=CONT gravity=1.0 friction=0.02
            ground > Immovable color=DARKGRAY

        moving > physicstype=CONT gravity=1.0
            avatar > PlatformerAvatar img=newset/man1 mass=1 friction=0.1 jump_strength=3
            evil   >  orientation=LEFT gravity=0.5
                goomba     > Walker img=newset/zombie friction=0.0

        goal > Immovable img=oryx/mushroom2
        fire > Immovable img=oryx/fire1
        coin > Immovable img=oryx/gold1

        wall > Immovable solid=False color=DARKGRAY
            
    TerminationSet
        SpriteCounter stype=avatar    win=False
           
    InteractionSet

        coin avatar > killSprite scoreChange=1
        evil avatar > killIfFromAbove scoreChange=1
        avatar evil > killIfAlive
        evil EOS  > killSprite

        goal avatar > killSprite

        moving elevator > pullWithIt
        evil wall ground > wallReverse

        elevator EOS > wrapAround

        cloud avatar > bounceForward
        cloud wall ground fire > wallStop
        avatar wall ground > wallStop

        avatar cloud > wallStop
        avatar EOS fire > killSprite
        
    LevelMapping
        G > goal
        1 > goomba
        = > elevator
        l > cloud
        f > fire
        c > coin
        . > ground`;

export const aliens_map = `
wwwwwwwwwwwwwwwwwwwwwwwwwwww
w                          w
w                          w
w                          w
w                          w
w                          w
w                          w
w                          w
w                          w
w                          w
w                          w
w A                        w
w..........................w
wwwwwwwwwwwwwwwwwwwwwwwwwwww`;
