import { colorDict, DOWN } from "./constants.js";
import { OrientedSprite } from "./vgdl-sprite.js";
import * as tools from "../tools.js";
import { oncePerStep, unitVector, vectNorm } from "../tools.js";
import { Resource } from "./resource.js";
import { ContinuousPhysics } from "./physics.js";

export function getColor(sprite) {
  try {
    let color = sprite.color;
    try {
      return colorDict[color];
    } catch (e) {
      console.log(e);
      return color;
    }
  } catch (e) {
    console.log(e);
    return null;
  }
}

export function scoreChange(sprite, partner, game, kwargs) {
  // console.log(`Before Score Change: ${kwargs.score}/${game.score}`)
  game.score += kwargs.score ?? kwargs.value;

  // console.log(`Score Change: ${kwargs.score}/${game.score}`)

  return ["scoreChange", sprite.ID || sprite, partner.ID || partner];
}

export let changeScore = scoreChange;

export function nothing(sprite, partner, game, kwargs) {
  return ["nothing", sprite.ID || sprite, partner.ID || partner];
}

export function killSprite(sprite, partner, game, kwargs) {
  game.kill_list.push(sprite);
  // console.log("kill sprite", sprite.name, partner.name, game.collision_set)
  return [
    "killSprite",
    sprite.ID || sprite,
    partner ? partner.ID || partner : null,
  ];
}

//正好与killsprite效果相反，专门为大预言模型设计
export function removeSprite(sprite, partner, game, kwargs) {
  game.kill_list.push(partner);
  return [
    "removeSprite",
    sprite.ID || sprite,
    partner ? partner.ID || partner : null,
  ];
}

export function cloneSprite(sprite, partner, game, kwargs) {
  game._createSprite([sprite.name], [sprite.location.x, sprite.location.y]);
  return ["cloneSprite", sprite.ID || sprite, partner.ID || partner];
}

export function transformTo(sprite, partner, game, kwargs) {
  // let hasID = partner.ID in sprite.transformedBy;
  // let validTime;
  // if (hasID) {
  // 	if (game.time > sprite.transformedBy[partner.ID] + 3) {
  // 		validTime = true;
  // 	} else {
  // 		validTime = false;
  // 	}
  // }
  // if (!(hasID) || validTime) {
  //(sprite.transformedBy.has(partner.ID)) {
  //sprite.transformedBy.add(partner.ID);

  sprite.transformedBy[partner.ID] = game.time;
  let stype = kwargs.stype;
  const forceOrientation = kwargs.forceOrientation;

  let newones = game._createSprite(
    [stype],
    [sprite.location.x, sprite.location.y],
  );

  if (newones.length > 0) {
    if (
      forceOrientation ||
      (sprite instanceof OrientedSprite &&
        newones[0] instanceof OrientedSprite &&
        vectNorm(newones[0].orientation) === 0)
    )
      newones[0].orientation = sprite.orientation;
    newones[0].transformedBy = sprite.transformedBy;
    newones[0].lastlocation = { ...sprite.lastlocation };
    killSprite(sprite, partner, game, kwargs);
  }

  // if(kwargs['killSecond'] && kwargs['killSecond'] === true){
  // 	game.kill_list.push(partner)
  // }

  return ["transformTo", sprite.ID || sprite, partner.ID || partner];
  // } else {
  // 	return;
  // }
}

export function transformToAll(sprite, partner, game, kwargs) {
  //(sprite.transformedBy.has(partner.ID)) {
  //sprite.transformedBy.add(partner.ID);
  sprite.transformedBy[partner.ID] = game.time;
  let stype = kwargs.stype;
  const sprites = game.getSprites(stype);

  sprites.forEach((s) => {
    transformTo(s, partner, game, { stype: kwargs.stypeTo });
  });

  return ["transforrmToAll", sprite.ID || sprite, partner.ID || partner];
}

export function stepBack(sprite, partner, game, kwargs) {
  // console.log(`[Step Back] ${sprite.name} last location: ${JSON.stringify(sprite.lastlocation)}`)
  sprite.location = { x: sprite.lastlocation.x, y: sprite.lastlocation.y };
  return ["stepBack", sprite.ID || sprite, partner.ID || partner];
}

