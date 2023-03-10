#include "class_and_functions.hpp"

Node general_search(Node &problem, void (*QUEUEING_FUNCTION)(p_queue&, const Node&, const vector<pair<int, int>> &, set<vector<vector<Container>>> &visited)) {
    unsigned int nodesExpanded = 0; // number of nodes expanded
    unsigned int queueMaxSize = 0; // the maximum size of the queue
    priority_queue nodes = MAKE_QUEUE(problem);
    set<vector<vector<Container>>> visited;
    visited.insert(nodes.top().state);
    while(true) {
        queueMaxSize = max(queueMaxSize, (unsigned int)nodes.size());
        if(nodes.empty()) {
            Node failure;
            failure.expanded = nodesExpanded;
            failure.queueSize = queueMaxSize;
            failure.fail = true;
            return failure;
        }
        
        Node node = REMOVE_FRONT(nodes);
        // if(nodesExpanded % 10000 == 0) {
        //     cout << "Expanded " << nodesExpanded << " nodes. Queue size: " << nodes.size() << endl;}
        // cout << "The best state to expand with a g(n) = " << node.current << " and h(n) = " << node.cost - node.current << " is:\n";
        // node.print();
        ++nodesExpanded;
        node.expanded = nodesExpanded;
        node.queueSize = queueMaxSize;
        if(node.GOAL_STATE()) {
            cout << "Goal state!\n";
            node.ResetCrane();
            return node; 
        }
        QUEUEING_FUNCTION(nodes, node, node.OPERATORS, visited);
    }

    return problem; //never reached
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(0);
    
    Run();
    return 0;
}
