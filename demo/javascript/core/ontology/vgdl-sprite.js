import {
  clone,
  defaultDict,
  new_id,
  random,
  triPoints,
  unitVector,
} from "../tools.js";
import { ContinuousPhysics, GridPhysics } from "./physics.js";
import {
  BASEDIRS,
  BLACK,
  BLUE,
  GRAY,
  ORANGE,
  PURPLE,
  RED,
  RIGHT,
} from "./constants.js";
import { killSprite } from "./effect";

export class VGDLSprite {
  transformedBy = {};
  name = null;
  COLOR_DISC = [20, 80, 140, 200];
  is_static = false;
  only_active = false;
  is_avatar = false;
  is_stochastic = false;
  cooldown = 0;
  mass = 1;
  physicstype = null;
  shrinkfactor = 0;
  dirtyrects = [];
  size = [1, 1];
  lastrect = null;
  physicstype = GridPhysics;
  speed = 0;
  ID = 0;
  direction = null;
  color = "#ffffff";
  orientation = [0, 0];
  location = { x: 0, y: 0 };
  healthPoints = -1;
  limitHealthPoints = 1000;
  maxHealthPoints = -1;
  hidden = false;
  blueprint = undefined;

  constructor(pos, size, args = {}) {
    args = args ?? {};
    this.name = args.key || null;
    this.location = pos ? { x: pos[0], y: pos[1] } : this.location;
    // this.visual_location = {...this.location};
    this.size = size ?? this.size;
    this.lastlocation = { x: this.location.x, y: this.location.y };
    this.physicstype = args.physicstype || this.physicstype || GridPhysics;
    this.physics = new this.physicstype();
    this.physics.gridsize = this.size;
    this.speed = args.speed || this.speed;
    this.cooldown = args.cooldown || this.cooldown;
    this.ID = new_id();
    this.direction = null;
    this.color = args.color || this.color;
    this.image = args.image;
    this.healthPoints = args.healthPoints || this.healthPoints;
    this.limitHealthPoints = args.limitHealthPoints || this.limitHealthPoints;
    this.maxHealthPoints = args.maxHealthPoints || this.healthPoints;
    this.hidden = args.hidden || this.hidden;
    this.blueprint = args.blueprint || this.blueprint;

    // iterate over kwargs
    // this.extend(args);
    if (args) {
      Object.keys(args).forEach((name) => {
        const value = args[name];
        try {
          this[name] = value;
        } catch (e) {
          console.error(`error: ${e}`);
        }
      });
    }
    // how many timesteps ago was the last move
    this.lastmove = 0;

    // management of resources contained in the sprite
    this.resources = new defaultDict(0);
    // this.visual_location = {...this.location}
    // this.next_location = {...this.location}
    // this.current_location = {...this.location}
  }

  get visual_location(){
    return this.location;
  }

  // get location() {
  //   // console.log("get visual location")
  //   return this.next_location;
  // }

  // set location(value) {
  //   // if(this.name === "avatar")
  //   // console.log("set location")
  //   // console.log(JSON.stringify(this.current_location), JSON.stringify(this.next_location), JSON.stringify(value));
  //   if(this.next_location){
  //     this.visual_location = {...this.next_location};
  //     this.current_location = {...this.next_location}; 
  //   }else{
  //     this.visual_location = {...value};
  //     this.current_location = {...value};
  //   }
  //   this.next_location = {...value};
  // }

  update(game, delta) {
    // this.lastmove += delta;
    this.lastmove ++;
    // if(this.name === "avatar")
    // console.log(JSON.stringify(this.current_location), JSON.stringify(this.visual_location), JSON.stringify(this.next_location))
    // this.current_location = {...this.next_location};
    // this.visual_location = {...this.location};
    if (!this.is_static && !this.only_active) {
      this.physics.passiveMovement(this, delta);
    }
    // this.visual_location = {...this.location};
  }

