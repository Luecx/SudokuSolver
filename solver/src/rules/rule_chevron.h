#pragma once

#include "../cell.h"
#include "../json/json.h"
#include "../region/EdgeIdx.h"
#include "_rule_handler.h"


namespace sudoku {

class RuleChevron : public RuleHandler {
public:
    explicit RuleChevron(Board *board) : RuleHandler(board) {}

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override;
    bool valid() override;
    void update_impact(ImpactMap &map) override;
    void from_json(JSON &json) override;

private:
    Region<EdgeIdx> m_up_edges;
    Region<EdgeIdx> m_down_edges;
    Region<EdgeIdx> m_right_edges;
    Region<EdgeIdx> m_left_edges;

    bool enforce() const;
    bool enforce_greater_less(Cell &cell, Cell &neighbor, std::string symbol) const;
    bool checkPair(Cell &cell, Cell &neighbor, std::string symbol) const;

    bool allowGreaterCandidates(Cell &cell, Number value) const;
    bool allowLessCandidates(Cell &cell, Number value) const;
};

} // namespace sudoku
