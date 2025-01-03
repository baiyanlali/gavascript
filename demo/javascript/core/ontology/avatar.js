import { BASEDIRS, DOWN, GREEN, LEFT, RIGHT, UP, WHITE } from "./constants.js";
import { OrientedSprite, SpriteProducer, VGDLSprite } from "./vgdl-sprite.js";
import { unitVector, vectNorm, getAbsoluteDirection, UniformVectorToDegree, DegreeToUniformVector } from "../tools.js";

const ActionMapping = {
  UP: UP,
  DOWN: DOWN,
  LEFT: LEFT,
  RIGHT: RIGHT,
  SPACE: 42,
};

// export class Avatar extends VGDLSprite {
//   actions = [];
//   constructor(pos, size, args) {
//     super(pos, size, args);
//     this.actions = this.declare_possible_actions();
//     // this.shrinkfactor = 0.15
//   }

//   update(game, delta = 0) {
//     super.update(game, delta);
//   }

//   declare_possible_actions() {
//     return [];
//   }

//   _readMultiActions(game) {
//     const res = [];

//     for (const action of this.declare_possible_actions()) {
//       if (game.keystate[action]) res.push(ActionMapping[action]);
//     }
//     return res;
//   }

//   _readAction(game) {
//     const actions = this._readMultiActions(game);
//     if (actions.length) return actions[0];
//     else return null;
//   }
// }

export class MovingAvatar extends VGDLSprite {
  constructor(pos, size, args) {
    // args.color = args.color || WHITE
    super(pos, size, args);
    // this.actions = this.declare_possible_actions();
    this.speed = args.speed ?? 1;
    this.is_avatar = true;
    this.playerID = 0;
  }

  declare_possible_actions() {
    return [`UP${this.playerID}`, `DOWN${this.playerID}`, `LEFT${this.playerID}`, `RIGHT${this.playerID}`];
  }

  _readMultiActions(game) {
    const res = [];

    for (const action of this.declare_possible_actions()) {
      if (game.keystate[action]) res.push(ActionMapping[action.substring(0, action.length - 1)]);
    }
    return res;
  }

  _readAction(game) {
    const actions = this._readMultiActions(game);
    if (actions.length) return actions[0];
    else return null;
  }

  update(game, delta = 0) {
    super.update(game, delta);
    const action = this._readAction(game);
    if (
      action !== null &&
      action !== undefined &&
      action !== ActionMapping.SPACE
    )
      this.physics.activeMovement(this, action, this.speed);
  }
}


export class HorizontalAvatar extends MovingAvatar {
  constructor(pos, size, args) {
    super(pos, size, args);
    // this.actions = this.declare_possible_actions();
  }

  declare_possible_actions() {
    return [`LEFT${this.playerID}`, `RIGHT${this.playerID}`];
  }

  update(game, delta = 0) {
    super.update(game, delta);
    // const action = this._readAction(game);
    // if (action === RIGHT || action === LEFT) {
    //     this.physics.activeMovement(this, action, this.speed);
    // }
  }
}

export class VerticalAvatar extends MovingAvatar {
  constructor(pos, size, args) {
    super(pos, size, args);
    // this.actions = this.declare_possible_actions();
  }

  declare_possible_actions() {
    return [`UP${this.playerID}`, `DOWN${this.playerID}`];
  }

  update(game, delta = 0) {
    super.update(game, delta);
    // const action = this._readAction(game);
    // if (action === UP || action === DOWN) {
    //     this.physics.activeMovement(this, action);
    // }
  }
}

export class FlakAvatar extends HorizontalAvatar {
  constructor(pos, size, args) {
    // args.color = args.color || GREEN;
    super(pos, size, args);
  }

  declare_possible_actions() {
    return [...super.declare_possible_actions(), `SPACE${this.playerID}`];
  }

  update(game, delta = 0) {
    super.update(game, delta);
    this._shoot(game);
  }

  _shoot(game) {
    if (this.stype && game.keystate[`SPACE${this.playerID}`]) {
      const spawn = game._createSprite(
        [this.stype],
        [this.location.x, this.location.y],
      );
    }
  }
}

export class OrientedAvatar extends MovingAvatar {
  constructor(pos, size, args) {
    args.draw_arrow = args.draw_arrow || true;
    super(pos, size, args);
  }

  declare_possible_actions() {
    return super.declare_possible_actions(this);
  }

  update(game, delta = 0) {
    this.lastmove++;
    const tmp = this.orientation.slice();
    this.orientation = [0, 0];
    const action = this._readAction(game);
    // console.log(`[Avatar] action: ${action}`)
    if (action !== null && action !== undefined) {
      // console.log(`[Avatar] movement`)
      this.physics.activeMovement(this, action);
    }
    const d = this.lastdirection();
    if (d[0] !== 0 || d[1] !== 0) {
      this.orientation = d;
    } else {
      this.orientation = tmp;
    }
  }
}

export class RotatingAvatar extends OrientedAvatar {
  constructor(pos, size, args) {
    args.draw_arrow = args.draw_arrow || true;
    super(pos, size, args);
    this.speed = 0;
  }

