#ifndef NUMBERSET_H
#define NUMBERSET_H

#include <cstdint>
#include <cassert>
#include <ostream>
#include <bit>
#include <iterator>

#include "defs.h"

namespace sudoku {

template <int N>
class NumberSet {
    static_assert(N > 0 && N <= MAX_SIZE, "NumberSet<N>: N must be in range [1, 63]");

public:
    static constexpr Number MIN = 1;
    static constexpr Number MAX = N;

    // Precomputed mask with bits 1..N set
    static constexpr uint64_t MASK = ((uint64_t{1} << (N + 1)) - 1) & ~uint64_t{1};

    static constexpr NumberSet ALL{MASK};
    static constexpr NumberSet NONE{};

    // Constructors
    constexpr NumberSet() noexcept = default;
    explicit constexpr NumberSet(Number num) : bits_{0} {
        assert_valid(num);
        bits_ |= (uint64_t{1} << num);
    }
    explicit constexpr NumberSet(uint64_t bits) : bits_(bits & MASK) {}

    // Modifiers
    void add(Number num) {
        assert_valid(num);
        bits_ |= (uint64_t{1} << num);
    }

    void remove(Number num) {
        assert_valid(num);
        bits_ &= ~(uint64_t{1} << num);
    }

    void clear() noexcept { bits_ = 0; }
    void set_all() noexcept { bits_ = MASK; }

    // Queries
    bool test(Number num) const {
        assert_valid(num);
        return bits_ & (uint64_t{1} << num);
    }

    int count() const noexcept {
        return std::popcount(bits_);
    }

    Number lowest() const noexcept {
        return bits_ ? static_cast<Number>(std::countr_zero(bits_)) : 0;
    }

    Number highest() const noexcept {
        return bits_ ? static_cast<Number>(63 - std::countl_zero(bits_)) : 0;
    }

    uint64_t raw() const noexcept { return bits_; }

    // Iterator
    class Iterator {
    public:
        using value_type = Number;
        using difference_type = int;
        using iterator_category = std::input_iterator_tag;

        explicit Iterator(uint64_t bits) : bits_(bits), cur_(advance(bits, MIN)) {}

        explicit Iterator(uint64_t bits, Number start) : bits_(bits), cur_(advance(bits, start)) {}

        Number operator*() const noexcept { return cur_; }

        Iterator& operator++() noexcept {
            cur_ = advance(bits_, cur_ + 1);
            return *this;
        }

        bool operator!=(const Iterator& other) const noexcept {
            return cur_ != other.cur_;
        }

    private:
        uint64_t bits_;
        Number cur_;

        static Number advance(uint64_t bits, Number start) {
            for (Number i = start; i <= MAX; ++i) {
                if (bits & (uint64_t{1} << i)) return i;
            }
            return MAX + 1;
        }
    };

    Iterator begin() const noexcept { return Iterator(bits_); }
    Iterator end() const noexcept   { return Iterator(bits_, MAX + 1); }

    // Bitwise and comparison operators
    constexpr NumberSet operator|(const NumberSet& other) const noexcept {
        return NumberSet(bits_ | other.bits_);
    }

    constexpr NumberSet operator&(const NumberSet& other) const noexcept {
        return NumberSet(bits_ & other.bits_);
    }

    constexpr NumberSet operator^(const NumberSet& other) const noexcept {
        return NumberSet(bits_ ^ other.bits_);
    }

    constexpr bool operator==(const NumberSet& other) const noexcept {
        return bits_ == other.bits_;
    }

    constexpr bool operator!=(const NumberSet& other) const noexcept {
        return bits_ != other.bits_;
    }

    friend constexpr NumberSet operator~(NumberSet a) noexcept {
        return NumberSet(~a.bits_ & MASK);
    }

    friend std::ostream& operator<<(std::ostream& os, const NumberSet& s) {
        for (auto v : s) os << static_cast<int>(v) << " ";
        return os;
    }

private:
    uint64_t bits_ = 0;

    static constexpr void assert_valid(Number num) {
        assert(num >= MIN && num <= MAX);
    }
};

} // namespace sudoku

#endif // NUMBERSET_H
