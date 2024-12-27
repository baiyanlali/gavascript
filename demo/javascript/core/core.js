import * as tools from "./tools.js";
import * as Resource from "./ontology/resource.js";
import * as Games from "./games.js";
import * as Sprite from "./ontology/vgdl-sprite.js";
import * as Constants from "./ontology/constants.js";
import * as Avatars from "./ontology/avatar.js";
import * as Termination from "./ontology/termination.js";
import * as Condition from "./ontology/conditional.js";
import * as Effect from "./ontology/effect.js";
import * as Physics from "./ontology/physics.js";
import { killSprite, scoreChange } from "./ontology/effect.js";
import { BasicGame } from "./games.js";

const EVALS = {
  True: true,
  False: false,
};

for (const x of [
  tools,
  Games,
  Sprite,
  Constants,
  Avatars,
  Termination,
  Condition,
  Effect,
  Physics,
  Resource,
]) {
  const constantKeys = Object.keys(x);

  // 遍历属性并添加到字典中
  constantKeys.forEach((key) => {
    EVALS[key] = x[key];
  });
}

export class Node {
  constructor(content, indent, parent = null, line = 0) {
    this.children = [];
    this.content = content;
    this.indent = indent;
    this.parent = null;
    this.line = line;
    if (parent) parent.insert(this);
  }

  insert = (node) => {
    // console.log(this.content, node.content)
    if (this.indent < node.indent) {
      this.children.push(node);
      node.parent = this;
    } else {
      this.parent.insert(node);
    }
  };

  getRoot = () => {
    if (this.parent) return this.parent.getRoot();
    else return this;
  };
}

function indentTreeParser(s = "", tabsize = 8) {
  s = s.replace("\t", " ".repeat(tabsize));
  s = s.replace("(", " ").replace(")", " ").replace(",", " ");
  let lines = s.split("\n");

  let last = new Node("", -1);

  const root = last;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (line.includes("#")) {
      line = line.split("#")[0];
    }

    const content = line.trim();

    if (content.length > 0) {
      const indent = line.length - line.trimStart().length;
      last = new Node(content, indent, last, i);
    }
  }

  // for (let line of lines) {
  //     if(line.includes("#")){
  //         line = line.split("#")[0]
  //     }

  //     const content = line.trim()

  //     if(content.length > 0){
  //         const indent = line.length - line.trimStart().length
  //         last = new Node(content, indent, last)
  //     }
  // }
  return root;
}

function _eval(estr) {
  if (estr === "True") return true;
  if (estr === "False") return false;
  try {
    return eval(estr);
  } catch (e) {
    if (!EVALS.hasOwnProperty(estr)) throw e;
    return eval(`EVALS.${estr}`);
  }
}

export class VGDLParser {
  game = null;
  images = ["error.png"];
  ignore_colors = ["wall", "avatar"];
  var_colors = {};

  parseGame = (tree, seed = null) => {
    if (!(tree instanceof Node)) tree = indentTreeParser(tree);
    const root = tree.children[0];
    const [sclass, args] = this.parseArgs(root.content);
    this.game = new sclass(args);

    // Parse Parameter Set first
    for (const c of root.children) {
      if (c.content === "ParameterSet") {
      }
    }
    try {
      for (const c of root.children) {
        switch (c.content) {
          case "SpriteSet":
            this.parseSprites(c.children);
            // this.parseSprites(c.children)
            break;
          case "InteractionSet":
            this.parseInteraction(c.children);
            break;
          case "LevelMapping":
            this.parseLevel(c.children);
            break;
          case "TerminationSet":
            this.parseTermination(c.children);
            break;
          case "ConditionSet":
            this.parseCondition(c.children);
            break;
          default:
            console.error(`Unknown content: ${c.content} at line ${c.line}`);
            break;
        }
      }
    } catch (e) {
      throw e;
    }

    const keys = [];
    let colors = [];

    for (const key in this.var_colors) {
      keys.push(key);
      colors.push(this.game.sprite_constr[key][1].color);
    }

    if (seed) {
      colors = colors.shuffled(seed);
      let index = 0;
      colors.forEach((c) => {
        this.game.sprite_constr[keys[index]][1].color = c;
        index++;
      });
    }

    this.game.images = this.images.slice();
    return this.game;
  };

  parseLevel = (mnodes) => {
    mnodes.forEach((mnode) => {
      try {
        if (mnode.content.indexOf(">") === -1) {
          throw "No '>' symbol in level mapping";
        }
        const [c, val] = mnode.content.split(">").map((x) => {
          return x.trim();
        });

        console.assert(
          c.length === 1,
          "Only single character mappings allowed",
        );

        const keys = val.split(" ").map((x) => {
          return x.trim();
        });

        console.debug("Mapping", c, keys);

        this.game.char_mapping[c] = keys;
      } catch (e) {
        throw new Error(
          `Parse Level Mapping Fail at Line ${mnode.line}: \n ${mnode.content} \n ${e.toString()}`,
        );
      }
    });
  };