export function bounceForward(sprite, partner, game, kwargs) {
  // console.log("bounce forward", sprite.name, partner.name, JSON.stringify(partner.lastdirection()))
  // detect if the partner is moving toward the sprite
  if(game.use_frame){
    const partner2spriteVector = [sprite.location.x - partner.location.x, sprite.location.y - partner.location.y]
    const dotResult = tools.dot(partner2spriteVector, partner.orientation)
    if(dotResult <= 0.2) {return;}
  }
  sprite.physics.activeMovement(
    sprite,
    tools.unitVector(partner.lastdirection()),
    partner.speed,
  );
  game._updateCollisionDict(sprite);
  return ["bounceForward", sprite.ID || sprite, partner.ID || partner];
}

export function conveySprite(sprite, partner, game, kwargs) {
  let sprite_lastlocation = { ...sprite.lastlocation };
  let vect = tools.unitVector(partner.orientation);
  sprite.physics.activeMovement(sprite, vect, partner.strength);
  sprite.lastlocation = sprite_lastlocation;
  game._updateCollisionDict(sprite);
  return ["conveySprite", sprite.ID || sprite, partner.ID || partner];
}

export function windGust(sprite, partner, game, kwargs) {
  let s = partner.strength - [0, 1, -1].randomElement();
  if (s !== 0) {
    let sprite_lastlocation = { ...sprite.lastlocation };
    let vect = tools.unitVector(partner.orientation);
    sprite.physics.activeMovement(sprite, vect, s);
    sprite.lastlocation = sprite_lastlocation;
    game._updateCollisionDict(sprite);
  }

  return ["windGust", sprite.ID || sprite, partner.ID || partner];
}

export function slipForward(sprite, partner, game, kwargs) {
  if (kwargs.prob > Math.random()) {
    let sprite_lastlocation = { ...sprite.lastlocation };
    let vect = tools.unitVector(partner.orientation);
    sprite.physics.activeMovement(sprite, vect, 1);
    sprite.lastlocation = sprite_lastlocation;
    game._updateCollisionDict(sprite);
  }

  return ["slipForward", sprite.ID || sprite, partner.ID || partner];
}

export function undoAll(sprite, partner, game, kwargs) {
  const notStypeStr = kwargs["nontStype"] ?? "";
  const notStype = notStypeStr.split(",").map((s) => s.trim());
  game._iterAllExcept(notStype).forEach((s) => {
    s.location = { ...s.lastlocation };
  });
  return ["undoAll", sprite.ID || sprite, partner.ID || partner];
}

export function attractGaze(sprite, partner, game, kwargs) {
  if (kwargs.prob > Math.random()) {
    sprite.orientation = partner.orientation;
  }

  return ["attractGaze", sprite.ID || sprite, partner.ID || partner];
}

export function turnAround(sprite, partner, game, kwargs) {
  sprite.location = sprite.lastlocation;
  sprite.lastmove = sprite.cooldown;
  sprite.physics.activeMovement(sprite, DOWN);
  sprite.lastmove = sprite.cooldown;
  sprite.physics.activeMovement(sprite, DOWN);
  reverseDirection(sprite, partner, game, kwargs);
  game._updateCollisionDict(sprite);
  return ["turnAround", sprite.ID || sprite, partner.ID || partner];
}

export function reverseDirection(sprite, partner, game, kwargs) {
  sprite.orientation = [-sprite.orientation[0], -sprite.orientation[1]];
  return ["reverseDirection", sprite.ID || sprite, partner.ID || partner];
}

export function bounceDirection(sprite, partner, game, kwargs) {
  let friction = kwargs.friction || 0;

  stepBack(sprite, partner, game);
  let inc = sprite.orientation;
  let snorm = unitVector([
    -sprite.location.x + partner.location.y,
    -sprite.location.y + partner.location.x,
  ]);

  let dp = snorm[0] * inc[0] + snorm[1] * inc[1];
  sprite.orientation = [
    -2 * dp * snorm[0] + inc[0],
    -2 * dp * snorm[1] + inc[1],
  ];
  sprite.speed *= 1 - friction;
  return ["bounceDirection", sprite.ID || sprite, partner.ID || partner];
}

