
export const clone = (obj) => {
  if (obj === null || typeof obj !== "object") return obj;
  const copy = obj.constructor();
  for (const copyKey in copy) {
    if (obj.hasOwnProperty(copyKey)) copy[copyKey] = obj[copyKey];
  }
  return copy;
};

/**
 * @return {number}
 * @param vector
 */
export const vectNorm = (vector) => {
  return Math.sqrt(Math.pow(vector[0], 2) + Math.pow(vector[1], 2));
};

/**
 * @return {[type]}
 * @param vector
 */
export const unitVector = (vector) => {
  const norm = vectNorm(vector);

  if (norm > 0) return [vector[0] / norm, vector[1] / norm];
  else return [1, 0];
};

/**
 * Computes the dot product of two vectors.
 *
 * @param {Array<number>} vector1 - The first vector.
 * @param {Array<number>} vector2 - The second vector.
 * @returns {number} - The dot product of the two vectors.
 */
export const dot = (vector1, vector2) => {
  return vector1[0] * vector2[0] + vector1[1] * vector2[1];
};

/**
 * @return {boolean}
 * @param sprite
 * @param game
 * @param {string} name
 */
export const oncePerStep = (sprite, game, name) => {
  name = `_${name}`;

  if (sprite[name] && Math.abs(sprite[name] - game.time) < 1) 
    return false;

  sprite[name] = game.time;
  return true;
};

/**
 * @return {[*,*][]}
 * @param rect
 * @param orientation
 */
export const triPoints = (rect, orientation) => {
  const p1 = [
    rect.center[0] + (orientation[0] * rect.w) / 3,
    rect.center[1] + (orientation[1] * rect.h) / 3,
  ];
  const p2 = [
    rect.center[0] + (orientation[0] * rect.w) / 4,
    rect.center[1] + (orientation[1] * rect.h) / 4,
  ];
  const orthdir = [orientation[1], -orientation[0]];
  const p2a = [
    p2[0] - (orthdir[0] * rect.w) / 6,
    p2[1] - (orthdir[1] * rect.h) / 6,
  ];
  const p2b = [
    p2[0] + (orthdir[0] * rect.w) / 6,
    p2[1] + (orthdir[1] * rect.h) / 6,
  ];
  return [p1, p2a, p2b].map((p) => {
    return [p[0], p[1]];
  });
};

/**
 * @return {[type]}
 * @param rect
 */
export const roundedPoints = (rect) => {
  return [
    [rect.x, rect.y],
    [rect.x + rect.width, rect.y],
    [rect.x, rect.y + rect.height],
    [rect.x + rect.width, rect.y + rect.height],
  ];
};

/**
 * @return {[type]}
 * @param center
 * @param size
 */
export const squarePoints = (center, size) => {};

export const listRotate = (list, n) => {
  return list.slice(n).concat(list.slice(0, n));
};

export class defaultDict {
  base = {};
  constructor(base) {
    this.base = base;
  }

  get = (key) => {
    if (this.hasOwnProperty(key)) {
      if (key === "get") return [];
      return this[key];
    } else {
      return this.base;
    }
  };
}

function roughSizeOfObject(object) {
  let objectList = [];
  let stack = [object];
  let bytes = 0;

  while (stack.length) {
    let value = stack.pop();

    if (typeof value === "boolean") {
      bytes += 4;
    } else if (typeof value === "string") {
      bytes += value.length * 2;
    } else if (typeof value === "number") {
      bytes += 8;
    } else if (typeof value === "object" && objectList.indexOf(value) === -1) {
      objectList.push(value);

      for (let i in value) {
        stack.push(value[i]);
      }
    }
  }
  return bytes;
}

Array.prototype.randomElement = function () {
  return this[Math.floor(Math.random() * this.length)];
};

Array.prototype.remove = function (element) {
  let index = this.indexOf(element);
  if (index > -1) this.splice(index, 1);
};

Array.prototype.contains = function (element) {
  let index = this.indexOf(element);
  return index > -1;
};

export const new_id = (() => {
  let id_number = 0;

  let generate_id = () => {
    id_number++;
    return id_number;
  };

  return generate_id;
})();

