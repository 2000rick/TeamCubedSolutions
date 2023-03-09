const top=0,parent=c=>(c+1>>>1)-1,left=c=>(c<<1)+1,right=c=>c+1<<1;
class PriorityQueue {
    constructor(comparator = (a, b) => a > b) {
      this._heap = [];
      this._comparator = comparator;
    }
    size() {
      return this._heap.length;
    }
    isEmpty() {
      return this.size() == 0;
    }
    peek() {
      return this._heap[top];
    }
    push(...values) {
      values.forEach(value => {
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
        let maxChild = (right(node) < this.size() && this._greater(right(node), left(node))) ? right(node) : left(node);
        this._swap(node, maxChild);
        node = maxChild;
      }
    }
 }

class Container {
    constructor() {
        this.weight = 0;
        this.label = "UNUSED";
    }
    constructor(label, weight) {
        this.weight = weight;
        this.label = label;
    }
}

class Node {
    constructor() {
        this.state = new Array(9);
        for(let i=0; i<9; ++i) {
            this.state[i] = new Array(13);
        }
        this.buffer = new Array(5);
        for(let i=0; i<5; ++i) {
            this.buffer[i] = new Array(25);
        }
        this.OPERATORS = [
            [11, 1], [13, 1]
        ];
        this.moves = [];
        this.moves_cost = [];
        this.cost = 0;
        this.current = 0;
        this.search = 0;
        this.fail = 0;
        this.expanded = 0;
        this.queueSize = 0;
        this.ToLoad = [];
        this.ToUnload = [];
        this.crane = [9, 1];
    }
    GOAL_STATE() {
        if(this.search == 1) {
            return this.ToLoad.length == 0 && this.ToUnload.length == 0;
        }
        else if(this.search == 2) {
            let left = 0, right = 0;
            for(let i=1; i<=8; ++i) {
                for(let j=1; j<=6; ++j) {
                    left += this.state[i][j].weight;
                }
            }
            for(let i=1; i<=8; ++i) {
                for(let j=7; j<=12; ++j) {
                    right += this.state[i][j].weight;
                }
            }
            return (Math.min(left, right) / Math.max(left, right)) > 0.9;
        }
        return false;
    }
    print() {
        for(let i=1; i<=8; ++i) {
            for(let j=1; j<=12; ++j) {
                console.log(`[${i.toString().padStart(2, '0')}, ${j.toString().padStart(2, '0')}], {${this.state[i][j].weight.toString().padStart(5, '0')}}, ${this.state[i][j].label}`);
            }
        }
    }
    solution() {
        if(this.fail) return;
        if(this.moves.length == 0) {
            console.log("No moves generated! Problem already solved."); return; 
        }
        console.log("\nSolution: ");
        let sol = "";
        const max_width = 50;
        for(let i=0; i<this.moves.length; ++i) {
            sol += this.moves[i] + " ".repeat(max_width-this.moves[i].length) + "(Est. " + this.moves_cost[i] + " minutes)" + "\n";
        }
        console.log(sol);
    }
    ResetCrane() {
        this.cost += Math.abs(this.crane[0] - 9) + Math.abs(this.crane[1] - 1);
        this.moves.push("Reset crane to default position");
        this.moves_cost.push(Math.abs(this.crane[0] - 9) + Math.abs(this.crane[1] - 1));
        this.crane = [9, 1];
    }
}

function ManhattanHeuristic(node) {
    let heuristic = 0; //This is h(n)
    if(node.search == 1) {
        const target_row = 11; const target_col = 1;
        for(let i=0; i<node.ToUnload.length; ++i) {
            let row = node.ToUnload[i][0];
            let col = node.ToUnload[i][1];
            heuristic += Math.abs(row-target_row) + Math.abs(col-target_col);
        }
        let loadCount = node.ToLoad.length;
        for(let j=1; j<=12; ++j) {
            for(let i=1; i<=8; ++i) {
                if(loadCount == 0) break;
                if(node.state[i][j].label == "UNUSED") {
                    heuristic += Math.abs(i-target_row) + Math.abs(j-target_col);
                    --loadCount;
                }
            }
        }
    }
    else if(node.search == 2) {
        heuristic = 0;
    }
    return heuristic;
}

function comp(a, b) {
    return a.cost == b.cost ? a.current > b.current : a.cost > b.cost;
}

function MAKE_QUEUE(node) {
    const nodes = new PriorityQueue((a, b) => a.cost < b.cost);
    node.cost += ManhattanHeuristic(node);
    nodes.push(node);
    return nodes;
}

function REMOVE_FRONT(nodes) {
    let node = nodes[0];
    nodes.shift();
    return node;
}

function PathCost(node, src, dest) {
    const direction = (src[1] - dest[1]) > 0 ? -1 : 1;
    let cost = 0;
    let current = src;
    while(current[1] != dest[1]) {
        if(node.state[current[0]][current[1]+direction].label == "UNUSED") {
            current[1] += direction;
        } else {
            ++current[0];
        }
        ++cost;
    }
    cost += Math.abs(current[0] - dest[0]) + Math.abs(current[1] - dest[1]);
    return cost;
}

function QUEUE_UNLOAD(nodes, node, OPERATORS, visited) {
    const truck_row = 11;    const truck_col = 1;
    for(let k=node.ToUnload.length-1; k>=0; --k) { // iterate backwards to avoid invalidating indices
        let row = node.ToUnload[k][0];
        let col = node.ToUnload[k][1];
        // Move container to unload to a truck
        if(node.state[row+1][col].label == "UNUSED") {
            let expand = node;
            let atomic_cost = PathCost(expand, expand.crane, [row, col]);
            expand.moves.push("Unload {" + row + ',' + col + '}' + ' ' + expand.state[row][col].label + ", to truck");            
            expand.state[row][col] = new Container();
            expand.ToUnload.splice(k, 1);
            atomic_cost += (truck_row-row) + (col-truck_col);
            expand.current += atomic_cost;
            expand.cost = expand.current + ManhattanHeuristic(expand);
            expand.crane = [11, 1];
            expand.moves_cost.push(atomic_cost);
            nodes.push(expand);
            // if(visited.find(expand.state) == visited.end()) {
            //     nodes.push(expand);
            //     visited.insert(expand.state);
            // }
        }
        // Move container blocking another container to be unloaded to ALL available cells within the ship, if possible; otherwise, to the buffer.
        else { // [row+1][col] is occupied
            let rowTaken = row+1;
            for(let q=8; q>=rowTaken; --q) {
                if(node.state[q][col].label != "UNUSED") {
                    row = q;
                    break;
                }
            }
            for(let j=1; j<=12; ++j) {
                for(let i=1; i<=8; ++i) {
                    if(node.state[i][j].label == "UNUSED" && j != col) {
                        let expand = node;
                        expand.moves.push("Move {" + row + ',' + col + '}' + ' ' + expand.state[row][col].label + " to {" + i + ',' + j + '}');
                        let atomic_cost = PathCost(expand, expand.crane, [row, col]) + PathCost(expand, [row, col], [i, j]);
                        let temp = expand.state[row][col];
                        expand.state[row][col] = expand.state[i][j];
                        expand.state[i][j] = temp;
                        expand.current += atomic_cost;
                        expand.cost = expand.current + ManhattanHeuristic(expand);
                        expand.crane = [i, j];
                        expand.moves_cost.push(atomic_cost);
                        nodes.push(expand);
                        break;
                    }
                }
            }
        }
    }
}

function QUEUE_LOAD(nodes, node, OPERATORS, visited) {
    if(node.ToLoad.length == 0) return;
    const truck_row = 11;    const truck_col = 1;
    // Load one container from truck to ALL columns on the ship(state).
    let containerToLoad = node.ToLoad[node.ToLoad.length-1];
    for(let j=1; j<=12; ++j) {
        for(let i=1; i<=8; ++i) {
            if(node.state[i][j].label == "UNUSED") {
                let expand = node;
                expand.moves.push("Load " + containerToLoad.label + " to {" + i + ',' + j + '}');                    
                expand.state[i][j] = containerToLoad;
                let distance = abs(i-11) + abs(j-1);
                let atomic_cost = abs(expand.crane[0]-truck_row) + abs(expand.crane[1]-truck_col);
                atomic_cost += distance;
                expand.current += atomic_cost;
                expand.ToLoad.pop();
                expand.cost = expand.current + ManhattanHeuristic(expand);
                expand.crane = [i, j];
                expand.moves_cost.push(atomic_cost);
                nodes.push(expand);
                break;
            }
        }
    }
}

function QUEUE_BALANCE(nodes, node, OPERATORS, visited) {
    // Compute the weight of the left and right side of the ship
    let left = 0, right = 0;
    for(let i=1; i<=8; ++i) {
        for(let j=1; j<=6; ++j) {
            left += node.state[i][j].weight;
        }
    }
    for(let i=1; i<=8; ++i) {
        for(let j=7; j<=12; ++j) {
            right += node.state[i][j].weight;
        }
    }
    // For all columns in the heavier side of the ship, expand the states
    if(left > right) {
        for(let j=1; j<=6; ++j) {
            for(let i=8; i>=1; --i) {
                if(node.state[i][j].weight != 0) {
                    for(let x=1; x<=12; ++x) {
                        for(let y=1; y<=8; ++y) {
                            if(node.state[y][x].label == "UNUSED" && x != j) {
                                let expand = node;
                                let atomic_cost = PathCost(expand, expand.crane, [i, j]) + PathCost(expand, [i, j], [y, x]); //make sure this is before swap() to avoid bugs
                                expand.moves.push("Move {" + i + ',' + j + '}' + ' ' + expand.state[i][j].label + " to {" + y + ',' + x + '}');
                                swap(expand.state[i][j], expand.state[y][x]);
                                expand.current += atomic_cost;
                                expand.cost = expand.current + ManhattanHeuristic(expand);
                                expand.crane = [y, x];
                                expand.moves_cost.push(atomic_cost);
                                // nodes.push(expand);
                                if(visited.find(expand.state) == visited.end()) {
                                    nodes.push(expand);
                                    visited.insert(expand.state);
                                }
                                break; // breaks out of loop for y, moves on to next x (next column)
                            }
                        }
                    }
                    break; // breaks out of loop for i, moves on to next j (next column)
                }
            }
        }
    }
    else {
        for(let j=7; j<=12; ++j) {
            for(let i=8; i>=1; --i) {
                if(node.state[i][j].weight != 0) {
                    for(let x=1; x<=12; ++x) {
                        for(let y=1; y<=8; ++y) {
                            if(node.state[y][x].label == "UNUSED" && x != j) {
                                let expand = node;
                                let atomic_cost = PathCost(expand, expand.crane, [i, j]) + PathCost(expand, [i, j], [y, x]); //make sure this is before swap() to avoid bugs
                                expand.moves.push("Move {" + i + ',' + j + '}' + ' ' + expand.state[i][j].label + " to {" + y + ',' + x + '}');
                                swap(expand.state[i][j], expand.state[y][x]);
                                expand.current += atomic_cost;
                                expand.cost = expand.current + ManhattanHeuristic(expand);
                                expand.crane = [y, x];
                                expand.moves_cost.push(atomic_cost);
                                // nodes.push(expand);
                                if(visited.find(expand.state) == visited.end()) {
                                    nodes.push(expand);
                                    visited.insert(expand.state);
                                }
                                break; // breaks out of loop for y, moves on to next x (next column)
                            }
                        }
                    }
                    break; // breaks out of loop for i, moves on to next j (next column)
                }
            }
        }
    }
}

function QUEUEING_FUNCTION(nodes, node, OPERATORS, visited) {
    // Move container to unload to a truck
    // Move container blocking another container to unload to ALL available cells within the ship.
    // Load container from truck to ALL available cells on the ship(state).

    if(node.search == 1) {
        QUEUE_UNLOAD(nodes, node, OPERATORS, visited);
        QUEUE_LOAD(nodes, node, OPERATORS, visited);
    }
    else if(node.search == 2) {
        QUEUE_BALANCE(nodes, node, OPERATORS, visited);
    }
    else {
        console.log("WARNING: UNKNOWN OPERATION.\nPlease select load/unload or balance.");
    }
}

function general_search(problem, QUEUEING_FUNCTION) {
    let nodesExpanded = 0; // number of nodes expanded
    let queueMaxSize = 0; // the maximum size of the queue
    let nodes = MAKE_QUEUE(problem);
    let visited = new Set();
    visited.add(nodes[0].state);
    while(true) {
        queueMaxSize = Math.max(queueMaxSize, nodes.length);
        if(nodes.length == 0) {
            let failure = new Node();
            failure.expanded = nodesExpanded;
            failure.queueSize = queueMaxSize;
            failure.fail = true;
            return failure;
        }
        
        let node = REMOVE_FRONT(nodes);
        // if(nodesExpanded % 10000 == 0) {
        //     console.log("Expanded " + nodesExpanded + " nodes. Queue size: " + nodes.length);
        // }
        // console.log("The best state to expand with a g(n) = " + node.current + " and h(n) = " + (node.cost - node.current) + " is:\n");
        // node.print();
        ++nodesExpanded;
        node.expanded = nodesExpanded;
        node.queueSize = queueMaxSize;
        if(node.GOAL_STATE()) {
            console.log("Goal state!");
            node.ResetCrane();
            return node; 
        }
        QUEUEING_FUNCTION(nodes, node, node.OPERATORS, visited);
    }

    return problem; //never reached
}

function Run() {
    let data = readFile();
    let problem = new Node(data);
    problem.ToUnload.push([1,4]);
    problem.ToUnload.push([1,5]);
    problem.ToLoad.push(new Container("Nat", 153));
    problem.ToLoad.push(new Container("Rat", 2321));
    problem.search = 2;
    let begin = new Date().getTime();
    let result = general_search(problem, QUEUEING_FUNCTION);
    let end = new Date().getTime();

    console.log("\nTime Elapsed: " + (end - begin) + " milliseconds\n");
    if(result.fail)
        console.log("\nFAILURE\n");
    else {
        console.log("\nSUCCESS\n");
        result.solution();
        console.log("Total time to completion: " + result.cost + " minutes\n\n");
        console.log("Solution Depth: " + (result.moves.length-1) + "\nNodes Expanded: " + result.expanded + "\nMax Queue Size: " + result.queueSize);
    }
    console.log("=======================================================================\n\n");
}