export function wallBounce(sprite, partner, game, kwargs) {
  let friction = kwargs.friction || 0;
  if (!oncePerStep(sprite, game, "lastbounce")) return;
  sprite.speed *= 1 - friction;
  stepBack(sprite, partner, game);
  if (
    Math.abs(sprite.location.x - partner.location.x) >
    Math.abs(sprite.location.y - partner.location.y)
  )
    sprite.orientation = (-sprite.orientation[0], sprite.orientation[1]);
  else sprite.orientation = (sprite.orientation[0], -sprite.orientation[1]);
  // return ('wallBounce', colorDict[str(partner.color)], colorDict[str(sprite.color)])
  // TODO: Not printing for now
  // return ('wallBounce', sprite, partner)
  return ["wallBounce", sprite.ID || sprite, partner.ID || partner];
}

export function wallStop(sprite, partner, game, kwargs) {
  if (!tools.oncePerStep(sprite, game, "laststop")) return;

  stepBack(sprite, partner, game, kwargs);
  let x_dist = Math.abs(sprite.location.x - partner.location.x);
  let y_dist = Math.abs(sprite.location.y - partner.location.y);
  let y_orient = sprite.orientation[1] * (1 - kwargs.friction);
  let x_orient = sprite.orientation[0] * (1 - kwargs.friction);
  if (x_dist > y_dist) sprite.orientation = [0, y_orient];
  else sprite.orientation = [x_orient, 0];
  sprite.speed = tools.vectNorm(sprite.orientation) * sprite.speed;
  sprite.orientation = tools.unitVector(sprite.orientation);
  return ["wallStop", sprite.ID || sprite, partner.ID || partner];
}

export function killIfSlow(sprite, partner, game, kwargs) {
  let limitspeed = kwargs.limitspeed ?? 1000;
  let relspeed = 0;
  if (sprite.is_static) relspeed = partner.speed;
  else if (partner.is_static) relspeed = sprite.speed;
  else
    relspeed = tools.vectNorm([
      sprite._velocity()[0] - partner._velocity()[0],
      sprite._velocity()[1] - partner._velocity()[1],
    ]);
  if (relspeed < limitspeed) {
    killSprite(sprite, partner, game);
    return ["killIfSlow", sprite.ID || sprite, partner.ID || partner];
  }
}

export function killIfFromAbove(sprite, partner, game, kwargs) {
  if (
    sprite.lastlocation.y > partner.lastlocation.y &&
    partner.location.y > partner.lastlocation.y
  ) {
    killSprite(sprite, partner, game);
    return ["killIfFromAbove", sprite.ID || sprite, partner.ID || partner];
  }
}

export function killIfAlive(sprite, partner, game, kwargs) {
  if (!game.kill_list.contains(partner)) {
    killSprite(sprite, partner, game);
    return ["killIfAlive", sprite.ID || sprite, partner.ID || partner];
  }
}

export function killBoth(sprite, partner, game, kwargs) {
  if (!game.kill_list.contains(partner)) {
    killSprite(sprite, partner, game);
    killSprite(partner, sprite, game);
    return ["killBoth", sprite.ID || sprite, partner.ID || partner];
  }
}

export function killAll(sprite, partner, game, kwargs) {
  const stype = kwargs.stype;
  const sprites = game.getSprites(stype);
  sprites.forEach((s) => {
    killSprite(s, partner, game, kwargs);
  });
}

export function collectResource(sprite, partner, game, kwargs) {
  // console.assert(sprite instanceof Resource);
  let resource_type = sprite.name;
  partner.resources[resource_type] = Math.max(
    -1,
    Math.min(
      partner.resources.get(resource_type) + sprite.value,
      game.resources_limits.get(resource_type),
    ),
  );
  killSprite(sprite, partner, game, kwargs);
  return ["collectResource", sprite.ID || sprite, partner.ID || partner];
}

export function changeResource(sprite, partner, game, kwargs) {
  let resource = kwargs.resource;
  let value = kwargs.value || 1;
  let sprite_resource = sprite.resources[resource] || 0;
  let resource_limit = game.resources_limits[resource] || Infinity;
  sprite.resources[resource] = Math.max(
    -1,
    Math.min(sprite_resource + value, resource_limit),
  );

  if (kwargs.killResource) {
    killSprite(partner, undefined, game, {});
  }
  return ["changeResource", sprite.ID || sprite, partner.ID || partner];
}