  update(game, delta = 0) {
    this.lastmove++;
    const actions = this._readMultiActions(game);
    if (UP in actions) this.speed = 1;
    else if (DOWN in actions) this.speed = -1;
    if (LEFT in actions) {
      const i = BASEDIRS.indexOf(this.orientation);
      this.orientation = BASEDIRS[(i + 1) % BASEDIRS.length];
    } else if (RIGHT in actions) {
      const i = BASEDIRS.indexOf(this.orientation);
      this.orientation = BASEDIRS[(i - 1) % BASEDIRS.length];
    }
    this.physics.passiveMovement(this);
    this.speed = 0;
  }
}

export class RotatingFlippingAvatar extends RotatingAvatar {
  constructor(pos, size, args) {
    super(pos, size, args);
    this.noiseLevel = args.noiseLevel || 0;
  }

  update(game, delta = 0) {
    this.lastmove++;
    let actions = this._readMultiActions(game);
    if (actions.length > 0 && this.noiseLevel > 0) {
      // pick a random one instead
      if (Math.random() < this.noiseLevel * 4)
        actions = [[UP, LEFT, DOWN, RIGHT].randomElement()];
    }
    if (actions.contains(UP)) this.speed = 1;
    else if (actions.contains(DOWN)) {
      const i = BASEDIRS.indexOf(this.orientation);
      this.orientation = BASEDIRS[(i + 2) % BASEDIRS.length];
    } else if (actions.contains(LEFT)) {
      const i = BASEDIRS.index(this.orientation);
      this.orientation = BASEDIRS[(i + 1) % BASEDIRS.length];
    } else if (actions.contains(RIGHT)) {
      const i = BASEDIRS.index(this.orientation);
      this.orientation = BASEDIRS[(i - 1) % BASEDIRS.length];
    }
    this.physics.passiveMovement(this);
    this.speed = 0;
  }

  s_stochastic() {
    return this.noiseLevel > 0;
  }
}

export class NoisyRotatingFlippingAvatar extends RotatingFlippingAvatar {
  constructor(pos, size, args) {
    super(pos, size, args);
    this.noiseLevel = args.noiseLevel || 0.1;
  }
}

export class ShootAvatar extends OrientedAvatar {
  constructor(pos, size, args) {
    super(pos, size, args);
    this.ammo = args.ammo?.split(",");
    this.stype = args.stype.split(",");
  }

  update(game, delta = 0) {
    // console.trace(`[Shoot Avatar] Update`)
    super.update(game, delta);

    for (let i = 0; i < this.stype.length; i++) {
      if (this._hasAmmo(i)) {
        this._shoot(game, i);
      }
    }
  }

  _hasAmmo(idx) {
    // console.log('resources', this.resources)
    if (!this.ammo) return true;
    if (this.ammo[idx] in this.resources)
      return this.resources[this.ammo[idx]] > 0;
    return false;
  }

  _reduceAmmo(idx) {
    if (this.ammo && this.ammo[idx] && this.ammo[idx] in this.resources)
      this.resources[this.ammo[idx]]--;
  }

  _shoot(game, idx) {
    if (this.stype && game.keystate["SPACE"]) {
      const u = unitVector(this.orientation);
      const newones = game._createSprite(
        [this.stype[idx]],
        [this.location.x + u[0], this.location.y + u[1]],
      );
      if (newones.length > 0 && newones[0] instanceof OrientedSprite)
        newones[0].orientation = unitVector(this.orientation);
      this._reduceAmmo();
    }
  }
}

export class OngoingShootAvatar extends ShootAvatar {
  constructor(pos, size, args) {
    super(pos, size, args);
    this.speed = 1;
    this.is_oriented = true;
    this.orientation = [0, 0];
  }

  update(game, delta = 0) {
    this.lastmove++;
    const action = this._readAction(game);

    // this.physics.passiveMovement(this)

    if (action === null || action === 42) {
      this._shoot(game, 0);
    } else {
      this.physics.activeMovement(this, action, this.speed);
    }

    const d = this.lastdirection();
    if (d[0] !== 0 || d[1] !== 0) {
      this.orientation = d;
    }
  }
}

export class MissileAvatar extends OrientedAvatar {
  constructor(pos, size, args) {
    super(pos, size, args);
    this.speed = 1;
    this.is_oriented = true;
  }

  update(game, delta = 0) {
    this.physics.activeMovement(this, this.orientation, this.speed);
  }

  declare_possible_actions() {
    return [];
  }
}

export class FPSAvatar extends MovingAvatar{
  constructor(pos, size, args) {
    super(pos, size, args);
    this.speed = args.speed ?? 1;
    this.stored_speed = this.speed;
  }

  updateOrientation(ori){
    this.orientation =  unitVector([...ori]);
  }

  update(game, delta = 0) {
    this.speed = 0;
    super.update(game, delta)
    this.speed = this.stored_speed;
    const actions = this._readMultiActions(game)
    const sum_action = actions.filter(a => a !== 42).reduce((a, b) => [a[0]+b[0], a[1]+b[1]], [0, 0])
    if(vectNorm(sum_action)===0){
      return;
    }
    const direction = unitVector(sum_action);
    const current_degree = UniformVectorToDegree(this.orientation[0], this.orientation[1]);
    const fixed_orientation = DegreeToUniformVector(current_degree + 180);
    const absolute_direction = getAbsoluteDirection(fixed_orientation, direction)
    // console.log(JSON.stringify(this.orientation), JSON.stringify(direction), current_degree, JSON.stringify(fixed_orientation), JSON.stringify(absolute_direction))
    this.physics.activeMovement(this, absolute_direction, this.speed);
  }
}
