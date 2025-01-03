// import { BasicGame } from './core/games.js';
import { VGDLParser } from './core/core.js';
import { aliens_game, aliens_map} from './core/aliens.js';
console.log("start gavascript main.js")

let parser= new VGDLParser()
let game = parser.parseGame(aliens_game)
game.buildLevel(aliens_map)


console.log("start gavascript")
globalThis.game = game
globalThis.game_start = game.run
globalThis.parser = parser
globalThis.get_full_state = game.getFullState
globalThis.update = game.update
globalThis.presskey = game.presskey
globalThis.presskeyUp = game.presskeyUp
export default { parser, game }