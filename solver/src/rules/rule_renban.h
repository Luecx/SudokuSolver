#pragma once

#include <memory>

#include "../cell.h"
#include "../number_set.h"
#include "_rule_handler.h"

namespace sudoku {

struct RenbanType {
private:
    int m_size;
    int m_idx = 0;
    int m_min = 0;
    int m_max = 0;
    int *m_data = nullptr;

public:
    RenbanType(int _size) : m_size(_size) {
        m_data = new int[_size]();
        clear();
    }

    ~RenbanType() {
        if (m_data)
            delete[] m_data;
    }

    void add(int value) {
        if (m_idx < m_size) {
            m_data[m_idx++] = value;
            m_min = std::min(m_min, value);
            m_max = std::max(m_max, value);
        }
    }

    int min() {
        if (m_idx == 0)
            throw std::runtime_error("Cannot get min of empty RenbanType");
        return m_min;
    }

    int max() {
        if (m_idx == 0)
            throw std::runtime_error("Cannot get max of empty RenbanType");
        return m_max;
    }

    void clear() {
        m_idx = 0;
        m_min = m_size + 1;
        m_max = 0;
    }

    void sort() { std::sort(m_data, m_data + m_idx); }

    int size() const { return m_idx; }

    int operator[](int i) const {
        if (i < 0 || i >= m_idx)
            throw std::out_of_range("Index out of range in RenbanType");
        return m_data[i];
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

    bool enforce_renban(const Region<CellIdx> &path);
};

} // namespace sudoku
