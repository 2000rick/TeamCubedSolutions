#include <set>
#include <queue>
#include <vector>
#include <chrono>
#include <sstream>
#include <iostream>
#include <unordered_map>
#include <iomanip>
#include <fstream>
using namespace std;

class Container {
    public:
        int weight; // weight of the container
        string label; // label of the container
        Container(): weight(0), label("UNUSED") {}
        Container(string label, int weight): weight(weight), label(label) {}
        bool operator<(const Container &rhs) const {
            return weight < rhs.weight;
        }
};

class Node {
    public:
        vector<vector<Container>> state; //ship representation
        vector<vector<Container>> buffer; // 4x24 buffer
        vector<pair<int, int>> OPERATORS = {
             {11, 1}, {13, 1}, // truck, buffer, -move container within ship, -load container to ship...?
        };
        vector<string> moves; // solution moves
        vector<int> moves_cost; // solution moves cost
        int cost=0;     // f(n) = g(n) + h(n); determines the order in queue
        int current=0;  // this is g(n) in A*
        int search=0;   // search type: 1 = Load/Unload, 2 = Balance
        bool fail=0;    // denote failure node
        unsigned int expanded=0; // number of nodes expanded
        unsigned int queueSize=0; // the maximum size of the queue (nodes in frontier)
        vector<Container> ToLoad; // containers to load
        vector<pair<int, int>> ToUnload; // containers to unload
        pair<int, int> crane = {9, 1}; // default crane position

        Node() {
            state = vector<vector<Container>>(9, vector<Container>(13));
            buffer = vector<vector<Container>>(5, vector<Container>(25));
        }

        Node(vector<vector<Container>> init_state) {
            state = init_state;
        }

        bool GOAL_STATE() {
            if(search == 1) {
                return ToLoad.empty() && ToUnload.empty();
            }
            else if(search == 2) {
                int left = 0, right = 0;
                for(int i=1; i<=8; ++i) {
                    for(int j=1; j<=6; ++j) {
                        left += state[i][j].weight;
                    }
                }
                for(int i=1; i<=8; ++i) {
                    for(int j=7; j<=12; ++j) {
                        right += state[i][j].weight;
                    }
                }
                // cout << "BalanceScore: " << (min(left, right) / (float)max(left, right)) << endl;
                return (min(left, right) / (float)max(left, right)) > 0.9;
            }
            return false;
        }

        void print() {
            for(int i=1; i<=8; ++i) {
                for(int j=1; j<=12; ++j) {
                    cout << '[' << setfill('0') << setw(2) << i << ',' << setfill('0') << setw(2) << j << "], {" 
                    << setfill('0') << setw(5) << state[i][j].weight << "}, " << state[i][j].label << endl;
                }
            }
        }

        void solution() {
            if(fail) return;
            if(!moves.size()) {
                cout << "No moves generated! Problem already solved." << endl;
                return;
            }
            cout << "\nSolution: " << endl;
            stringstream sol;
            const int max_width = 50;
            for (int i = 0; i < (int)moves.size(); ++i) {
                // sol << "Move " << moves[i].first << " to " << moves[i].second << endl;
                sol << moves[i] << setw(max_width-moves[i].size()) << "(Est. " << moves_cost[i] << " minutes)" << endl;
            }
            cout << sol.str() << endl;
        }

        void ResetCrane() {
            cost += abs(crane.first - 9) + abs(crane.second - 1);
            moves.push_back("Reset crane to default position");
            moves_cost.push_back(abs(crane.first - 9) + abs(crane.second - 1));
            crane = {9, 1};
        }
};

