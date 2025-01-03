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
  passiveMovement = (sprite, delta = 2) => {
    let speed = sprite.speed ?? 0;

    if (speed !== 0 && "orientation" in sprite) {
      sprite._updatePos(sprite.orientation, speed * delta * 0.5);
    }
  };
  activeMovement = (sprite, action, speed, delta = 2) => {
    // console.log(`[ActiveMovement] ${sprite} ${action}`);
    if (!speed) {
      speed = speed ?? sprite.speed ?? 1.0;
    }

    if (speed !== 0 && (action !== null || action !== undefined))
      sprite._updatePos(action, speed * delta* 0.5);
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

  passiveMovement = (sprite, delta=1) => {};


  activeMovement = (sprite, action, speed = null, delta=1) => {};

}

export class NoFrictionPhysics extends ContinuousPhysics {
  friction = 0.0;
}

export class GravityPhysics extends ContinuousPhysics {
  gravity = 0.8;
}
