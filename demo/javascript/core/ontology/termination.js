export class Termination {
  isDone = (game) => {
    return [false, null];
  };
}

export class Timeout extends Termination {
  constructor(args) {
    super();
    this.limit = args.limit;
    this.win = args.win;
    this.name = "Timeout";
    if (args.bonus) {
      this.bonus = args.bonus;
    } else {
      this.bonus = 0;
    }
  }

  isDone = (game) => {
    if (game.time >= this.limit) {
      return [true, this.win];
    } else {
      if (game.time >= game.timeout_bonus_granted_on_timestep) {
        //game.score += this.bonus;
        game.bonus_score += this.bonus;
        game.bonus_score = Math.round(game.bonus_score * 100) / 100;
        //Math.round(this.bonus * 10) / 10.0;//this.bonus.toFixed(1);
        //game.score = game.score.toFixed(1);
        game.timeout_bonus_granted_on_timestep = game.time;
      }
      return [false, null];
    }
  };
}

export class SpriteCounter extends Termination {
  constructor(args) {
    super();
    this.limit = args.limit || 0;
    this.stype = args.stype;
    this.win = args.win;
    this.name = "SpriteCounter";
    if (args.bonus) {
      this.bonus = args.bonus;
    } else {
      this.bonus = 0;
    }
  }

  isDone = (game) => {
    if (game.numSprites(this.stype) <= this.limit) {
      if (game.time > game.sprite_bonus_granted_on_timestep) {
        game.bonus_score += this.bonus;
        game.score += this.bonus;
        //Math.round(this.bonus * 10) / 10.0;
        //game.score = game.score.toFixed(1);
        game.sprite_bonus_granted_on_timestep = game.time;
      }
      // console.debug(
        // "Termination Result:",
        // this.stype,
        // game.numSprites(this.stype),
        // "/",
        // this.limit,
        // this.win,
      // );
      return [true, this.win];
    } else return [false, null];
  };
}

export class MultiSpriteCounter extends Termination {
  constructor(args) {
    super();
    this.limit = args.limit;
    this.win = args.win;
    if (args.bonus) {
      this.bonus = args.bonus;
    } else {
      this.bonus = 0;
    }
    this.name = "MultiSpriteCounter";
    this.array_args = Object.keys(args);
    this.stypes = this.array_args
      .filter((arg) => {
        return arg.includes("stype");
      })
      .map((stype) => {
        return args[stype];
      });
  }

  isDone = (game) => {
    if (
      this.stypes
        .map((st) => {
          return game.numSprites(st);
        })
        .reduce((s, n) => {
          return s + n;
        }, 0) === this.limit
    ) {
      if (game.time > game.sprite_bonus_granted_on_timestep) {
        game.bonus_score += this.bonus;
        game.score += this.bonus;
        //Math.round(this.bonus * 10)/ 10.0;
        //game.score = game.score.toFixed(1);
        game.sprite_bonus_granted_on_timestep = game.time;
      }
      console.log(this.stypes);
      return [true, this.win];
    } else {
      return [false, null];
    }
  };
}
