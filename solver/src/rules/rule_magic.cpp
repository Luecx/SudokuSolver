#include <set>

#include "../board/board.h"
#include "rule_magic.h"

namespace sudoku {

// All 8 valid 3×3 magic square layouts
// clang-format off
const std::array<std::array<int, 9>, 8> MAGIC_SQUARE_SOLUTIONS = 
{{
    {8, 1, 6, 3, 5, 7, 4, 9, 2},
    {6, 7, 2, 1, 5, 9, 8, 3, 4},
    {2, 9, 4, 7, 5, 3, 6, 1, 8},
    {4, 3, 8, 9, 5, 1, 2, 7, 6},
    {6, 1, 8, 7, 5, 3, 2, 9, 4},
    {4, 9, 2, 3, 5, 7, 8, 1, 6},
    {2, 7, 6, 9, 5, 1, 4, 3, 8},
    {8, 3, 4, 1, 5, 9, 6, 7, 2}
}};
// clang-format on

Region<CellIdx> generate_3x3_region(Board *board, Region<CellIdx> *available_region) {
    static std::random_device rd;
    static std::mt19937 gen(rd());

    Region<CellIdx> region;

    if (!available_region || available_region->size() < 9) {
        return region; // return empty region if not enough cells available
    }

    // try to find a valid 3x3 starting position
    std::vector<CellIdx> potential_starts;

    for (CellIdx cell: available_region->items()) {
        // check if we can fit a 3x3 square starting from this position
        bool valid = true;
        if (cell.r + 2 >= board->size() || cell.c + 2 >= board->size()) {
            valid = false;
        } else {
            // check if all 9 cells of the 3x3 square are available
            for (Row r = cell.r; r < cell.r + 3 && valid; r++)
                for (Col c = cell.c; c < cell.c + 3 && valid; c++)
                    if (!available_region->has({r, c}))
                        valid = false;
        }

        if (valid) {
            potential_starts.push_back(cell);
        }
    }

    if (potential_starts.empty()) {
        return region; // return empty region if no valid 3x3 position found
    }

    // select random starting position
    std::uniform_int_distribution<> dis(0, potential_starts.size() - 1);
    CellIdx start = potential_starts[dis(gen)];

    // add all 9 cells of the 3x3 square
    for (Row r = start.r; r < start.r + 3; r++)
        for (Col c = start.c; c < start.c + 3; c++)
            region.add(CellIdx(r, c));

    // remove the created region from available_region
    if (available_region)
        *available_region = *available_region - region;

    return region;
}

// RuleMagic member functions

bool RuleMagic::number_changed(CellIdx pos) {
    bool changed = false;
    for (const auto &region: m_regions)
        changed |= applyCandidates(region);
    return changed;
}

bool RuleMagic::candidates_changed() {
    bool changed = false;
    for (const auto &region: m_regions)
        changed |= applyCandidates(region);
    return changed;
}

bool RuleMagic::valid() {
    for (const auto &region: m_regions) {
        initPossibleLayouts(region);
        if (m_possible_layouts.empty())
            return false;
    }
    return true;
}

void RuleMagic::from_json(JSON &json) {
    m_regions.clear();

    if (board_->size() != 9) {
        throw std::runtime_error("RuleMagic only supports 9x9 boards");
    }

    if (!json["rules"].is_array())
        return;

    for (const auto &rule: json["rules"].get<JSON::array>()) {
        if (!rule["fields"].is_object())
            continue;
        if (!rule["fields"].get<JSON::object>().count("region"))
            continue;

        Region<CellIdx> region = Region<CellIdx>::from_json(rule["fields"]["region"]);
        if (!is3x3Square(region))
            continue;

        if (region.size() > 0) {
            // sort region
            std::sort(region.begin(), region.end(),
                      [](const CellIdx &a, const CellIdx &b) { return (a.r != b.r) ? (a.r < b.r) : (a.c < b.c); });

            m_regions.push_back(region);
        }
    }
}

JSON RuleMagic::to_json() const {
    JSON json = JSON(JSON::object{});
    json["type"] = "Magic-Square";
    json["fields"] = JSON(JSON::object{});

    JSON::array rules = JSON::array();

    for (const auto &region: m_regions) {
        JSON rule = JSON(JSON::object{});
        JSON fields = JSON(JSON::object{});

        fields["region"] = region.to_json();

        rule["fields"] = fields;
        rules.push_back(rule);
    }

    json["rules"] = rules;
    return json;
}

void RuleMagic::init_randomly() {
    m_regions.clear();
    if (board_->size() != 9) {
        throw std::runtime_error("RuleMagic only supports 9x9 boards");
    }

    assert(MAX_MAGIC_SQUARES > 9);

    static std::random_device rd;
    static std::mt19937 gen(rd());

    std::uniform_int_distribution<> dis(MIN_MAGIC_SQUARES, MAX_MAGIC_SQUARES);
    int magic_squares_count = dis(gen);

    Region<CellIdx> available_region = Region<CellIdx>::all(board_->size());

    int attempts = 0;
    while ((int) m_regions.size() < magic_squares_count) {
        Region<CellIdx> region = generate_3x3_region(board_, &available_region);
        if (region.size() == 9)
            m_regions.push_back(region);

        attempts++;
        if (attempts > 100)
            break; // prevent infinite loop if not enough space
    }
}

// private member functions

bool RuleMagic::is3x3Square(const Region<CellIdx> &region) {
    if (region.size() != 9)
        return false;

    std::set<int> rows;
    std::set<int> cols;

    for (const auto &idx: region.items()) {
        rows.insert(idx.r);
        cols.insert(idx.c);
    }

    return rows.size() == 3 && cols.size() == 3;
}

bool RuleMagic::isValidLayout(const Region<CellIdx> &region, const std::array<int, 9> &layout) {
    const std::vector<CellIdx> &items = region.items();

    for (size_t i = 0; i < items.size(); i++) {
        const Cell &cell = board_->get_cell(items[i]);
        if (cell.value != 0 && cell.value != layout[i])
            return false;
    }

    return true;
}

void RuleMagic::initPossibleLayouts(const Region<CellIdx> &region) {
    m_possible_layouts.clear();
    for (const auto &layout: MAGIC_SQUARE_SOLUTIONS)
        if (isValidLayout(region, layout))
            m_possible_layouts.push_back(layout);
}

bool RuleMagic::applyCandidates(const Region<CellIdx> &region) {
    initPossibleLayouts(region);
    if (m_possible_layouts.empty())
        return false;

    bool changed = false;

    const std::vector<CellIdx> &items = region.items();

    for (size_t i = 0; i < items.size(); i++) {
        Cell &cell = board_->get_cell(items[i]);
        if (cell.is_solved())
            continue;

        NumberSet allowed(cell.max_number);
        for (const auto &layout: m_possible_layouts)
            allowed.add(layout[i]);

        // remove candidates that are not in the layout
        for (int j = 1; j <= cell.max_number; j++)
            if (cell.candidates.test(j) && !allowed.test(j))
                changed |= cell.remove_candidate(j);
    }

    return changed;
}

} // namespace sudoku
