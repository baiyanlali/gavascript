import { defaultDict, includesArray, initializeDistribution } from "./tools.js";
import { colorDict, DARKGRAY, GOLD } from "./ontology/constants.js";
import { EOS, Immovable, VGDLSprite } from "./ontology/vgdl-sprite.js";
import { MovingAvatar } from "./ontology/avatar.js";
import { Termination } from "./ontology/termination.js";
import { scoreChange, stochastic_effects } from "./ontology/effect.js";
import { Resource } from "./ontology/resource";
import { ContinuousPhysics, distance, quickDistance } from "./ontology/physics.js";

const MAX_SPRITES = 10000;

export class BasicGame {
  default_mapping = {
    w: ["wall"],
    A: ["avatar"],
  };

  block_size = 10;
  load_save_enabled = true;
  disableContinuousKeyPress = true;
  image_dir = "../sprites";

  args = {};

  score = 0;
  bonus_score = 0;
  real_start_time = 0;
  real_time = 0;
  time = 0;
  ended = false;
  num_sprites = 0;
  kill_list = [];
  all_killed = [];

  frame_rate = 20;

  sprite_constr = {
    wall: [Immovable, { color: DARKGRAY }, ["wall"]],
    avatar: [MovingAvatar, {}, ["avatar"]],
  };

  // z-level of sprite types (in case of overlap)
  sprite_order = ["wall", "avatar"];

  // contains instance lists
  /**
   * @type {Object.<string, VGDLSprite[]>}
   */
  sprite_groups = {};
  // which sprite types (abstract or not) are singletons?
  singletons = [];
  // collision effects (ordered by execution order)
  collision_eff = [];
  collision_types = [];

  playback_actions = [];
  playbacx_index = 0;
  // for reading levels
  char_mapping = {};
  // temination criteria
  terminations = [new Termination()];
  // conditional criteria
  conditions = [];
  // resource properties
  resources_limits = new defaultDict(2);
  resources_colors = new defaultDict(GOLD);

  is_stochastic = false;
  _lastsaved = null;
  win = null;
  effectList = []; // list of effects this happened this current time step
  spriteDistribution = {};
  movement_options = {};
  all_objects = null;

  lastcollisions = {};
  steps = 0;
  gameStates = [];
  realGameStates = [];
  keystate = {};
  EOS = new EOS();
  sprite_bonus_granted_on_timestep = -1; // to ensure you only grant bonus once per timestep (since you check _isDone() multiple times)
  timeout_bonus_granted_on_timestep = -1; // to ensure you only grant bonus once per timestep (since you check _isDone() multiple times)

  shieldedEffects = {};
  paused = true;

  FPS = false;
  use_frame = false;

  objectTypes = {};

  no_players = 1;

  ignoredattributes = [
    "stypes",
    "name",
    "lastmove",
    // 'color',
    "lastrect",
    "resources",
    "physicstype",
    "physics",
    "rect",
    "alternate_keys",
    "res_type",
    "stype",
    "ammo",
    "draw_arrow",
    "shrink_factor",
    "prob",
    "is_stochastic",
    "cooldown",
    "total",
    "is_static",
    "noiseLevel",
    "angle_diff",
    "only_active",
    "airsteering",
    "strength",
  ];

  constructor(args) {
    this.args = args;

    for (const argsKey in args) {
      this[argsKey] = args[argsKey];
    }

    this.reset();
  }

  reset = () => {
    this.score = 0;
    this.bonus_score = 0;
    this.real_start_time = 0;
    this.real_time = 0;
    this.time = 0;
    this.ended = false;
    this.num_sprites = 0;
    this.kill_list = [];
    this.all_killed = [];
    this.paused = true;
    this.shieldedEffects = {};
  };

  resetLevel = () => {
    this.reset();
    this.buildLevel(this.level);
  };

