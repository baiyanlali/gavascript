// import { BasicGame } from './core/games.js';
import { VGDLParser } from './core/core.js';
import { aliens_game, aliens_map, sokoban_game, sokoban_map} from './core/aliens.js';
console.log("start gavascript main.js")

let parser= new VGDLParser()
let game = parser.parseGame(aliens_game)
game.buildLevel(aliens_map)


console.log("start gavascript")
globalThis.game = game
globalThis.startGame = game.startGame
globalThis.parser = parser
globalThis.get_full_state = () => {
    // const prev_time = globalThis.get_time.call()
    const result = game.getFullState()
    // console.log("get_full_state time: ", globalThis.get_time.call() - prev_time)
    return result
}
globalThis.update = (delta, now=false) => {
    // const prev_time = globalThis.get_time.call()
    game.update(delta, now=false)
    // console.log("update time: ", globalThis.get_time.call() - prev_time)
}
globalThis.presskey = game.presskey
globalThis.presskeyUp = game.presskeyUp
export default { parser, game }