  subUpdate(game, sub_idx, sum_idx) {
    // if(this.name === "avatar")
    //   console.log(JSON.stringify(this.current_location), JSON.stringify(this.next_location))
    // this.visual_location = {
    //   x: (1-sub_idx/sum_idx) * this.current_location.x + (sub_idx/sum_idx) * this.next_location.x,
    //   y: (1-sub_idx/sum_idx) * this.current_location.y + (sub_idx/sum_idx) * this.next_location.y
    // }
    // this.visual_location = {...this.next_location}
  }

  _updatePos = (orientation, speed = null) => {
    if (speed === null) speed = this.speed;

    if (
      this.cooldown <= this.lastmove &&
      Math.abs(orientation[0]) + Math.abs(orientation[1]) !== 0
    ) {
      this.lastlocation = { x: this.location.x, y: this.location.y };
      this.location = {
        x: this.location.x + orientation[0] * speed,
        y: this.location.y + orientation[1] * speed,
      };
      this.lastmove = 0;
    }
  };

  _velocity() {
    if (this.speed === null || this.speed === 0 || !("orientation" in this))
      return [0, 0];
    else
      return [
        this.orientation[0] * this.speed,
        this.orientation[1] * this.speed,
      ];
  }

  lastdirection() {
    return [
      this.location.x - this.lastlocation.x,
      this.location.y - this.lastlocation.y,
    ];
  }

  _draw(game) {}

  _drawResources = (game, screen, location) => {};

  _clear = (screen, background, double = null) => {};

  toString() {
    return `${this.name} at (${this.location.x}, ${this.location.y})`;
  }
}

export class EOS extends VGDLSprite {
  constructor(pos, size, args) {
    super(pos, size, args);
    this.ID = -1;
  }
}

export class Immovable extends VGDLSprite {
  constructor(pos, size, args) {
    // args.color = args.color || GRAY;
    super(pos, size, args);
    this.is_static = args.is_static || true;
  }
}

export class Passive extends VGDLSprite {
  constructor(pos, size, args) {
    // args.color = args.color || RED;
    super(pos, size, args);
  }
}

export class Flicker extends VGDLSprite {
  constructor(pos, size, args) {
    // args.color = args.color || RED;
    super(pos, size, args);
    this._age = 0;
    this.limit = args.limit || 1;
  }

  update(game, delta) {
    super.update(game, delta);
    if (this._age > this.limit) killSprite(this, null, game);

    this._age++;
  }
}

export class SpriteProducer extends VGDLSprite {
  constructor(pos, size, args) {
    super(pos, size, args);
  }
}

export class Portal extends SpriteProducer {
  constructor(pos, size, args) {
    super(pos, size, args);
    this.is_static = true;
    // this.color = BLUE;
  }
}

export class SpawnPoint extends SpriteProducer {
  constructor(pos, size, args) {
    // args.color = args.color || BLACK
    args.cooldown = args.cooldown || 1;
    super(pos, size, args);
    if (args.prob !== undefined) {
      this.prob = args.prob;
    } else {
      this.prob = 1;
    }

    this.is_stochastic = this.prob > 0 && this.prob < 1;

    if (args.total !== undefined) this.total = args.total;

    this.counter = 0;

    this.stype = args.stype || null;
    this.lastspawntime = -1;
  }

  update(game, delta) {
    super.update(game, delta);
    if (!this.stype) return;
    if(this.lastspawntime >= Math.round(game.time)) return;
    if(Math.round(game.time) % this.cooldown !== 0) return;
    const rnd = random.random();
    // console.log("spawn ", Math.round(game.time))

    if (rnd < this.prob) {
        this.lastspawntime = Math.round(game.time);
        game._createSprite([this.stype], [this.location.x, this.location.y]);
        this.counter++;
    }

    if (this.total && this.counter >= this.total) {
      killSprite(this, undefined, game);
    }
  }
}

export class RandomNPC extends VGDLSprite {
  constructor(pos, size, args) {
    args.speed = args.speed || 1;
    args.is_stochastic = args.is_stochastic || true;
    super(pos, size, args);
  }

  update(game, delta) {
    this.direction = random.choice(BASEDIRS);
    super.update(game, delta);
    this.physics.activeMovement(this, this.direction);
  }
}

