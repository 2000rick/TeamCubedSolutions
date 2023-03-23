var fs = require('fs');
const homeDir = require('os').homedir();
var FastPriorityQueue = require('fastpriorityqueue');

class Container {
  constructor(label = "UNUSED", weight = 0) {
      this.label = label;
      this.weight = weight;
  }
}

class Node {
  constructor() {
    this.state = new Array(9);
    for(let i=0; i<9; ++i) {
        this.state[i] = new Array(13);
    }
    this.OPERATORS = [];
    this.movePairs = [];
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
      else if(this.search == 3) {
        let n = this.siftCoordinates.length;
        for(let i=0; i<n; ++i) {
            let curr = this.siftCoordinates[i];
            if(this.state[curr[0]][curr[1]].label != this.siftContainers[i].label) return false;
        }
        return true;
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
      console.log(this.movePairs);
  }
  ResetCrane() {
      this.cost += Math.abs(this.crane[0] - 9) + Math.abs(this.crane[1] - 1);
      this.moves.push("Restore crane to default position");
      this.moves_cost.push(Math.abs(this.crane[0] - 9) + Math.abs(this.crane[1] - 1));
      this.movePairs.push([JSON.parse(JSON.stringify(this.crane)), [9, 1]]);
      this.crane = [9, 1];
  }
  // https://gist.github.com/GeorgeGkas/36f7a7f9a9641c2115a11d58233ebed2
  static clone(instance) {
    return Object.assign(
      Object.create(
        Object.getPrototypeOf(instance),
      ),
      // Prevent shallow copies of nested structures like arrays, etc
      JSON.parse(JSON.stringify(instance)),
    );
  }
}
  
function ParseData(data) {
  var lines = data.split("\r\n");
  let ship = new Array(9);
  for(let i = 0; i < 9; i++) {
      ship[i] = new Array(13);
      for(let j = 0; j < 13; j++) {
          ship[i][j] = new Container();
      }
  }
  let idx = 0;
  for(let i = 1; i <= 8; ++i) {
      for(let j = 1; j <= 12; ++j, ++idx) {
        let line = lines[idx].split(",");
        ship[i][j].weight = parseInt(line[2].substr(2,5));
        ship[i][j].label = line[3].substr(1);
      }
  }
  
  return ship;
}

// we can use this function for log file purposes
async function GetDateTime() {
    let apiData = await fetch("http://worldtimeapi.org/api/timezone/America/Los_Angeles");
    let data = await apiData.json();
    datetime = new Date(data['datetime'].substring(0, 19)).toString();
    let result = datetime.toString().substr(4,11) + ':' + datetime.toString().substr(15, 6) + ' ' + data['abbreviation'];
    return result;
}

function WriteManifest(ship, outputFile) {
    const Desktop = `${homeDir}\\Desktop`;
    const output = `${Desktop}\\${outputFile.split(".")[0]}OUTBOUND.txt`;
    let manifest = "";
    for(let i = 1; i <= 8; ++i) {
        for(let j = 1; j <= 12; ++j) {
            manifest += `[${i.toString().padStart(2, '0')}, ${j.toString().padStart(2, '0')}], {${ship[i][j].weight.toString().padStart(5, '0')}}, ${ship[i][j].label}` + "\n";
        }
    }
    if(fs.existsSync(output))
        fs.chmodSync(output, 0o600); //Read/Write
    fs.writeFileSync(output, manifest);
    fs.chmodSync(output, 0o400); //Read Only permission
    WriteLog(logPath, `Finished a cycle. Manifest ${output.split('\\').pop()} was written to Desktop, and a reminder pop-up to operator to send file was displayed.`);
}

// https://www.geeksforgeeks.org/node-js-fs-chmod-method/
async function WriteLog(path, text) {
    datetime = await GetDateTime();
    text = datetime + ' ' + text + "\n";
    if(fs.existsSync(path))
        fs.chmodSync(path, 0o600); //Read/Write
    fs.appendFileSync(path, text);
    fs.chmodSync(path, 0o444); //Changes File to Read Only
}

function ManhattanHeuristic(node) {
  let heuristic = 0; // h(n)
  if(node.search == 1) { // Load/Unload
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
                heuristic += Math.abs((i+1)-target_row) + Math.abs(j-target_col);
                --loadCount;
            }
        }
    }
  }
  else if(node.search == 2) { // Balance
    heuristic = 0;
  }
  else if(node.search == 3) { // Sift
    for(let i=1; i<=8; ++i) {
        for(let j=1; j<=12; ++j) {
            if(node.state[i][j].weight != 0) {
                for(let k=0; k<node.siftContainers.length; ++k) {
                    if(node.state[i][j].label == node.siftContainers[k].label) {
                        let row = node.siftCoordinates[k][0];
                        let col = node.siftCoordinates[k][1];
                        if(i != row || j != col) {
                            heuristic += Math.abs(i-row) + Math.abs(j-col);
                        }
                    }
                }
            }
        }
    }
  }
  return heuristic;
}

