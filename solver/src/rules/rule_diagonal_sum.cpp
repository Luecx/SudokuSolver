#include "rule_diagonal_sum.h"
#include "../board/board.h"

namespace sudoku {

bool RuleDiagonalSum::number_changed(CellIdx pos) {
    bool changed = false;

    return changed;
}

bool RuleDiagonalSum::candidates_changed() {
    bool changed = false;


    return changed;
};

bool RuleDiagonalSum::valid() {
    const int board_size = board_->size();

    return true;
}

void RuleDiagonalSum::from_json(JSON &json) {
    diagsum_pairs_.clear();

    if (!json["rules"].is_array())
        return;

    for (const auto &rule: json["rules"].get<JSON::array>()) {
        if (!rule["fields"].is_object())
            continue;
        if (!rule["fields"].get<JSON::object>().count("region"))
            continue;
        if (!rule["fields"].get<JSON::object>().count("sum"))
            continue;

        Region<DiagonalIdx> region = Region<DiagonalIdx>::from_json(rule["fields"]["region"]);
        int sum = static_cast<int>(rule["fields"]["sum"].get<double>());

        if (sum != 0) {
            DiagSumPair pair;
            pair.region = region;
            pair.sum = sum;
            
            diagsum_pairs_.push_back(pair);
        }
    }
}

// private member function


} // namespace sudoku
