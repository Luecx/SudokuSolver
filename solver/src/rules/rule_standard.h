#pragma once

#include "../cell.h"
#include "../number_set.h"
#include "_rule_handler.h"

namespace sudoku {

class RuleStandard : public RuleHandler {
public:
    explicit RuleStandard(Board *board) : RuleHandler(board) {}

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override;
    bool valid() override;
    void update_impact(ImpactMap &map) override {};

    void from_json(JSON &json) override {};

    JSON to_json() const override {
        JSON json = JSON(JSON::object{});
        json["type"] = "Standard";
        json["fields"] = JSON(JSON::object{});
        json["rules"] = JSON::array{};
        return json;
    }

    void init_randomly() override {}
};

} // namespace sudoku
