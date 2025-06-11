#pragma once

#include "../cell.h"
#include "../number_set.h"
#include "../region/ORCIdx.h"
#include "_rule_handler.h"

namespace sudoku {

struct NumberedRoomsPair {
    Region<ORCIdx> region;
    int digit;
};

class RuleNumberedRooms : public RuleHandler {
public:
    explicit RuleNumberedRooms(Board *board) : RuleHandler(board) {}

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override;
    bool valid() override;
    void update_impact(ImpactMap &map) override;
    void from_json(JSON &json) override;

private:
    std::vector<NumberedRoomsPair> m_pairs;

    bool enforce_numbered_rooms(const NumberedRoomsPair &pair);

    Cell &get_first_cell(const ORCIdx &orc);
    Cell &get_target_cell(const ORCIdx &orc, int val);
};

} // namespace sudoku