  buildLevel = (lstr) => {
    let lines = lstr
      .split("\n")
      .map((l) => {
        return l.trimEnd();
      })
      .filter((l) => {
        return l.length > 0;
      });
    let lengths = lines.map((line) => line.length);

    // console.assert(Math.min.apply(null, lengths) === Math.max.apply(null, lengths), "Inconsistent line lengths");

    this.width = Math.max(...lengths);
    this.height = lines.length;

    // console.assert(this.width > 1 && this.height > 1, "Level too small");

    //Set up resources
    for (let res_type in this.sprite_constr) {
      if (!this.sprite_constr.hasOwnProperty(res_type)) continue;
      let [sclass, args, _] = this.sprite_constr[res_type];
      if (new sclass(0, 0, args) instanceof Resource) {
        if (args["res_type"]) {
          res_type = args["res_type"];
        }
        if (args["color"]) {
          this.resources_colors[res_type] = args["color"];
        }
        if (args["limit"]) {
          this.resources_limits[res_type] = args["limit"];
        }
      } else {
        this.sprite_groups[res_type] = [];
        this.sprite_constr[res_type][1]["Z"] =
          this.sprite_order.indexOf(res_type);
      }
    }

    // create sprites
    lines.forEach((line, row) => {
      for (const col in line) {
        let c = line[col];
        if (c in this.char_mapping) {
          const pos = [parseInt(col), row];
          this._createSprite(this.char_mapping[c], pos);
        } else if (c in this.default_mapping) {
          const pos = [parseInt(col), row];
          this._createSprite(this.default_mapping[c], pos);
        }
      }
    });

    this.kill_list = [];

    this.collision_eff.forEach((item) => {
      const effect = item[2];
      if (stochastic_effects.indexOf(effect) !== -1) this.is_stochastic = true;
    });

    this.level = lstr;

    // console.log(this.sprite_order)
  };

  getPath = (start, end) => {};

  randomizeAvatar = () => {
    if (this.getAvatars().length === 0) this._createSprite(["avatar"], [0, 0]);
  };

  current_avatar_idx = 0;

  _createSprite = (keys, pos) => {
    let res = [];
    keys.forEach((key) => {
      if (this.num_sprites > MAX_SPRITES) {
        console.log("Sprite limit reached.");
        return;
      }
      let [sclass, args, stypes] = this.sprite_constr[key];
      let anyother = false;

      stypes.reverse().forEach((pk) => {
        if (this.singletons.contains(pk)) {
          if (this.numSprites(pk) > 0) {
            anyother = true;
          }
        }
      });
      if (anyother) return;
      args.key = key;
      let s = new sclass(pos, [1, 1], args);
      s.stypes = stypes;

      if(s instanceof MovingAvatar){
        s.playerID = this.current_avatar_idx;
        this.current_avatar_idx += 1;
      }

      if (this.sprite_groups[key]) this.sprite_groups[key].push(s);
      else this.sprite_groups[key] = [s];
      this.num_sprites += 1;
      if (s.is_stochastic) this.is_stochastic = true;
      res.push(s);
    });

    return res;
  };

  _createSprite_cheap = (key, pos) => {
    const [sclass, args, stypes] = this.sprite_constr[key];
    const s = new sclass(pos, [1, 1], args);
    s.stypes = stypes;
    this.sprite_groups[key].push(s);
    this.num_sprites += 1;
    return s;
  };

  _iterAll = (ignoreKilled = false, filter_noncollision = false) => {
    if (this.sprite_order[this.sprite_order.length - 1] !== "avatar") {
      this.sprite_order.remove("avatar");
      this.sprite_order.push("avatar");
    }
    /**
     * @type {VGDLSprite[]}
     */
    const result = this.sprite_order.reduce((base, key) => {
      if (this.sprite_groups[key] === undefined) return base;
      if (ignoreKilled) {
        return base.concat(
          this.sprite_groups[key].filter((s) => !this.kill_list.includes(s)),
        );
      }
      return base.concat(this.sprite_groups[key]);
    }, []);

    if (filter_noncollision) {
      return result.filter((s) => 
        s.stypes.filter(x => this.collision_types.includes(x)).length > 0
      )
    }
    return result;
  };

  _iterAllExcept = (keys) => {
    if (this.sprite_order[this.sprite_order.length - 1] !== "avatar") {
      this.sprite_order.remove("avatar");
      this.sprite_order.push("avatar");
    }

    return this.sprite_order.reduce((base, key) => {
      if (key in keys) return base;
      if (this.sprite_groups[key] === undefined) return base;
      return base.concat(this.sprite_groups[key]);
    }, []);
  };

  numSprites = (key) => {
    const deleted = this.kill_list.filter((s) => {
      return s.stypes[key];
    }).length;
    // if (key in this.sprite_groups) {
    //     //避免找父类情况
    //     if(this.sprite_groups[key].length !== 0)
    //         return this.sprite_groups[key].length-deleted;
    // }

    return (
      this._iterAll().filter((s) => {
        return s.stypes.contains(key);
      }).length - deleted
    ); // Should be __iter__ - deleted
  };

