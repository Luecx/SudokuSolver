#pragma once

#include "../cell.h"
#include "../number_set.h"
#include "_rule_handler.h"

namespace sudoku {

struct RenbanType {
private:
    int m_size;
    int idx = 0;
    int *data = nullptr;

public:
    RenbanType() : m_size(0), idx(0), data(nullptr) {}

    RenbanType(int _size) : m_size(_size) {
        data = new int[_size]();
        idx = 0;
    }

    RenbanType(const RenbanType &other) : m_size(other.m_size), idx(other.idx) {
        data = new int[m_size]();
        std::copy(other.data, other.data + idx, data);
    }

    RenbanType &operator=(const RenbanType &other) {
        if (this != &other) {
            delete[] data;
            m_size = other.m_size;
            idx = other.idx;
            data = new int[m_size]();
            std::copy(other.data, other.data + idx, data);
        }
        return *this;
    }

    ~RenbanType() {
        if (data)
            delete[] data;
    }

    void clear() { idx = 0; }

    void add(int value) {
        if (idx < m_size)
            data[idx++] = value;
    }

    void pop() {
        if (idx > 0)
            --idx;
    }

    void sort() { std::sort(data, data + idx); }

    int size() const { return idx; }

    int operator[](int i) const {
        if (i < 0 || i >= idx)
            throw std::out_of_range("Index out of range in RenbanType");
        return data[i];
    }

    bool empty() const { return idx == 0; }
};

class RuleRenban : public RuleHandler {
public:
    explicit RuleRenban(Board *board);

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override;
    bool valid() override;
    void update_impact(ImpactMap &map) override;
    void from_json(JSON &json) override;

private:
    std::vector<Region<CellIdx>> renban_paths_;

    RenbanType solved_values_;
    int num_ranges_ = 0;
    std::vector<RenbanType> ranges_;

    void init_all_consecutive_ranges(int length);
    void init_ranges_including_values(int length, int min_value, int max_value);

    bool enforce_renban(const Region<CellIdx> &path);
};

} // namespace sudoku