Object.copy = (obj) => {
  return Object.assign({}, obj);
};

Math.RNG = (seed) => {
  let seeded = (min, max) => {
    max = max || 1;
    min = min || 0;

    seed = (seed * 9301 + 49297) % 233280;
    let rnd = seed / 233280;

    return min + rnd * (max - min);
  };

  return seeded;
};

Array.prototype.shuffled = function (seed) {
  let rnd = Math.random;
  if (seed) {
    rnd = Math.RNG(seed);
  }
  let indeces = [];
  let new_array = [];
  let i = undefined;
  let len = this.length;
  while (new_array.length !== len) {
    i = Math.floor(rnd() * this.length);
    if (!indeces.contains(i)) {
      new_array.push(this[i]);
      indeces.push(i);
    }
  }

  return new_array;
};

// export const a = [1, 2, 3, 4, 5];
// console.log(a.shuffled(12));

/**
 * @param  {String}	tabSize
 * @return {String}	new string with expanded tabs
 * pulled from
 * http://cwestblog.com/2012/01/23/javascript-string-prototype-expandtabs-revisited/
 * to mimic Python's String.expandtab() function
 */
String.prototype.expandTabs = function (tabSize) {
  let spaces = new Array((tabSize = tabSize || 8) + 1).join(" ");
  return this.replace(/([^\r\n\t]*)\t/g, function (a, b) {
    return b + spaces.slice(b.length % tabSize);
  });
};

export const factorial = (n) => {
  if (n === 0) return 1;
  return n * factorial(n - 1);
};

// returns the nth permutation of an array
export const permutation = function (array, n) {
  let l = array.length;
  n = n % factorial(l);
  if (n === 0) return array.slice();
  if (l === 0) return [];
  if (l === 1) {
    return array.slice(0, l - 2).concat(array.slice(l - 2, l).reverse());
  }
  let i = Math.floor(n / factorial(l - 1));
  return [array[i]].concat(
    permutation(
      array.slice(0, i).concat(array.slice(i + 1, l)),
      n % factorial(l - 1),
    ),
  );
};

// Generates some pairwise permutation ordering (modulo the lenght of the permutations)
// export const permute_pairs = (array, permutation) => {
// 	let perms = permute(array);
// 	let perm = permutation % perms.length
// 	return perms[perm].map((value, index) => {
// 		return [value, array[index]]
// 	})
//
// }
// Generates some pairwise permutation ordering (modulo the lenght of the permutations)
export const permute_pairs = (array, m) => {
  let perm = permutation(array, m);
  return perm.map((value, index) => {
    return [value, array[index]];
  });
};

export const random = {
  choice: (arr) => {
    return arr[Math.floor(Math.random() * arr.length)];
  },
  random: () => {
    return Math.random();
  },
};

export const initializeDistribution = (sprite_types) => {
  let catch_all_prior = 0.000001;
  const initial_distribution = { OTHER: catch_all_prior };

  sprite_types.forEach((sprite_type) => {
    initial_distribution[sprite_type] =
      (1.0 - catch_all_prior) / sprite_types.length;
  });
  return initial_distribution;
};

export const getAbsoluteDirection = (ori, rel_dir) => {
  const [ox, oy] = ori
  const [dx, dy] = rel_dir
  // Rotation using the orientation
  const absolute_dx = ox * dx - oy * dy
  const absolute_dy = oy * dx + ox * dy
  return [absolute_dx, absolute_dy]
}

export const UniformVectorToDegree = (x, y) => {
  let angle = Math.atan2(y, x) * 180 / Math.PI - 90;
  // console.log(angle, Math.atan2(y, x), y, x)
  if(angle < 0)
      angle += 360;
  return angle;
}

export const DegreeToUniformVector = (angle) => {
  let x = Math.cos(angle * Math.PI / 180);
  let y = Math.sin(angle * Math.PI / 180);
  return [x, y]
}

export function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
}

export function includesArray(mainArray, searchArray) {
  for (let arr of mainArray) {
    if (arraysEqual(arr, searchArray)) {
      return true;
    }
  }
  return false;
}