function MAKE_QUEUE(node) {
  const nodes = new FastPriorityQueue((a, b) => a.cost < b.cost);
  node.cost += ManhattanHeuristic(node);
  nodes.add(node);
  return nodes;
}

function PathCost(node, src, dest) {
  const direction = (src[1] - dest[1]) > 0 ? -1 : 1;
  let cost = 0;
  let current = src;
  while(current[1] != dest[1] && current[0] < 9) {
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
          let expand = Node.clone(node);
          let atomic_cost = PathCost(expand, expand.crane, [row+1, col]); // row+1 due to how crane operates
          atomic_cost += Math.abs(truck_row-(row+1)) + Math.abs(truck_col-col);
          expand.moves.push("Unload {" + row + ',' + col + '}' + ' ' + expand.state[row][col].label + ", to truck"); 
          expand.movePairs.push([[row, col], [truck_row, truck_col]]);          
          expand.state[row][col] = new Container();
          expand.ToUnload.splice(k, 1);
          expand.current += atomic_cost;
          expand.cost = expand.current + ManhattanHeuristic(expand);
          expand.crane = [11, 1];
          expand.moves_cost.push(atomic_cost);
          nodes.add(expand);
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
                      let expand = Node.clone(node);
                      expand.moves.push("Move {" + row + ',' + col + '}' + ' ' + expand.state[row][col].label + " to {" + i + ',' + j + '}');
                      expand.movePairs.push([[row, col], [i, j]]);
                      let atomic_cost = PathCost(expand, expand.crane, [row+1, col]) + PathCost(expand, [row, col], [i, j]);
                      let temp = expand.state[row][col];
                      expand.state[row][col] = expand.state[i][j];
                      expand.state[i][j] = temp;
                      expand.current += atomic_cost;
                      expand.cost = expand.current + ManhattanHeuristic(expand);
                      expand.crane = [i+1, j]; // i+1 due to crane operation
                      expand.moves_cost.push(atomic_cost);
                      nodes.add(expand);
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
              let expand = Node.clone(node);
              expand.moves.push("Load " + containerToLoad.label + " to {" + i + ',' + j + '}');
              expand.movePairs.push([[truck_row, truck_col], [i, j]]);                    
              expand.state[i][j] = containerToLoad;
              let atomic_cost = Math.abs(expand.crane[0]-truck_row) + Math.abs(expand.crane[1]-truck_col);
              let distance = Math.abs(i-10) + Math.abs(j-1); // i-10 = (i+1)-11, due to crane operation
              atomic_cost += distance;
              expand.current += atomic_cost;
              expand.ToLoad.pop();
              expand.cost = expand.current + ManhattanHeuristic(expand);
              expand.crane = [i+1, j];
              expand.moves_cost.push(atomic_cost);
              nodes.add(expand);
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
                              let expand = Node.clone(node);
                              let atomic_cost = PathCost(expand, expand.crane, [i+1, j]) + PathCost(expand, [i, j], [y, x]); 
                              expand.moves.push("Move {" + i + ',' + j + '}' + ' ' + expand.state[i][j].label + " to {" + y + ',' + x + '}');
                              expand.movePairs.push([[i, j],[y, x]]);
                              let temp = expand.state[i][j];
                              expand.state[i][j] = expand.state[y][x];
                              expand.state[y][x] = temp;
                              expand.current += atomic_cost;
                              expand.cost = expand.current + ManhattanHeuristic(expand);
                              expand.crane = [y+1, x];
                              expand.moves_cost.push(atomic_cost);
                              let key = JSON.stringify(expand.state);
                              if(!visited.has(key)) {
                                nodes.add(expand);
                                visited.add(key);
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
                              let expand = Node.clone(node);
                              let atomic_cost = PathCost(expand, expand.crane, [i+1, j]) + PathCost(expand, [i, j], [y, x]);
                              expand.moves.push("Move {" + i + ',' + j + '}' + ' ' + expand.state[i][j].label + " to {" + y + ',' + x + '}');
                              expand.movePairs.push([[i, j],[y, x]]);
                              let temp = expand.state[i][j];
                              expand.state[i][j] = expand.state[y][x];
                              expand.state[y][x] = temp;
                              expand.current += atomic_cost;
                              expand.cost = expand.current + ManhattanHeuristic(expand);
                              expand.crane = [y+1, x];
                              expand.moves_cost.push(atomic_cost);
                              let key = JSON.stringify(expand.state);
                              if(!visited.has(key)) {
                                nodes.add(expand);
                                visited.add(key);
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

function QUEUE_SIFT(nodes, node, OPERATORS, visited) {
  // Expand all containers (topmost of a row) to all possible columns
  for(let j=1; j<=12; ++j) {
      for(let i=8; i>=1; --i) {
          if(node.state[i][j].weight != 0) {
              for(let x=1; x<=12; ++x) {
                  for(let y=1; y<=8; ++y) {
                      if(node.state[y][x].label == "UNUSED" && x != j) {
                          let expand = Node.clone(node);
                          let atomic_cost = PathCost(expand, expand.crane, [i+1, j]) + PathCost(expand, [i, j], [y, x]);
                          expand.moves.push("Move {" + i + ',' + j + '}' + ' ' + expand.state[i][j].label + " to {" + y + ',' + x + '}');
                          expand.movePairs.push([[i, j],[y, x]]);
                          let temp = expand.state[i][j];
                          expand.state[i][j] = expand.state[y][x];
                          expand.state[y][x] = temp;
                          expand.current += atomic_cost;
                          expand.cost = expand.current + ManhattanHeuristic(expand);
                          expand.crane = [y+1, x];
                          expand.moves_cost.push(atomic_cost);
                          let key = JSON.stringify(expand.state);
                          if(!visited.has(key)) {
                            nodes.add(expand);
                            visited.add(key);
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

function SIFT_STATE(node) {
    let containers = [];
    let coordinates = [];
    for(let j=1; j<=12; ++j) {
        for(let i=1; i<=8; ++i) {
            if(node.state[i][j].weight != 0) {
                containers.push(node.state[i][j]);
            }
        }
    }
    containers.sort(function(a, b) {
        return b.weight - a.weight;
    });
    coordinates.length = containers.length;
    let idx = 0;
    for(let i=1; i<=8; ++i) {
        if(idx >= coordinates.length) {
            break;
        }
        for(let j=6; j >= 1; --j) {
            if(idx >= coordinates.length || node.state[i][j].label == "NAN") {
                break;
            }
            coordinates[idx] = [i, j];
            idx += 2;
        }
    }
    idx = 1;
    for(let i=1; i<=8; ++i) {
        if(idx >= coordinates.length) {
            break;
        }
        for(let j=7; j <= 12; ++j) {
            if(idx >= coordinates.length || node.state[i][j].label == "NAN") {
                break;
            }
            coordinates[idx] = [i, j];
            idx += 2;
        }
    }

    return [containers, coordinates];
}

function QUEUEING_FUNCTION(nodes, node, OPERATORS, visited) {
  if(node.search == 1) {
    QUEUE_UNLOAD(nodes, node, OPERATORS, visited);
    QUEUE_LOAD(nodes, node, OPERATORS, visited);
  }
  else if(node.search == 2) {
    QUEUE_BALANCE(nodes, node, OPERATORS, visited);
  }
  else if(node.search == 3) {
    QUEUE_SIFT(nodes, node, OPERATORS, visited);
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
  visited.add(JSON.stringify(nodes.peek().state));
  while(true) {
      queueMaxSize = Math.max(queueMaxSize, nodes.size);
      if(nodes.isEmpty() || nodesExpanded >= 15000) {
        let failure = new Node();
        failure.expanded = nodesExpanded;
        failure.queueSize = queueMaxSize;
        failure.fail = true;
        return failure;
      }
      
      let node = nodes.poll();
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

function GetPath(node, src, dest) {
    let path = [];
    let current = JSON.parse(JSON.stringify(src));
    let copy = JSON.parse(JSON.stringify(current));
    path.push(copy);
    const direction = (src[1] - dest[1]) > 0 ? -1 : 1;
    while(current[1] != dest[1] || current[0] != dest[0]) {
        if(current[1] == dest[1]) { // same column
            dest[0] > current[0] ? ++current[0] : --current[0];
            let copy = JSON.parse(JSON.stringify(current));
            path.push(copy);
        }
        else if(current[0] >= 9 || node.state[current[0]][current[1]+direction].label == "UNUSED") {
            current[1] += direction;
            let copy = JSON.parse(JSON.stringify(current));
            path.push(copy);
        } else {
            ++current[0];
            let copy = JSON.parse(JSON.stringify(current));
            path.push(copy);
        }
    }
    // swap node state at src and dest
    if(dest[0] >= 9) {
        node.state[src[0]][src[1]] = new Container();
    } else if(src[0] >= 9) {
        node.state[dest[0]][dest[1]] = new Container("Occupied", 88);
    } else {    
        let temp = node.state[src[0]][src[1]];
        node.state[src[0]][src[1]] = node.state[dest[0]][dest[1]];
        node.state[dest[0]][dest[1]] = temp;
    }
    return path;
}

const table = document.querySelector('table');
const highlightFile = document.querySelector('#highlight-file');
const highlightBtn = document.querySelector('#highlight-btn');
const commentBtn = document.querySelector('#comment-btn');    
const clearcommentboxBtn = document.querySelector('#clearcommentbox-btn');
const commentBox = document.querySelector('#commentBox');
const nextBtn = document.querySelector('#next-btn');   
const closepopupBtn = document.getElementById('closePopup'); 
const label = document.getElementById("solutionlabel");
const timelabel = document.getElementById("estimatedtime");
const stepsfinishedpopup = document.getElementById('stepsfinished-popup');

const logYear = 2023; // This should be input from the user (at initial page load)
const logPath = `${homeDir}\\Documents\\${"KeoghLongBeach"+logYear+".txt"}`;

function highlightGrid(node) {
    const selectedCells = table.querySelectorAll('.selected');
    selectedCells.forEach(cell => {
        cell.classList.remove('selected');
    });
    const animatedCells = table.querySelectorAll('.animated');
    animatedCells.forEach(cell => {
        cell.classList.remove('animated');
    });

    for(let i = 1; i <= 8; ++i) {
        for(let j = 1; j <= 12; ++j) {
        const row = i;
        const col = j;
        mass = node.state[i][j].weight;
        contName = node.state[i][j].label;
        const cellElem = table.rows[7 - (row - 2)].cells[col - 1];
        if (contName != 'UNUSED') {
            cellElem.textContent = contName.trim();
            cellElem.classList.add('selected');
            // console.log(`Highlighted cell: Row ${row}, Column ${col}`);
        }      
        else {
            cellElem.textContent = '';
        }  
        }
    }        
}

// Create the grid
for (let i = 0; i < 9; i++) {
    const row = document.createElement('tr');
    for (let j = 0; j < 12; j++) {
        const cell = document.createElement('td');
        // cell.textContent = `${8 - i},${j + 1}`;
        cell.textContent = ' ';
        if(i == 0 && j != 0) {
            break;
        }
        if(i == 0 && j == 0) {
            cell.classList.add('pinkCell');
        }
        row.appendChild(cell);
    }
    table.appendChild(row);    
}

highlightBtn.addEventListener('click', () => {    
    const inputManifest = highlightFile.files[0]['path'];
    const manifestName = inputManifest.split('\\').pop();
    WriteLog(logPath, "Manifest " + manifestName + " is opened.");
    fs.readFile(inputManifest, 'utf8', async function(err, data) {
        // let datetime = await GetDateTime();
        // console.log(datetime);
        if (err) throw err;
        let ship = ParseData(data);
        let problem = new Node();
        problem.state = ship;
        highlightGrid(problem);
        problem.ToLoad.push(new Container("Bat", 431));      
        problem.search = 2;
        let begin = new Date().getTime();
        let result = general_search(problem, QUEUEING_FUNCTION);
        if(result.fail) {
            console.log("\nShip is impossible to balance. Now performing SIFT... ");
            problem.search = 3;
            let siftItems = SIFT_STATE(problem);
            problem.siftContainers = siftItems[0];
            problem.siftCoordinates = siftItems[1];
            result = general_search(problem, QUEUEING_FUNCTION);
            end = new Date().getTime();
            console.log("\nTime Elapsed: " + (end - begin) + " milliseconds\n");
            result.solution();
            console.log("Total time to completion: " + result.cost + " minutes\n\n");
            console.log("Solution Depth: " + (result.moves.length-1) + "\nNodes Expanded: " + result.expanded + "\nMax Queue Size: " + result.queueSize);
        }
        else {
            let end = new Date().getTime();
            console.log("\nTime Elapsed: " + (end - begin) + " milliseconds\n");
            console.log("\nSUCCESS\n");
            result.solution();
            console.log("Total time to completion: " + result.cost + " minutes\n\n");
            console.log("Solution Depth: " + (result.moves.length-1) + "\nNodes Expanded: " + result.expanded + "\nMax Queue Size: " + result.queueSize);
        }
        console.log("=======================================================================\n");
        

        // const moves = JSON.parse(fileContents);
        const node = Node.clone(problem);
        let paths = [];
        for(let i = 0; i < result.movePairs.length; ++i) {
            let path = GetPath(problem, result.movePairs[i][0], result.movePairs[i][1]);
            paths.push(path);
        }   
        const moves = paths;
        let moveIndex = 0;
        let lastClickTime = 0;
        let completionTime = 0;
        let sumCompletionTime = 0;
        let stopped = false;
        for(let i = 0; i < moves.length; i++) {
            completionTime += result.moves_cost[i];
        }
        sumCompletionTime = completionTime;        
        const moveInterval = setInterval(() => {
          if (moveIndex >= moves.length) {
              clearInterval(moveInterval);
              return;
          }
          const move = moves[moveIndex];
          if(move[move.length-1][0] > 9) {
              move.splice(move.length-2);
          } else if(move[1][0] > 9) {
              move.splice(0, 2);
          }
          label.innerHTML = result.moves[moveIndex];
          timelabel.innerHTML = "Time to completion: " + completionTime +  " minutes";
          lastClickTime = 0;
          nextBtn.addEventListener('click', () => {
              if(stopped == true) {
                  return;
              }
              const now = Date.now();
              if(now - lastClickTime < 1000) { return; }
              lastClickTime = now;            
              timelabel.innerHTML = "Time to complete: " + (completionTime) +  " minutes";
              completionTime = completionTime - result.moves_cost[moveIndex];
              if(moveIndex != moves.length-1) {WriteLog(logPath, "Finished atomic operation: " + result.moves[moveIndex]);}
              src = moves[moveIndex][0];
              dest = moves[moveIndex][moves[moveIndex].length-1];
              if(dest[0] >= 9) {
                  node.state[src[0]][src[1]] = new Container();
              } else if(src[0] >= 9) {
                  const containerName = result.moves[moveIndex].split(" ")[1]; // get container name to load
                  node.state[dest[0]][dest[1]] = new Container(containerName, 88);
              } else {    
                  let temp = node.state[src[0]][src[1]];
                  node.state[src[0]][src[1]] = node.state[dest[0]][dest[1]];
                  node.state[dest[0]][dest[1]] = temp;
              }            
              if(moveIndex < moves.length){ ++moveIndex; }
              if(moveIndex == moves.length){
                  stepsfinishedpopup.showModal();
              }
              if(moveIndex != moves.length){
                  label.innerHTML = result.moves[moveIndex];
                  timelabel.innerHTML = " ";
              }
              highlightGrid(node);
          });  
          move.forEach((coord, index) => {
              setTimeout(() => {
              const [row, col] = coord;
              const cell = table.rows[7-(row - 2)].cells[col - 1];
              if(cell.classList == 'pinkCell') {
                  cell.classList.remove('pinkCell');    
              }
              cell.classList.add('animated');
              }, index * 500);
              setTimeout(() => {
              const [row, col] = coord;
              const cell = table.rows[7-(row - 2)].cells[col - 1];
              cell.classList.remove('animated');
              if(row == 9 && col == 1) {
                  cell.classList.add('pinkCell');    
              }
              }, index * 500 + 1000);
          });
        }, 2000);

        closepopupBtn.addEventListener('click', () => {
            stopped = true;
            WriteManifest(result.state, inputManifest.split('\\').pop());
            WriteLog(logPath, "Manifest " + manifestName + " is closed.")
            stepsfinishedpopup.close();
            // Reset all cells to their original state
            const selectedCells = table.querySelectorAll('.selected');
            selectedCells.forEach(cell => {
                cell.textContent = ' ';
                cell.classList.remove('selected');
            });
            const animatedCells = table.querySelectorAll('.animated');
            animatedCells.forEach(cell => {
                cell.classList.remove('animated');
            });
            moveIndex = 0;
            clearInterval(moveInterval);            
            label.innerHTML = " ";
            timelabel.innerHTML = " ";
        });
    });
});

commentBtn.addEventListener('click', () => {
    const commentText = "[Placeholder Name]: " + commentBox.value;
    WriteLog(logPath, commentText);
    commentBox.value = '';
});
