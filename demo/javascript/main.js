// import { BasicGame } from './core/games.js';
import { VGDLParser } from './core/core.js';
import { aliens_game, aliens_map} from './core/aliens.js';
console.log("start gavascript main.js")
try {
    let parser= new VGDLParser()
    const game = parser.parseGame(aliens_game)
    game.buildLevel(aliens_map)
} catch (error) {
    console.log(error.message)
}

// const tickPerSecond = 1/5;
// console.log(game.FPS)
console.log("start gavascript")