  parseCondition = (cnodes) => {
    cnodes.forEach((c) => {
      if (c.content.indexOf(">") !== -1) {
        const [conditional, interaction] = c.content
          .split(">")
          .map((s) => s.trim());

        try {
          const [cclass, cargs] = this.parseArgs(conditional);
          const [eclass, eargs] = this.parseArgs(conditional);

          console.debug(`Adding Condition ${conditional}  ${interaction}`);

          this.game.conditions.push([new cclass(cargs), [eclass, eargs]]);
        } catch (e) {
          throw new Error(
            `Parse Condition Fail at Line ${c.line}: \n ${c.content} \n ${e.toString()}`,
          );
        }
      }
    });
  };

  parseTermination = (tnodes) => {
    tnodes.forEach((t) => {
      try {
        const [sclass, args] = this.parseArgs(t.content);
        console.debug(`Adding Termination: ${sclass} ${args}`);
        this.game.terminations.push(new sclass(args));
      } catch (e) {
        throw new Error(
          `Parse Termination Fail at Line ${t.line}:\n ${t.content} \n ${e.toString()}`,
        );
      }
    });
  };

  parseInteraction = (inodes) => {
    inodes.forEach((i) => {
      if (i.content.indexOf(">") !== -1) {
        try {
          const [pair, edef] = i.content.split(">").map((s) => s.trim());
          const [eclass, args] = this.parseArgs(edef);

          //支持object为多个的情况，测试环境为surround
          const pairs = pair
            .split(" ")
            .map((s) => s.trim())
            .filter((s) => s);

          const subject = pairs[0];

          for (let pair_idx = 1; pair_idx < pairs.length; pair_idx++) {
            const object = pairs[pair_idx];
            this.game.collision_eff.push([subject, object, eclass, args]);
            if (args["scoreChange"]) {
              this.game.collision_eff.push([
                subject,
                object,
                scoreChange,
                { score: args["scoreChange"] },
              ]);
            }

            if (args["killSecond"]) {
              this.game.collision_eff.push([
                object,
                subject,
                killSprite,
                { score: args["killSecond"] },
              ]);
            }
          }

          console.debug(`Adding Collision ${pair} has effect: ${edef}`);
        } catch (e) {
          throw new Error(
            `Parse Interaction Fail at Line ${i.line}: \n ${i.content} \n ${e.toString()}`,
          );
        }
      }
    });
  };

  parseSprites = (
    snodes,
    parentClass = null,
    parentargs = {},
    parenttypes = [],
  ) => {
    snodes.forEach((s) => {
      try {
        console.assert(s.content.indexOf(">") !== -1);
        const [key, sdef] = s.content.split(">").map((s) => s.trim());
        let [sclass, args] = this.parseArgs(
          sdef,
          parentClass,
          Object.assign({}, parentargs),
        );

        if ("image" in args) {
          this.images.push(args.image);
        }

        const stypes = parenttypes.concat(key);
        if ("singleton" in args) {
          if (args["singleton"] === true) this.game.singletons.push(key);
          args = JSON.parse(JSON.stringify(args));
          delete args["singleton"];
        }

        if (s.children.length === 0) {
          console.debug(`Defining: ${key} ${sclass} ${args} ${stypes}`);
          this.game.sprite_constr[key] = [sclass, args, stypes];

          if (
            args.color &&
            !("color" in parentargs) &&
            !this.ignore_colors.contains(key)
          ) {
            this.var_colors[key] = args.color;
          }

          if (this.game.sprite_order.contains(key))
            this.game.sprite_order.remove(key);
          this.game.sprite_order.push(key);

          let dict = this.game.objectTypes;

          for (const parent of stypes) {
            if (parent === key) {
              break;
            }
            dict = dict[parent];
          }
          dict[key] = {};
        } else {
          let dict = this.game.objectTypes;

          for (const parent of stypes) {
            if (parent === key) {
              break;
            }
            dict = dict[parent];
          }
          dict[key] = {};

          this.parseSprites(s.children, sclass, args, stypes);
        }
      } catch (e) {
        throw new Error(
          `Parse Sprite Fail at Line ${s.line}: \n ${s.content} \n ${e.toString()}`,
        );
      }
    });
  };

  parseArgs = (s, sclass = {}, args = {}) => {
    let sparts = s
      .split(" ")
      .filter((c) => c.length > 0)
      .map((c) => c.trim());
    if (sparts.length === 0) return [sclass, args];

    if (sparts[0].indexOf("=") === -1) {
      sclass = _eval(sparts[0]);
      sparts = sparts.slice(1);
    }

    sparts.forEach((spart) => {
      const [k, val] = spart.split("=");

      try {
        args[k] = _eval(val);
      } catch (e) {
        args[k] = val;
      }
    });
    return [sclass, args];
  };
}