export class OrientedSprite extends VGDLSprite {
  constructor(pos, size, args) {
    super(pos, size, args);
    this.draw_arrow = false;
    this.orientation = args.orientation || RIGHT;
  }

  _draw(game) {
    // super._draw(this, game);
    // if (this.draw_arrow) {
    // 	//TODO: Draw OrientedSprite
    // 	const col = (this.color[0], 255 - this.color[1], this.color[2]);
    // 	// this.gamejs.draw.polygon(game.screen, col, triPoints(this.rect, unitVector(this.orientation)))
    // }
  }
}

export class Conveyer extends OrientedSprite {
  constructor(pos, size, args) {
    super(pos, size, args);
    this.is_static = true;
    // this.color = BLUE;
    this.strength = 1;
    this.draw_arrow = true;
  }
}

export class Missile extends OrientedSprite {
  constructor(pos, size, args) {
    args.speed ??= 1;
    super(pos, size, args);
    // this.color = PURPLE;
  }
}

export class Switch extends OrientedSprite {
  constructor(pos, size, args) {
    super(pos, size, args);
    this.speed = 1;
    // this.color = PURPLE;
  }
}

export class OrientedFlicker extends OrientedSprite {
  constructor(pos, size, args) {
    //Flicker
    super(pos, size, args);
    this.draw_arrow = true;
    this.speed = 0;
    this._age = 0;
    this.limit = args.limit || 1;
  }

  update(game, delta) {
    super.update(game, delta);
    if (this._age > this.limit) killSprite(this, null, game);

    this._age++;
  }
}

export class Walker extends Missile {
  constructor(pos, size, args) {
    super(pos, size, args);

    this.airsteering = false;
    this.is_stochastic = true;
  }

  update(game, delta) {
    if (this.airsteering || this.lastdirection()[0] === 0) {
      let d = 0;
      if (this.orientation[0] > 0) d = 1;
      else if (this.orientation[0] < 0) d = -1;
      else d = random.choice([-1, 1]);
      this.physics.activeMovement(this, [d, 0]);
    }
    super.update(game, delta);
  }
}

export class WalkJumper extends Walker {
  constructor(pos, size, args) {
    super(pos, size, args);

    this.prob = 0.1;
    this.strength = 10;
  }

  update(game, delta) {
    if (this.lastdirection()[0] === 0) {
      if (this.prob < random.random())
        this.physics.activeMovement(this, (0, -this.strength));
    }
    super.update(game, delta);
  }
}

export class RandomInertial extends RandomNPC {
  constructor(pos, size, args) {
    super(pos, size, args);
    this.physicstype = ContinuousPhysics;
  }
}

export class RandomMissile extends Missile {
  constructor(pos, size, args) {
    super(pos, size, args);
  }
}

export class EraticMissile extends Missile {
  constructor(pos, size, args) {
    super(pos, size, args);

    this.prob = args.prob;
    this.is_stochastic = this.prob > 0 && this.prob < 1;
  }

  update(game, delta) {
    super.update(game, delta);
    if (random.random() < this.prob) this.orientation = random.choice(BASEDIRS);
  }
}

export class Bomber extends Missile {
  constructor(pos, size, args) {
    // Missile
    // args.color = args.color || ORANGE;
    args.is_static = args.is_static || false;
    super(pos, size, args);

    if (args.prob !== undefined) {
      this.prob = args.prob;
    } else {
      this.prob = 1;
    }

    this.is_stochastic = this.prob > 0 && this.prob < 1;

    if (args.cooldown !== undefined) {
      this.cooldown = args.cooldown;
    } else {
      this.cooldown = 1;
    }

    if (args.total !== undefined) this.total = args.total;

    this.counter = 0;

    this.stype = args.stype;

    this.lastspawntime = -1;
  }

  update(game, delta) {
    super.update(game, delta);

    if (
      this.stype &&
      this.lastspawntime < Math.round(game.time) &&
      Math.round(game.time) % this.cooldown === 0 &&
      random.random() < this.prob
    ) {
      this.lastspawntime = Math.round(game.time);
      game._createSprite([this.stype], [this.location.x, this.location.y]);
      this.counter++;
    }

    if (this.total && this.counter >= this.total) {
      killSprite(this, undefined, game);
    }
  }

  
}