export function spawnIfHasMore(sprite, partner, game, kwargs) {
  const resource = kwargs.resource;
  const stype = kwargs.stype;
  let limit = kwargs.limit || 1;
  if (sprite.resources[resource] >= limit) {
    game._createSprite([stype], [sprite.location.x, sprite.location.y]);
    return ["spawnIfHasMore", sprite.ID || sprite, partner.ID || partner];
  }
}

export function spawnIfHasLess(sprite, partner, game, kwargs) {
  const resource = kwargs.resource;
  const stype = kwargs.stype;
  let limit = kwargs.limit || 1;
  if (sprite.resources[resource] < limit) {
    game._createSprite([stype], [sprite.location.x, sprite.location.y]);
    return ["spawnIfHasLess", sprite.ID || sprite, partner.ID || partner];
  }
}

export function killIfHasMore(sprite, partner, game, kwargs) {
  let limit = kwargs.limit;
  let resource = kwargs.resource;
  if (sprite.resources[resource] === undefined) sprite.resources[resource] = 0;
  if (sprite.resources[resource] >= limit) {
    killSprite(sprite, partner, game, kwargs);
    return ["killIfHasMore", sprite.ID || sprite, partner.ID || partner];
  }
}

export function killIfHasLess(sprite, partner, game, kwargs) {
  let resource = kwargs.resource;
  let limit = kwargs.limit;
  if (sprite.resources[resource] === undefined) sprite.resources[resource] = 0;
  if (sprite.resources[resource] <= limit) {
    killSprite(sprite, partner, game, kwargs);
    return ["killIfHasLess", sprite.ID || sprite, partner.ID || partner];
  }
}

export function killIfOtherHasMore(sprite, partner, game, kwargs) {
  let resource = kwargs.resource;
  let limit = kwargs.limit;
  if (sprite.resources[resource] === undefined) {
    sprite.resources[resource] = 0;
  }
  if (partner.resources[resource] >= limit) {
    killSprite(sprite, partner, game, kwargs);
    return ["killIfOtherHasMore", sprite.ID || sprite, partner.ID || partner];
  }
}

export function wrapAround(sprite, partner, game, kwargs) {
  let offset = kwargs.offset || 0;

  if (sprite.orientation[0] > 0) sprite.location.x = offset * 1;
  else if (sprite.orientation[0] < 0)
    sprite.location.x = game.screensize[0] - 1 * (1 + offset);
  if (sprite.orientation[1] > 0) sprite.location.y = offset * 1;
  else if (sprite.orientation[1] < 0)
    sprite.location.y = game.screensize[1] - 1 * (1 + offset);
  sprite.lastmove = 0;
  return ["wrapAround", sprite.ID || sprite, partner.ID || partner];
}

export function pullWithIt(sprite, partner, game, kwargs) {
  if (!tools.oncePerStep(sprite, game, "lastpull")){
    // console.log("once per step o!", sprite.name, sprite["_lastpull"], game.time)
    return;
  }
  let tmp = { ...sprite.lastlocation };
  let v = tools.unitVector(partner.lastdirection());
  // console.log("Pull with it!", sprite.name, sprite["_lastpull"], game.time, sprite.physics.gridsize[0], partner.speed);
  sprite._updatePos(v, partner.speed * sprite.physics.gridsize[0]);
  if (sprite.physics instanceof ContinuousPhysics) {
    sprite.speed = partner.speed;
    sprite.orientation = partner.lastdirection;
  }
  sprite.lastlocation = { ...tmp };
}

export function teleportToExit(sprite, partner, game, kwargs) {
  let rand_sprite;
  try {
    rand_sprite = game.sprite_groups[partner.stype].randomElement();
  } catch (error) {
    rand_sprite = game.sprite_groups["goal"].randomElement();
  }

  sprite.location = { ...rand_sprite.location };
  sprite.lastmove = 0;
  return ["teleportToExit", sprite.ID || sprite, partner.ID || partner];
}

export const stochastic_effects = [
  teleportToExit,
  windGust,
  slipForward,
  attractGaze,
];
export const kill_effects = [
  killSprite,
  killIfSlow,
  transformTo,
  transformToAll,
  killIfOtherHasMore,
  killIfHasMore,
  killIfHasLess,
  killIfFromAbove,
  killIfAlive,
];