  /**
   *
   * @param {string} key sprite type
   * @returns {list[Object]}
   */
  getSprites = (key) => {
    if (this.sprite_groups[key] instanceof Array)
      return this.sprite_groups[key].filter((s) => {
        return this.kill_list.indexOf(s) === -1;
      });
    else
      return this._iterAll().filter((s) => {
        return s.stypes.contains(key) && this.kill_list.indexOf(s) === -1;
      });
  };

  getAvatars = (key) => {
    const res = [];
    if (this.sprite_groups.hasOwnProperty(key)) {
      const ss = this.sprite_groups[key];
      if (ss && ss[0] instanceof MovingAvatar)
        res.concat(ss.filter((s) => this.kill_list.indexOf(s) === -1));
    }
    return res;
  };

  getSubTypes = (key) => {
    const getSub = (dict, key) => {
      if (dict.hasOwnProperty(key)) {
        return dict[key];
      } else if (Object.keys(dict).length === 0) {
        return null;
      } else {
        let result = null;
        for (const child in dict) {
          const a = getSub(dict[child], key);
          if (a !== null) result = a;
        }
        return result;
      }
    };
    return getSub(this.objectTypes, key);
  };

  getObjects = () => {
    const obj_list = {};
    const fs = this.getFullState();
    const obs = Object.copy(fs["objects_cur"]);

    for (let obj_type in obs) {
      this.getSprites(obj_type).forEach((obj) => {
        const features = {
          color: colorDict[obj.color.toString()],
          row: [obj.location.y],
        };
        const type_vector = {
          color: colorDict[obj.color.toString()],
          row: [obj.location.y],
        };
        obj_list[obj.ID] = {
          sprite: obj,
          position: [obj.location.x, obj.location.y],
          features: features,
          type: type_vector,
        };
      });
    }

    return obj_list;
  };

  getFullState = () => {
    const ias = this.ignoredattributes;
    const obs = {};
    const killed = {};
    /**
     * @type {VGDLSprite[]}
     */
    const objects = [];
    const actions = Object.keys(this.keystate).filter((key) => {
      return this.keystate[key];
    });
    this.steps += actions.length;

    for (const key in this.sprite_groups) {
      if (!this.sprite_groups.hasOwnProperty(key)) continue;
      const ss = {};
      const order = this.sprite_order.indexOf(key);
      this.getSprites(key).forEach((s) => {
        const attrs = {};
        Object.keys(s).forEach((a) => {
          let val = s[a];
          if (ias.indexOf(a) === -1) {
            attrs[a] = val;
          }
          attrs["Z"] = order;
        });
        if (s.resources) {
          attrs["resources"] = s.resources; // Should be object
        }

        ss[s.ID] = Object.copy(attrs);
        objects.push(s);
      });
      obs[key] = Object.copy(ss);
    }

    const object_cur = Object.copy(obs);

    return {
      frame: this.time,
      score: this.bonus_score,
      ended: this.ended,
      win: this.win,
      objects: objects,
      objects_cur: object_cur,
      killed: killed,
      actions: actions,
      events: this.effectList,
      real_time: this.real_time,
    };
  };

  /**
   * Updates all sprites in the game.
   * @param {number} delta - The time delta since the last update.
   * This method iterates through all sprites and calls their update method, passing the game instance.
   * If a sprite is not crashed, it will be updated; otherwise, it is skipped.
   */
  _updateAll = (delta) => {
    this._iterAll().forEach((sprite) => {
      // try {
      if (!sprite.crashed) sprite.update(this, delta);
      // } catch (err) {
      //     if ((!sprite.crashed)) {
      //         console.error('could not update', sprite.name)
      //         throw err
      //         sprite.crashed = true;
      //     }

      // }
    });
  };

  _subUpdate = (sub_idx, sum_idx) => {
    this._iterAll().forEach((sprite) => {
      if (!sprite.crashed) sprite.subUpdate(this, sub_idx, sum_idx);
    });
  }

  _clearAll = (onscreen = true) => {
    this.kill_list.forEach((s) => {
      this.all_killed.push(s);
      this.sprite_groups[s.name].remove(s);
    });

    this.kill_list = [];
    this.shieldedEffects = {};
  };

  _updateCollisionDict = (changedsprite) => {
    for (let key in changedsprite.stypes) {
      if (key in this.lastcollisions) delete this.lastcollisions[key];
    }
  };

  _terminationHandling = () => {
    let break_loop = false;
    this.terminations.forEach((t) => {
      //if (break_loop) return;
      if (break_loop) return;
      const [ended, win] = t.isDone(this);

      this.ended = ended;
      if (this.ended) {
        if (win) {
          //if (this.score <= 0)
          //this.score += 1;
          this.win = true;
        } else {
          //this.score -= 1;
          this.win = false;
        }
        break_loop = true;
      }
    });
  };

