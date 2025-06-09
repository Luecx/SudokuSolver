#pragma once

#include <memory>

#include "../cell.h"
#include "../number_set.h"
#include "_rule_handler.h"

namespace sudoku {

struct RenbanType {
private:
    int m_size;
    int idx = 0;
    int min_value = 0;
    int max_value = 0;
    int *data = nullptr;

public:
    RenbanType() : m_size(0), idx(0), data(nullptr) {}

    RenbanType(int _size) : m_size(_size) {
        data = new int[_size]();
        idx = 0;
        min_value = m_size + 1;
        max_value = 0;
    }

    RenbanType(const RenbanType &other) : m_size(other.m_size), idx(other.idx) {
        data = new int[m_size]();
        std::copy(other.data, other.data + idx, data);
        min_value = other.min_value;
        max_value = other.max_value;
    }

    RenbanType &operator=(const RenbanType &other) {
        if (this != &other) {
            delete[] data;
            m_size = other.m_size;
            idx = other.idx;
            min_value = other.min_value;
            max_value = other.max_value;
            data = new int[m_size]();
            std::copy(other.data, other.data + idx, data);
        }
        return *this;
    }

    ~RenbanType() {
        if (data)
            delete[] data;
    }

    void add(int value) {
        if (idx < m_size) {
            data[idx++] = value;
            min_value = std::min(min_value, value);
            max_value = std::max(max_value, value);
        }
    }

    int min() {
        if (idx == 0)
            throw std::runtime_error("Cannot get min of empty RenbanType");
        return min_value;
    }

    int max() {
        if (idx == 0)
            throw std::runtime_error("Cannot get max of empty RenbanType");
        return max_value;
    }

    void clear() {
        idx = 0;
        min_value = m_size + 1;
        max_value = 0;
    }

    void sort() { std::sort(data, data + idx); }
    int size() const { return idx; }
    bool empty() const { return idx == 0; }

    int operator[](int i) const {
        if (i < 0 || i >= idx)
            throw std::out_of_range("Index out of range in RenbanType");
        return data[i];
    }
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
    std::vector<Region<CellIdx>> m_paths;
    RenbanType m_solved_values;

    bool filter_range_based(const Region<CellIdx> &path, int min_val, int max_val);
    bool enforce_renban(const Region<CellIdx> &path);
};

} // namespace sudoku