export class Door extends Immovable {
  constructor(pos, size, args) {
    args.portal = args.portal || true;
    super(pos, size, args);
  }
}

export class Chaser extends RandomNPC {
  constructor(pos, size, args) {
    args.portal = args.portal || true;
    super(pos, size, args);
    this.stype = args.stype;
    this.fleeing = false;
  }

  _closestTargets(game) {
    let bestd = 1e100;
    let res = [];
    game.getSprites(this.stype).forEach((target) => {
      const d = this.physics.quickDistance(this, target);
      if (d < bestd) {
        bestd = d;
        res = [target];
      } else if (d === bestd) {
        res.push(target);
      }
    });
    return res;
  }

  _movesToward(game, target) {
    const res = [];
    let basedist = this.physics.quickDistance(this, target);
    BASEDIRS.forEach((a) => {
      // console.log(a)
      let r = { ...this.location };
      r.x += a[0];
      r.y += a[1];

      const newdist = this.physics.quickDistance({ location: r }, target);
      // console.log(a, basedist,  newdist);
      if (this.fleeing && basedist < newdist) {
        res.push(a);
      } else if (!this.fleeing && basedist > newdist) {
        res.push(a);
      }
    });
    return res;
  }

  update(game, delta) {
    let options = [];
    const position_options = {};
    this._closestTargets(game).forEach((target) => {
      options = options.concat(this._movesToward(game, target));
    });
    if (options.length === 0) {
      options = BASEDIRS;
    }
    // super.update(game, delta);

    this.physics.activeMovement(this, options.randomElement());
  }
}

export class Fleeing extends Chaser {
  constructor(pos, size, args) {
    args.portal = args.portal || true;
    super(pos, size, args);
    this.stype = args.stype;
    this.fleeing = true;
  }
}

export class BomberRandomMissile extends SpawnPoint {
  constructor(pos, size, args) {
    super(pos, size, args);
    this.stypeMissile = args.stypeMissile.split(",");
  }

  update(game, delta) {
    this.stype = this.stypeMissile.randomElement();
    super.update(game, delta);
  }
}

export class AStarChaser extends RandomNPC {
  constructor(pos, size, args) {
    super(pos, size, args);
  }

  _movesToward = (game, target) => {
    const res = [];
    const basedist = this.physics.quickDistance(this.location, target.location);
    BASEDIRS.forEach((a) => {
      let r = { ...this.location };
      r.x += a[0];
      r.y += a[1];
      const newdist = this.physics.quickDistance(r, target.location);
      if (this.fleeing && basedist < newdist) res.push(a);
      if (!(this.fleeing && basedist > newdist)) res.push(a);
    });
    return res;
  };
}

export class AlternateChaser extends RandomNPC {
  constructor(pos, size, args) {
    super(pos, size, args);
    this.fleeing = false;
    this.targets = [];
    this.actions = [];

    this.stypes1 = args.stype1.split(",");
    this.stypes2 = args.stype2.split(",");
  }

  closestTargets(game, randomTarget) {
    this.targets = [];

    let best_dist = 10e20;

    let num_chasing = 0;

    this.stypes1.forEach((s) => {
      num_chasing += game.getSprites(s).length;
    });

    let num_fleeing = 0;

    this.stypes2.forEach((s) => {
      num_fleeing += game.getSprites(s).length;
    });

    let target = null;

    if (num_chasing > num_fleeing) {
      target = this.stypes1.randomElement();
      this.fleeing = false;
    } else if (num_chasing < num_fleeing) {
      target = this.stypes2.randomElement();
      this.fleeing = true;
    }

    if (target === null) return;

    const sprites = game.getSprites(target);

    for (const sprite of sprites) {
      if (randomTarget) {
        if (random.random() < this.prob) {
          this.targets.push(sprite);
        }
      } else {
        const distance = this.physics.quickDistance(this, sprite);

        if (distance < best_dist) {
          best_dist = distance;
          this.targets = [sprite];
        } else if (distance === best_dist) {
          this.targets.push(sprite);
        }
      }
    }
  }

