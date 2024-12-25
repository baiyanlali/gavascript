//Priority Queue is from https://stackoverflow.com/questions/42919469/efficient-way-to-implement-priority-queue-in-javascript

const top = 0;
const parent = (i) => ((i + 1) >>> 1) - 1;
const left = (i) => (i << 1) + 1;
const right = (i) => (i + 1) << 1;

class PriorityQueue {
  constructor(comparator = (a, b) => a > b) {
    this._heap = [];
    this._comparator = comparator;
  }
  size() {
    return this._heap.length;
  }
  isEmpty() {
    return this.size() === 0;
  }
  peek() {
    return this._heap[top];
  }
  push(...values) {
    values.forEach((value) => {
      this._heap.push(value);
      this._siftUp();
    });
    return this.size();
  }
  pop() {
    const poppedValue = this.peek();
    const bottom = this.size() - 1;
    if (bottom > top) {
      this._swap(top, bottom);
    }
    this._heap.pop();
    this._siftDown();
    return poppedValue;
  }
  replace(value) {
    const replacedValue = this.peek();
    this._heap[top] = value;
    this._siftDown();
    return replacedValue;
  }
  _greater(i, j) {
    return this._comparator(this._heap[i], this._heap[j]);
  }
  _swap(i, j) {
    [this._heap[i], this._heap[j]] = [this._heap[j], this._heap[i]];
  }
  _siftUp() {
    let node = this.size() - 1;
    while (node > top && this._greater(node, parent(node))) {
      this._swap(node, parent(node));
      node = parent(node);
    }
  }
  _siftDown() {
    let node = top;
    while (
      (left(node) < this.size() && this._greater(left(node), node)) ||
      (right(node) < this.size() && this._greater(right(node), node))
    ) {
      let maxChild =
        right(node) < this.size() && this._greater(right(node), left(node))
          ? right(node)
          : left(node);
      this._swap(node, maxChild);
      node = maxChild;
    }
  }
}

function compare(a, b) {
  if (a.totalCost + a.estimatedCost < b.totalCost + b.estimatedCost) {
    return -1;
  }
  if (a.totalCost + a.estimatedCost > b.totalCost + b.estimatedCost) {
    return 1;
  }
  return 0;
}

function create2DArray(rows, cols, initialValue) {
  return Array.from({ length: rows }, () => Array(cols).fill(initialValue));
}

class Node {
  totalCost = 0;
  estimatedCost = 0;
}

export class AStar {
  static closedList = new PriorityQueue(compare);
  static openList = new PriorityQueue(compare);
  pathFinder = null;
  visited = [];

  constructor(pathFinder) {
    this.pathFinder = pathFinder;
    this.visited = create2DArray(
      this.pathFinder.grid.length,
      this.pathFinder.grid[0].length,
      false,
    );
  }
}

export class PathFinder {
  astar = null;
  grid = [[]];
  constructor() {}

  runn() {
    this.grid = [[]];
    this.astar = new AStar(this);
  }
}
