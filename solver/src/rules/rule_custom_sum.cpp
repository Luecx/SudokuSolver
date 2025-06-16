#include "rule_custom_sum.h"
#include "../board/board.h"

namespace sudoku {

void RuleCustomSum::init_randomly() {
    m_pairs.clear();

    static std::random_device rd;
    static std::mt19937 gen(rd());

    std::uniform_int_distribution<int> pair_count_dist(MIN_PAIRS, MAX_PAIRS);
    std::uniform_int_distribution<int> path_length_dist(MIN_PATH_LENGTH, MAX_PATH_LENGTH);

    const int board_size = board_->size();
    const int path_count = pair_count_dist(gen);

    Region<CellIdx> available_region = Region<CellIdx>::all(board_size);

    int attempts = 0;
    while ((int) m_pairs.size() < path_count && attempts++ < 100) {
        int path_length = path_length_dist(gen);
        Region<CellIdx> path = rule_utils::generate_random_path(board_, path_length, &available_region);
        if (path.size() < 2)
            continue; // skip paths that are too short

        std::uniform_int_distribution<int> sum_dist(path_length, board_size * path_length);
        int sum = sum_dist(gen);
        m_pairs.push_back({path, sum});
    }
}

} // namespace sudoku