  _getAllSpriteGroups = () => {
    const lastcollisions = {};

    this.collision_eff.forEach((eff) => {
      const [class1, class2, effect, kwargs] = eff;

      [class1, class2].forEach((sprite_class) => {
        if (!(sprite_class in lastcollisions)) {
          let sprite_array = [];
          if (sprite_class in this.sprite_groups) {
            sprite_array = this.sprite_groups[sprite_class].slice();
          } else {
            const sprites_array = [];
            Object.keys(this.sprite_groups).forEach((key) => {
              const sprites = this.sprite_groups[key].slice();
              if (sprites.length && sprites[0].stypes.contains(sprite_class)) {
                sprite_array = sprite_array.concat(sprites);
              }
            });
          }
          lastcollisions[sprite_class] = sprite_array;
        }
      });
    });
    return Object.assign(lastcollisions, this.sprite_groups);
  };

  _multi_effect = () => {
    function r(sprite, partner, game, kwargs) {
      let value;
      for (let i = 0; i < arguments.length; i++) {
        value = arguments[i](sprite, partner, game, kwargs);
      }
      return value;
    }
    return r;
  };

  get_effect = (stypes1, stypes2) => {
    const res = [];
    this.collision_eff.forEach((eff) => {
      const class1 = eff[0];
      const class2 = eff[1];
      const eclass = eff[2];

      if (
        this.shieldedEffects[class1] && includesArray(this.shieldedEffects[class1], [class2, eclass])
      ) {
        // console.log(
        //   `[GAMES] Check shield ${class1}, ${class2}, return`,
        // );
        return;
      }

      if (stypes1.includes(class1) && stypes2.includes(class2))
        res.push({ reverse: false, effect: eff[2], kwargs: eff[3] });
      else if (stypes1.includes(class2) && stypes2.includes(class1))
        res.push({ reverse: true, effect: eff[2], kwargs: eff[3] });
    });
    return res;
  };

  _effectHandling = () => {
    //最多处理碰撞7次
    for (let iter_time = 0; iter_time < 7; iter_time++) {
      // console.log("EffectHandling", iter_time)
      this.updateCollision();

      if (this.collision_set.length === 0) return;

      // 确保collision按照顺序执行
      for(let eff of this.collision_eff){
        const class1 = eff[0]
        const class2 = eff[1]
        const eclass = eff[2]
        const used_collision = [];
        for (const collision of this.collision_set) {
          const stypes1 = collision[0].stypes;
          const stypes2 = collision[1].stypes;

          let effects = [];

          if (collision[1] === "EOS" || collision[1] === "eos") {
              if (
                stypes1.includes(class1) &&
                (class2 === "EOS" || class2 === "eos")
              )
                effects = [{ reverse: false, effect: eff[2], kwargs: eff[3] }];
          } 
          else {
            if (
              this.shieldedEffects[class1] && includesArray(this.shieldedEffects[class1], [class2, eclass])
            ) {
              return;
            }
      
            if (stypes1.includes(class1) && stypes2.includes(class2))
              effects.push({ reverse: false, effect: eff[2], kwargs: eff[3] });
            else if (stypes1.includes(class2) && stypes2.includes(class1))
              effects.push({ reverse: true, effect: eff[2], kwargs: eff[3] });
          };
        
          if (effects.length === 0) continue;
          used_collision.push(collision);
          for (const effect_set of effects) {
            let [sprite, partner] = [collision[0], collision[1]];
            if (effect_set.reverse) {
              [sprite, partner] = [collision[1], collision[0]];
            }

            effect_set.effect(sprite, partner, this, effect_set.kwargs);
          }
        }
        // this.collision_set = this.collision_set.filter((c) => !used_collision.includes(c));
      }
      this.collision_set = [];
    }
      
  };

  run = (on_game_end) => {
    this.on_game_end = on_game_end;
    return this.startGame;
  };

  presskey = (keyCode, playerID = 0) => {
    // console.log(`Press Button: ${keyCode}`)
    if (this.key_handler === "Pulse") return;
    const key = `${keyCode}${playerID}`;
    // console.log(`Presskey`, key)
    this.keystate[key] = true;
    // this.key_to_clean?.push(key);
    // if (this.key_handler === "Pulse") {
    //   this.update(0, true);
    // }
  };