export function spawn(sprite, partner, game, kwargs) {
  const stype = kwargs["stype"];
  game._createSprite([stype], [sprite.location.x, sprite.location.y]);
}

export function setSpeedForAll(sprite, partner, game, kwargs) {
  const value = kwargs["value"] ?? 1.0;
  const stype = kwargs["stype"];
  const sprites = game.getSprites(stype);
  sprites.forEach((s) => (s.speed = value));
  return ["setSpeedForAll", sprite.ID || sprite, partner.ID || partner];
}

export function align(sprite, partner, game, kwargs) {
  const orient = kwargs["orient"];
  if (orient) sprite.orient = Object.copy(orient);
  sprite.location = Object.copy(partner.location);
  return ["align", sprite.ID || sprite, partner.ID || partner];
}

export function addHealthPoints(sprite, partner, game, kwargs) {
  const value = kwargs.value;
  if (sprite.healthPoints + value < sprite.limitHealthPoints) {
    sprite.healthPoints += value;
    sprite.healthPoints = Math.min(sprite.healthPoints, sprite.maxHealthPoints);
  }
  return ["addHealthPoints", sprite.ID || sprite, partner.ID || partner];
}

export function addHealthPointsToMax(sprite, partner, game, kwargs) {
  const value = kwargs.value;
  if (sprite.healthPoints + value < sprite.limitHealthPoints) {
    sprite.healthPoints += value;
  } else {
    sprite.healthPoints = sprite.limitHealthPoints;
  }

  if (sprite.healthPoints > sprite.maxHealthPoints)
    sprite.maxHealthPoints = sprite.healthPoints;

  return ["addHealthPointsToMax", sprite.ID || sprite, partner.ID || partner];
}

export function subtractHealthPoints(sprite, partner, game, kwargs) {
  const value = kwargs.value || 0;
  const stype = kwargs.stype;
  const limit = kwargs.limit || 0;
  if (stype) {
    const sprites = game.getSprites(stype);
    sprites.forEach((s) => {
      s.healthPoints -= value;
      if (s.healthPoints <= limit) {
        killSprite(s, partner, game, kwargs);
      }
    });
  } else {
    sprite.healthPoints -= value;
    if (sprite.healthPoints <= limit) {
      killSprite(sprite, partner, game, kwargs);
    }
  }

  return ["subtractHealthPoints", sprite.ID || sprite, partner.ID || partner];
}

export function transformToRandomChild(sprite, partner, game, kwargs) {
  const stype = kwargs.stype;
  if (stype) {
    console.log();
    const types = Object.keys(game.getSubTypes(stype));
    transformTo(sprite, partner, game, { stype: types.randomElement() });
  }
  return ["transformToRandomChild", sprite.ID || sprite, partner.ID || partner];
}

export function shieldFrom(sprite, partner, game, kwargs) {
  const stype = kwargs.stype;
  const ftype = kwargs.ftype;
  game.addShield(sprite.stypes, stype, ftype);
  return ["shieldFrom", sprite.ID || sprite, partner.ID || partner];
}

export function killIfFrontal(sprite, partner, game, kwargs) {
  const direction1 = unitVector(sprite.lastdirection());
  const direction2 = unitVector(partner.lastdirection());
  // console.log("kill if frontal")
  const dirsum = [direction1[0] + direction2[0], direction1[1] + direction2[1]];

  if (vectNorm(dirsum) === 0 || vectNorm(direction1) === 0) {
    killSprite(sprite, partner, game, kwargs);
  }
}

export function killIfNotFrontal(sprite, partner, game, kwargs) {
  const direction1 = unitVector(sprite.lastdirection());
  const direction2 = unitVector(partner.lastdirection());

  const dirsum = [direction1[0] + direction2[0], direction1[1] + direction2[1]];
  // console.log("kill not frontal", dirsum, direction1)
  if (vectNorm(dirsum) !== 0 || vectNorm(direction1) === 0) {
    killSprite(sprite, partner, game, kwargs);
  }
}

export function increaseSpeedToAll(sprite, partner, game, kwargs) {
  const value = kwargs.value || 0.1;
  const stype = kwargs.stype;
  if(!stype) return;
  const sprites = game.getSprites(stype);
  sprites.forEach((s) => (s.speed += value));
  return ["increaseSpeedToAll", sprite.ID || sprite, partner.ID || partner];
}