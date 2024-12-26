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

const parent = new Node("parent", 0);
const child1 = new Node("child1", 1, parent);
const child2 = new Node("child2", 1, parent);