  presskeyUp = (keyCode, playerID = 0) => {
    const key = `${keyCode}${playerID}`;
    if (this.key_handler === "Pulse") {
      this.keystate[key] = true;
      this.key_to_clean?.push(key);
      return;
    }
    this.keystate[key] = false;
    this.key_to_clean?.push(key);
    // this.update(0, true)
  };

  // updateTime = 1000 / 10;
  updateTime = 1/15;
  currentTime = 0;

  collision_set = [];

  addCollisions = (a, b) => {
    return;
  };

  addShield = (a, stype, ftype) => {

    for(const a_type of a){
      if(!this.shieldedEffects[a_type])
        this.shieldedEffects[a_type] = []
      if(includesArray(this.shieldedEffects[a_type], [stype, ftype])) continue;
      this.shieldedEffects[a_type].push([stype, ftype]);
    }
    // console.log("add shield", a, stype, ftype, this.shieldedEffects)
  };

  updateCollision = () => {
    //TODO: 使用最简单的方法实现，到非格子的方法可能会有问题
    // console.log("iter all")
    const allSprites = this._iterAll(true, true);
    
    // console.log("updateCollision", allSprites.length)


    for (let i = 0; i < allSprites.length; i++) {
      const sprite1 = allSprites[i];

      if (
        sprite1.location.x < 0 ||
        sprite1.location.x > this.width ||
        sprite1.location.y < 0 ||
        sprite1.location.y > this.height
      ) {
        this.collision_set.push([sprite1, "EOS"]);
      }

      for (let j = i + 1; j < allSprites.length; j++) {
        const sprite2 = allSprites[j];
        const dist = quickDistance(sprite1, sprite2);

        if (dist <= 0.99) {
          this.collision_set.push([sprite1, sprite2]);
        }
      }
    }
  };

  /**
   * 
   * @param {number} delta, time in seconds 
   * @param {boolean} now, if true, update will be called immediately
   * @returns {null | string | undefined} return null if game is paused, return string if game is ended, return undefined if game is running
   */
  update = (delta, now = false) => {
    // if (this.key_handler === "Pulse") {
    //   if (!now) return;
    // }

    if  (this.use_frame === false){
      if (!now) {
        this.currentTime += delta;
        // console.log("BasicGame update", now, this.use_frame, delta, this.use_frame, this.currentTime, this.updateTime, this.currentTime < this.updateTime)

        if (this.currentTime < this.updateTime) {
          // console.log("return")
          return;
        }
        this.currentTime %= this.updateTime;
      }
    }

    if (this.paused) return "paused";
    if (this.ended) {
      this.paused = true;
      this.on_game_end(this.getFullState());
      return this.win;
    }


    if(this.use_frame === true)
      this.time += delta * 15;
    else this.time ++;

    this._terminationHandling();

    this._clearAll();
    this._updateAll();

    this._effectHandling();

    for (const keycode of this.key_to_clean) {
      this.keystate[keycode] = false;
    }

    this.key_to_clean = [];
    this.collision_set = [];
  };

  /**
   * Start the game.
   */
  startGame = () => {
    this.reset();
    this.paused = false;

    this.key_to_clean = [];

    let sprite_types = [Immovable];
    this.all_objects = this.getObjects(); // Save all objects, some which may be killed in game

    const objects = this.getObjects();
    this.spriteDistribution = {};
    this.movement_options = {};
    Object.keys(objects).forEach((sprite) => {
      this.spriteDistribution[sprite] = initializeDistribution(sprite_types);
      this.movement_options[sprite] = { OTHER: {} };
      sprite_types.forEach((sprite_type) => {
        this.movement_options[sprite][sprite_type] = {};
      });
    });

    // This should actually be in a game loop function, or something.

    // this._clearAll();

    Object.keys(objects).forEach((sprite_number) => {
      let sprite = objects[sprite_number];
      if (!(this.spriteDistribution in sprite)) {
        this.all_objects[sprite] = objects[sprite];
        this.spriteDistribution[sprite] = initializeDistribution(sprite_types);
        this.movement_options[sprite] = { OTHER: {} };
        sprite_types.forEach((sprite_type) => {
          this.movement_options[sprite][sprite_type] = {};
        });
      }
    });

    this.keystate = {};
    this.keywait = {};

    // cache collision types
    this.collision_types = [];
    this.collision_eff.forEach((eff) => {
      const object = eff[0];
      const subject = eff[1];
      if(!this.collision_types.includes(object))
        this.collision_types.push(object)
      if(!this.collision_types.includes(subject))
        this.collision_types.push(subject)
    });
    // console.log(this.collision_types)
  };

  getPossibleActions = () => {
    return this.getAvatars()[0].declare_possible_actions();
  };
}