  movesToward(target) {
    const distance = this.physics.quickDistance(this, target);

    for (const dir of BASEDIRS) {
      const new_pos = { ...this.location };
      new_pos.x += dir[0];
      new_pos.y += dir[1];
      const new_dist = this.physics.quickDistance(this, { location: new_pos });

      if (this.fleeing && new_dist > distance) {
        this.actions.push(dir);
      } else if (!this.fleeing && new_dist < distance) {
        this.actions.push(dir);
      }
    }
  }

  update(game, delta) {
    this.lastmove++;
    this.actions = [];

    this.physics.passiveMovement(this);

    this.closestTargets(game, false);

    for (const target of this.targets) {
      this.movesToward(target);
    }

    let action = [0, 0];

    if (this.actions.length === 0) {
      action = BASEDIRS.randomElement();
    } else {
      action = this.actions.randomElement();
    }
    this.physics.activeMovement(this, action, this.speed);
  }
}

export class PathAltChaser extends AlternateChaser {
  constructor(pos, size, args) {
    super(pos, size, args);
    this.lastTarget = null;
  }

  update(game, delta) {
    this.physics.passiveMovement(this);

    let action = [0, 0];

    if (
      this.lastTarget === null ||
      this.physics.quickDistance(this, this.lastTarget) < 1
    ) {
      this.closestTargets(game, false);
    } else {
      this.targets.push(this.lastTarget);
    }

    if (!this.fleeing && this.targets.length > 0) {
      this.lastTarget = this.targets[0];
    } else {
    }

    this.physics.activeMovement(this, action, this.speed);
  }
}

//
// function AStarChaser(gamejs, pos, size, args) {
// 	this.stype = null;
// 	this.fleeing = false;
// 	this.drawpath = null;
// 	this.walableTiles = null;
// 	this.neighborNodes =null;
// 	RandomNPC.call(this, gamejs, pos, size, args);
// }
// AStarChaser.prototype = Object.create(RandomNPC.prototype);
//
// AStarChaser.prototype._movesToward = (game, target) => {
// 	var res = [];
// 	var basedist = this.physics.distance(this.rect, target.rect);
// 	var that = this;
// 	BASEDIRS.forEach(a => {
// 		var r = that.rect.copy();
// 		r = r.move(a);
// 		var newdist = that.physics.distance(r, target.rect);
// 		if (that.fleeing && basedist < newdist)
// 			res.push(a);
// 		if (!(that.fleeing && basedist > newdist))
// 			res.push(a);
// 	});
// 	return res;
// }
//
// AStarChaser.prototype._draw (game) {
// 	RandomNPC.prototype._draw.call(this, game);
// 	if (this.walableTiles) {
// 		var col = this.gamejs.Color(0, 0, 255, 100);
// 		var that = this;
// 		this.walableTiles.forEach(sprite => {
// 			that.gamejs.draw.rect(game.screen, col, sprite.rect);
// 		});
// 	}
//
// 	if (this.neighborNodes) {
// 		var col = this.gamejs.Color(0, 255, 255, 80);
// 		var that = this;
// 		this.neighborNodes.forEach(node => {
// 			that.gamejs.draw.rect(game.screen, col, node.sprite.rect);
// 		})
// 	}
//
// 	if (this.drawpath) {
// 		var col = this.gamejs.Color(0, 255, 0, 120);
// 		var that = this;
// 		this.drawpath.slice(1, -1).forEach(sprite => {
// 			that.gamejs.draw.rect(game.screen, col, sprite.rect);
// 		});
// 	}
// }
//
//
// AStarChaser.prototype._setDebugVariables = (world, path) => {
// 	var path_sprites = path.map(node => {return node.sprite});
//
// 	this.walableTiles = world.get_walkable_tiles();
// 	this.neighborNodes = world.neighbor_nodes_of_sprite(this);
// 	this.drawpath = path_sprits;
// }
//
// AStarChaser.prototype.update (game) {
// 	VGDLSprite.prototype.update.call(this, game);
// }
