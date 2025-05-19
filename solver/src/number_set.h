/**
 * @file NumberSet.h
 * @brief Runtime-sized bitset for representing allowed Sudoku numbers.
 *
 * This file is part of the SudokuSolver project, developed for the Sudoku Website.
 * It defines a compact bitmask-based representation for numbers in the range [1, N],
 * where N is a runtime parameter (typically 9).
 *
 * @date 2025-05-16
 * @author Finn Eggers
 */

#ifndef NUMBERSET_H
#define NUMBERSET_H

#include <bit>
#include <cassert>
#include <cstdint>
#include <iterator>
#include <ostream>


#include "defs.h"

namespace sudoku {

/**
 * @class NumberSet
 * @brief Represents a set of numbers from 1 to N using a 64-bit bitmask.
 *
 * N is provided at runtime, and all operations enforce the valid range [1, N].
 */
class NumberSet {
public:
    using bit_t = uint32_t;

    /// Constructors

    /**
     * @brief Construct an empty NumberSet for a given size N.
     * @param max_number The maximum number allowed (must be in [1, MAX_SIZE])
     */
    explicit NumberSet(int max_number) : max_number_(max_number), bits_(0) {
        assert(max_number_ >= 1 && max_number_ <= MAX_SIZE);
        mask_ = compute_mask(max_number_);
    }

    /**
     * @brief Construct a singleton NumberSet with a single number.
     * @param max_number Upper limit of the range.
     * @param num Number to add initially.
     */
    NumberSet(int max_number, Number num) : max_number_(max_number), bits_(0) {
        assert(max_number_ >= 1 && max_number_ <= MAX_SIZE);
        mask_ = compute_mask(max_number_);
        add(num);
    }

    /**
     * @brief Construct from bitmask (used for internal operations).
     * @param max_number Maximum number.
     * @param bits Bitmask representing values.
     */
    NumberSet(int max_number, bit_t bits) : max_number_(max_number), bits_(bits) {
        assert(max_number_ >= 1 && max_number_ <= MAX_SIZE);
        mask_ = compute_mask(max_number_);
        bits_ &= mask_;
    }

    /// Returns a full NumberSet (1 to max_number)
    static NumberSet full(int max_number) { return {max_number, compute_mask(max_number)}; }

    /// Returns an empty NumberSet
    static NumberSet empty(int max_number) { return {max_number, Number(0)}; }

    static NumberSet greaterThan(int max_number, Number num) {
        assert(num >= 0 && num <= max_number);
        return {max_number, compute_mask(max_number) & ~((bit_t{1} << (num + 1)) - 1)};
    }

    static NumberSet greaterEqThan(int max_number, Number num) { return greaterThan(max_number, num - 1); }

    static NumberSet lessThan(int max_number, Number num) {
        assert(num >= 0 && num <= max_number);
        return {max_number, (bit_t{1} << num) - 1};
    }

    static NumberSet lessEqThan(int max_number, Number num) { return lessThan(max_number, num + 1); }

    static NumberSet odd(int max_number) {
        assert(max_number >= 1 && max_number <= MAX_SIZE);
        return {max_number, (bit_t) compute_mask(max_number) & (bit_t) 0xAAAAAAAAAAAAAAAA};
    }

    static NumberSet even(int max_number) {
        assert(max_number >= 1 && max_number <= MAX_SIZE);
        return {max_number, (bit_t) compute_mask(max_number) & (bit_t) 0x5555555555555555};
    }

    // --- Modifiers ---

    void add(Number num) {
        assert_valid(num);
        bits_ |= (bit_t{1} << num);
    }

    void remove(Number num) {
        // assert_valid(num);
        bits_ &= ~(bit_t{1} << num);
    }

    void clear() noexcept { bits_ = 0; }
    void set_all() noexcept { bits_ = mask_; }

    // --- Queries ---

    bool test(Number num) const {
        assert_valid(num);
        return bits_ & (bit_t{1} << num);
    }

    int count() const noexcept { return std::popcount(bits_); }

    Number lowest() const noexcept { return bits_ ? static_cast<Number>(std::countr_zero(bits_)) : 0; }

    Number highest() const noexcept { return bits_ ? static_cast<Number>(31 - std::countl_zero(bits_)) : 0; }

    bit_t raw() const noexcept { return bits_; }

    int max_number() const noexcept { return max_number_; }

    // --- Iteration ---

    class Iterator {
    public:
        using value_type = Number;
        using difference_type = int;
        using iterator_category = std::input_iterator_tag;

        Iterator(bit_t bits, int max_number, Number start) :
            bits_(bits), max_(max_number), cur_(advance(bits, start, max_number)) {}

        Number operator*() const noexcept { return cur_; }

        Iterator &operator++() noexcept {
            cur_ = advance(bits_, cur_ + 1, max_);
            return *this;
        }

        bool operator!=(const Iterator &other) const noexcept { return cur_ != other.cur_; }

    private:
        bit_t bits_;
        int max_;
        Number cur_;

        static Number advance(bit_t bits, Number start, int max) {
            for (Number i = start; i <= max; ++i) {
                if (bits & (bit_t{1} << i))
                    return i;
            }
            return max + 1;
        }
    };

    Iterator begin() const noexcept { return Iterator(bits_, max_number_, 1); }
    Iterator end() const noexcept { return Iterator(bits_, max_number_, max_number_ + 1); }

    // --- Operators ---

    NumberSet operator|(const NumberSet &other) const {
        assert(max_number_ == other.max_number_);
        return NumberSet(max_number_, bits_ | other.bits_);
    }

    NumberSet operator|=(const NumberSet &other) {
        assert(max_number_ == other.max_number_);
        this->bits_ |= other.bits_;
        return *this;
    }

    NumberSet operator&(const NumberSet &other) const {
        assert(max_number_ == other.max_number_);
        return NumberSet(max_number_, bits_ & other.bits_);
    }

    NumberSet operator&=(const NumberSet &other) {
        assert(max_number_ == other.max_number_);
        this->bits_ &= other.bits_;
        return *this;
    }

    NumberSet operator^(const NumberSet &other) const {
        assert(max_number_ == other.max_number_);
        return NumberSet(max_number_, bits_ ^ other.bits_);
    }

    NumberSet operator^=(const NumberSet &other) {
        assert(max_number_ == other.max_number_);
        this->bits_ ^= other.bits_;
        return *this;
    }

    bool operator==(const NumberSet &other) const noexcept {
        return max_number_ == other.max_number_ && bits_ == other.bits_;
    }

    bool operator!=(const NumberSet &other) const noexcept { return !(*this == other); }

    friend NumberSet operator~(const NumberSet &a) noexcept { return NumberSet(a.max_number_, ~a.bits_ & a.mask_); }

    friend std::ostream &operator<<(std::ostream &os, const NumberSet &s) {
        for (auto v: s)
            os << static_cast<int>(v) << " ";
        return os;
    }

private:
    int max_number_;
    bit_t bits_ = 0;
    bit_t mask_ = 0;

    static constexpr bit_t compute_mask(int n) { return ((bit_t{1} << (n + 1)) - 1) & ~bit_t{1}; }

    void assert_valid(Number num) const { assert(num >= 0 && num <= max_number_); }
};

} // namespace sudoku

#endif // NUMBERSET_H
