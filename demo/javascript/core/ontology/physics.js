export const distance = (r1, r2) => {
  return Math.sqrt(
    Math.pow(r1.location.x - r2.location.x, 2) +
      Math.sqrt(Math.pow(r1.location.y - r2.location.y, 2)),
  );
};

export const quickDistance = (r1, r2) => {
  return (
    Math.pow(r1.location.x - r2.location.x, 2) +
    Math.pow(r1.location.y - r2.location.y, 2)
  );
};

export class GridPhysics {
  passiveMovement = (sprite) => {
    let speed = sprite.speed ?? 0;

    if (speed !== 0 && "orientation" in sprite) {
      sprite._updatePos(sprite.orientation, speed);
    }
  };
  calculatePassiveMovement = (sprite) => {
    let speed = 0;
    if (sprite.speed === null) speed = 1;
    else speed = sprite.speed;
    if (speed !== 0 && "orientation" in sprite) {
      const orientation = sprite.orientation;
      if (
        !(
          sprite.cooldown > sprite.lastmove + 1 ||
          Math.abs(orientation[0]) + Math.abs(orientation[1]) === 0
        )
      ) {
        var pos = sprite.rect.move(
          (orientation[0] * speed, orientation[1] * speed),
        );
        return [pos.left, pos.top];
      }
    } else {
      return null;
    }
  };
  activeMovement = (sprite, action, speed) => {
    // console.log(`[ActiveMovement] ${sprite} ${action}`);
    if (!speed) {
      speed = speed ?? sprite.speed ?? 1.0;
    }

    if (speed !== 0 && (action !== null || action !== undefined))
      sprite._updatePos(action, speed);
  };

  calculateActiveMovement = (sprite, action, speed = null) => {};

  distance = distance;

  quickDistance = quickDistance;
}

export class ContinuousPhysics extends GridPhysics {
  gravity = 0.0;
  friction = 0.02;
  constructor() {
    super();
  }

  passiveMovement = (sprite) => {
    if(sprite.speed != 0){
      sprite._updatePos(sprite.orientation, sprite.speed)
      
    }

    // if(sprite.name === "avatar")
      // console.log("passive movement", sprite.speed)
    // console.trace(sprite.name, sprite.on_ground)
    if(sprite.gravity > 0 && sprite.mass > 0 && !sprite.on_ground){

      // if(sprite.name === "avatar")
      // console.log("add force", sprite.speed, sprite.on_ground)
      const gravityAction = [0, sprite.gravity * sprite.mass]
      // console.log(gravityAction)
      this.activeMovement(sprite, gravityAction, 0)
    }
    // if(sprite.name === "avatar")
    // console.log("calc before", sprite.speed)
    sprite.speed *= (1-sprite.friction)
    // if(sprite.name === "avatar")
    // console.log("calc after", sprite.speed)

  };

  calculatePassiveMovement = (sprite) => {};

  activeMovement = (sprite, force, speed = null) => {
    if(speed == 0 || speed == -1 || speed == null) speed = sprite.speed;

    const dir = [
      force[0]/sprite.mass + sprite.orientation[0] * speed,
      force[1]/sprite.mass + sprite.orientation[1] * speed
    ]
    
    let speedD = Math.sqrt(dir[0] * dir[0] + dir[1] * dir[1]);
    if(sprite.max_speed != -1){
      speedD = Math.min(speedD, sprite.max_speed);
    }
    const normalised_speed = [dir[0]/speedD, dir[1]/speedD]
    // if(sprite.name === "avatar")
    // console.trace(dir, speedD, action, sprite.mass, sprite.orientation, speed, sprite.speed, normalised_speed)
    sprite.orientation = normalised_speed;
    sprite.speed = speedD;
  };

  calculateActiveMovement = (sprite, action, speed = null) => {};
}

export const CONT = ContinuousPhysics

export class NoFrictionPhysics extends ContinuousPhysics {
  friction = 0.0;
}

export class GravityPhysics extends ContinuousPhysics {
  gravity = 0.8;
}
