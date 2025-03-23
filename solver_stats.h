#pragma once

#include <iostream>
#include <iomanip>

struct SolverStats {
    bool solutionFound;
    int nodesExplored;
    long long timeTakenMs;
};

inline std::ostream& operator<<(std::ostream& os, const SolverStats& stats) {
    os << "\n------------------------------\n";
    os << std::setw(20) << "Solution Found:" << (stats.solutionFound ? "Yes" : "No") << "\n";
    os << std::setw(20) << "Nodes Explored:" << stats.nodesExplored << "\n";
    os << std::setw(20) << "Time (ms):" << stats.timeTakenMs << "\n";
    os << "------------------------------\n";
    return os;
}