// Logically we can think of the truck 'cell' as [11,01]
int ManhattanHeuristic(const Node &node) {
    int heuristic = 0; //This is h(n)
    if(node.search == 1) {
        const int target_row = 11;    const int target_col = 1;
        for(int i=0; i < (int)node.ToUnload.size(); ++i) {
            int row = node.ToUnload[i].first;
            int col = node.ToUnload[i].second;
            heuristic += abs(row-target_row) + abs(col-target_col);
        }
        int loadCount = node.ToLoad.size();
        for(int j=1; j<=12; ++j) {
            for(int i=1; i<=8; ++i) {
                if(loadCount == 0) break;
                if(node.state[i][j].label == "UNUSED") {
                    heuristic += abs(i-target_row) + abs(j-target_col);
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

/* This custom comparator idea from GeeksforGeeks:
https://www.geeksforgeeks.org/stl-priority-queue-for-structure-or-class/ */
struct comp {
    inline bool operator()(Node const &a, Node const &b) {
        // edge case: if costs (f(n)) are equal, prioritize lower (g(n))
        return a.cost == b.cost ? a.current > b.current : a.cost > b.cost;
    }
};

typedef priority_queue<Node, vector<Node>, comp> p_queue;
p_queue MAKE_QUEUE(Node node) {
    p_queue nodes;
    node.cost += ManhattanHeuristic(node);
    nodes.push(node);
    return nodes;
}

Node REMOVE_FRONT(p_queue &nodes) {
    Node node = nodes.top();
    nodes.pop();
    return node;
}

int PathCost(const Node &node, const pair<int,int> src, const pair<int,int> dest) {
    int direction = (src.second - dest.second) > 0 ? -1 : 1;
    pair<int, int> current = src;
    int cost = 0;
    while(current.second != dest.second && current.first < 9) {
        if(node.state[current.first][current.second+direction].label == "UNUSED") {
            current.second += direction;
        } else {
            ++current.first;
        }
        ++cost;
    }
    cost += abs(current.first - dest.first) + abs(current.second - dest.second);
    return cost;
}

void QUEUE_UNLOAD(p_queue &nodes, const Node &node, const vector<pair<int, int>> &OPERATORS, set<vector<vector<Container>>> &visited) {
    const int truck_row = 11;    const int truck_col = 1;
    for(int k=node.ToUnload.size()-1; k>=0; --k) { // iterate backwards to avoid invalidating indices
        int row = node.ToUnload[k].first;
        int col = node.ToUnload[k].second;
        // Move container to unload to a truck
        if(node.state[row+1][col].label == "UNUSED") {
            Node expand = node;
            int atomic_cost = PathCost(expand, expand.crane, {row, col});
            expand.moves.push_back("Unload {" + to_string(row) + ',' + to_string(col) + '}' + ' ' + expand.state[row][col].label + ", to truck");            
            expand.state[row][col] = Container();
            expand.ToUnload.erase(expand.ToUnload.begin()+k);
            atomic_cost += (truck_row-row) + (col-truck_col);
            expand.current += atomic_cost;
            expand.cost = expand.current + ManhattanHeuristic(expand);
            expand.crane = {11, 1};
            expand.moves_cost.push_back(atomic_cost);
            nodes.push(expand);
            // if(visited.find(expand.state) == visited.end()) {
            //     nodes.push(expand);
            //     visited.insert(expand.state);
            // }
        }
        // Move container blocking another container to be unloaded to ALL available cells within the ship, if possible; otherwise, to the buffer.
        else { // [row+1][col] is occupied
            int rowTaken = row+1;
            for(int q=8; q>=rowTaken; --q) {
                if(node.state[q][col].label != "UNUSED") {
                    row = q;
                    break;
                }
            }
            for(int j=1; j<=12; ++j) {
                for(int i=1; i<=8; ++i) {
                    if(node.state[i][j].label == "UNUSED" && j != col) {
                        Node expand = node;
                        expand.moves.push_back("Move {" + to_string(row) + ',' + to_string(col) + '}' + ' ' + expand.state[row][col].label + " to {" + to_string(i) + ',' + to_string(j) + '}');
                        int atomic_cost = PathCost(expand, expand.crane, {row, col}) + PathCost(expand, {row, col}, {i, j});
                        swap(expand.state[row][col], expand.state[i][j]);
                        expand.current += atomic_cost;
                        expand.cost = expand.current + ManhattanHeuristic(expand);
                        expand.crane = {i, j};
                        expand.moves_cost.push_back(atomic_cost);
                        nodes.push(expand);
                        break;
                        // if(visited.find(expand.state) == visited.end()) {
                        //     nodes.push(expand);
                        //     visited.insert(expand.state);
                        // }
                    }
                }
            }
        }
    }
}

void QUEUE_LOAD(p_queue &nodes, const Node &node, const vector<pair<int, int>> &OPERATORS, set<vector<vector<Container>>> &visited) {
    if(node.ToLoad.empty()) return;
    const int truck_row = 11;    const int truck_col = 1;
    // Load one container from truck to ALL available cells on the ship(state).
    Container containerToLoad = node.ToLoad.back();
    for(int j=1; j<=12; ++j) {
        for(int i=1; i<=8; ++i) {
            if(node.state[i][j].label == "UNUSED") {
                Node expand = node;
                expand.moves.push_back("Load " + containerToLoad.label + " to {" + to_string(i) + ',' + to_string(j) + '}');                    
                expand.state[i][j] = containerToLoad;
                int distance = abs(i-11) + abs(j-1);
                int atomic_cost = abs(expand.crane.first-truck_row) + abs(expand.crane.second-truck_col);
                atomic_cost += distance;
                expand.current += atomic_cost;
                expand.ToLoad.pop_back();
                expand.cost = expand.current + ManhattanHeuristic(expand);
                expand.crane = {i, j};
                expand.moves_cost.push_back(atomic_cost);
                nodes.push(expand);
                break;
                // if(visited.find(expand.state) == visited.end()) {
                //     nodes.push(expand);
                //     visited.insert(expand.state);
                // }
            }
        }
    }
}

void QUEUE_BALANCE(p_queue &nodes, const Node &node, const vector<pair<int, int>> &OPERATORS, set<vector<vector<Container>>> &visited) {
    // Compute the weight of the left and right side of the ship
    int left = 0, right = 0;
    for(int i=1; i<=8; ++i) {
        for(int j=1; j<=6; ++j) {
            left += node.state[i][j].weight;
        }
    }
    for(int i=1; i<=8; ++i) {
        for(int j=7; j<=12; ++j) {
            right += node.state[i][j].weight;
        }
    }
    // For all columns in the heavier side of the ship, expand the states
    if(left > right) {
        for(int j=1; j<=6; ++j) {
            for(int i=8; i>=1; --i) {
                if(node.state[i][j].weight != 0) {
                    for(int x=1; x<=12; ++x) {
                        for(int y=1; y<=8; ++y) {
                            if(node.state[y][x].label == "UNUSED" && x != j) {
                                Node expand = node;
                                int atomic_cost = PathCost(expand, expand.crane, {i, j}) + PathCost(expand, {i, j}, {y, x}); //make sure this is before swap() to avoid bugs
                                expand.moves.push_back("Move {" + to_string(i) + ',' + to_string(j) + '}' + ' ' + expand.state[i][j].label + " to {" + to_string(y) + ',' + to_string(x) + '}');
                                swap(expand.state[i][j], expand.state[y][x]);
                                expand.current += atomic_cost;
                                expand.cost = expand.current + ManhattanHeuristic(expand);
                                expand.crane = {y, x};
                                expand.moves_cost.push_back(atomic_cost);
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
        for(int j=7; j<=12; ++j) {
            for(int i=8; i>=1; --i) {
                if(node.state[i][j].weight != 0) {
                    for(int x=1; x<=12; ++x) {
                        for(int y=1; y<=8; ++y) {
                            if(node.state[y][x].label == "UNUSED" && x != j) {
                                Node expand = node;
                                int atomic_cost = PathCost(expand, expand.crane, {i, j}) + PathCost(expand, {i, j}, {y, x}); //make sure this is before swap() to avoid bugs
                                expand.moves.push_back("Move {" + to_string(i) + ',' + to_string(j) + '}' + ' ' + expand.state[i][j].label + " to {" + to_string(y) + ',' + to_string(x) + '}');
                                swap(expand.state[i][j], expand.state[y][x]);
                                expand.current += atomic_cost;
                                expand.cost = expand.current + ManhattanHeuristic(expand);
                                expand.crane = {y, x};
                                expand.moves_cost.push_back(atomic_cost);
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

void QUEUEING_FUNCTION(p_queue &nodes, const Node &node, const vector<pair<int, int>> &OPERATORS, set<vector<vector<Container>>> &visited) {
    // Move container to unload to a truck
    // Move container blocking another container to unload to ALL available cells within the ship, if possible; otherwise, to the buffer.
    /* Move container to buffer, if necessary. (For example, ship is full and we need to unload a container below another container) */
    // Load container from truck to ALL available cells on the ship(state).

    if(node.search == 1) {
        QUEUE_UNLOAD(nodes, node, OPERATORS, visited);
        QUEUE_LOAD(nodes, node, OPERATORS, visited);
    }
    else if(node.search == 2) {
        QUEUE_BALANCE(nodes, node, OPERATORS, visited);
    }
    else {
        cout << "WARNING: UNKNOWN OPERATION.\nPlease select load/unload or balance." << endl;
    }
}

vector<vector<Container>> readFile() {
    vector<vector<Container>> ship(9, vector<Container>(13));
    string fileName= "";
    cout << "Type the name of the Manifest file: " << flush;
    cin >> fileName; cout << endl;
    ifstream file(fileName);
    if (!file.is_open()) { cout << "File not found" << endl; exit(1); }
    string line;
    for(int i=1; i<=8; ++i) {
        for(int j=1; j<=12; ++j) {
            getline(file, line);
            stringstream ss(line);
            Container container;
            string temp;
            getline(ss, temp, ','); // coordinates
            getline(ss, temp, ','); // coordinates
            getline(ss, temp, ','); // weight
            container.weight = stoi(temp.substr(2, 5));
            getline(ss, temp, ','); // label
            container.label = temp.substr(1, temp.size()-1);
            ship[i][j] = container;
        }
    }

    return ship;
}

Node general_search(Node &problem, void (*QUEUEING_FUNCTION)(p_queue&, const Node&, const vector<pair<int, int>> &, set<vector<vector<Container>>>&));

void Run() {
    // int search_type = 0;
    // cin >> search_type;
    vector<vector<Container>> data = readFile();
    Node problem(data);
    problem.ToUnload.push_back({1,4});
    problem.ToUnload.push_back({1,5});
    problem.ToLoad.push_back(Container{"Nat", 153});
    problem.ToLoad.push_back(Container{"Rat", 2321});
    problem.search = 1;
    chrono::steady_clock::time_point begin = chrono::steady_clock::now();
    Node result = general_search(problem, &QUEUEING_FUNCTION);
    chrono::steady_clock::time_point end = chrono::steady_clock::now();

    cout << "\nTime Elapsed: " << chrono::duration_cast<chrono::milliseconds> (end - begin).count() << " milliseconds\n";
    if(result.fail)
        cout << "\nFAILURE\n";
    else {
        cout << "\nSUCCESS\n";
        result.solution();
        cout << "Total time to completion: " << result.cost << " minutes\n\n";
        cout << "Solution Depth: " << result.moves.size()-1 << "\nNodes Expanded: " << result.expanded << "\nMax Queue Size: " << result.queueSize << '\n';
    }
    cout << "=======================================================================\n\n" << flush;
}

/*
    problem.ToUnload.push_back({1, 2}); //Case 1 unload only

    problem.ToLoad.push_back(Container{"Bat", 5432}); //Case 2 load only

    case 3: load & unload
    problem.ToUnload.push_back({1, 2});
    problem.ToLoad.push_back(Container{"Bat", 5432});
    problem.ToLoad.push_back(Container{"Rat", 5397});

    case 4: load & unload
    problem.ToUnload.push_back({7,5});
    problem.ToLoad.push_back(Container{"Nat", 6543});

    case 5: load & unload
    problem.ToUnload.push_back({1,4});
    problem.ToUnload.push_back({1,5});
    problem.ToLoad.push_back(Container{"Nat", 153});
    problem.ToLoad.push_back(Container{"Rat", 2321});
*/
