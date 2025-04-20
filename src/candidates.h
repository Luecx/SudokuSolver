#ifndef CANDIDATES_H
#define CANDIDATES_H

#include <cstdint>
#include <cassert>
#include <iostream>
#if __cplusplus >= 202002L
#include <bit> // For C++20 bit functions: std::popcount, std::countr_zero
#endif
#include "position.h"  // Assumes this header defines Candidate, etc.

namespace sudoku {

    class Candidates {
    public:
        using mask_type = uint32_t;

        static constexpr Candidate MIN = 1;
        static constexpr Candidate MAX = 9;
        // Bits 1–9 set (bit 0 is unused).
        static constexpr mask_type MASK_ALL  = 0x03FE;
        static constexpr mask_type MASK_NONE = 0x0000;

        // Constructors.
        constexpr Candidates() noexcept : bits_(MASK_NONE) {}
        // Filter the input bits so that only bits 1-9 can ever be set.
        constexpr explicit Candidates(mask_type bits) noexcept : bits_(bits & MASK_ALL) {}
        constexpr explicit Candidates(const Candidate& cand) : bits_(1u << cand) {}

        // Modify candidates.
        void allow(Candidate candidate);
        void disallow(Candidate candidate);
        bool test(Candidate candidate) const;

        void clear() noexcept;
        void set_all() noexcept;
        mask_type raw() const noexcept;

        int count() const noexcept;
        Candidate lowest() const noexcept;

        // Iterator for enabled candidates, iterating in ascending order.
        class Iterator {
        public:
            explicit Iterator(mask_type bits) noexcept;
            Candidate operator*() const noexcept;
            Iterator& operator++() noexcept;
            bool operator!=(const Iterator& other) const noexcept;
        private:
            void advance() noexcept;
            mask_type bits_;
            int current_;
        };

        friend std::ostream& operator<<(std::ostream& os, const Candidates& cands) {
            for (Candidate c : cands) {
                os << (int) c << " ";
            }
            return os;
        }

        Iterator begin() const noexcept;
        Iterator end() const noexcept;

    private:
        mask_type bits_;
    };

    // Bitwise operator overloads for Candidates.
    inline Candidates operator|(Candidates lhs, Candidates rhs) noexcept {
        return Candidates((lhs.raw() | rhs.raw()) & Candidates::MASK_ALL);
    }

    inline Candidates operator&(Candidates lhs, Candidates rhs) noexcept {
        return Candidates((lhs.raw() & rhs.raw()) & Candidates::MASK_ALL);
    }

    inline Candidates operator^(Candidates lhs, Candidates rhs) noexcept {
        return Candidates((lhs.raw() ^ rhs.raw()) & Candidates::MASK_ALL);
    }

    inline Candidates operator~(Candidates candidate) noexcept {
        // Only allow bits 1-9.
        return Candidates((~candidate.raw()) & Candidates::MASK_ALL);
    }

    // Compound assignment operators.
    inline Candidates& operator|=(Candidates& lhs, Candidates rhs) noexcept {
        lhs = lhs | rhs;
        return lhs;
    }

    inline Candidates& operator&=(Candidates& lhs, Candidates rhs) noexcept {
        lhs = lhs & rhs;
        return lhs;
    }

    inline Candidates& operator^=(Candidates& lhs, Candidates rhs) noexcept {
        lhs = lhs ^ rhs;
        return lhs;
    }

    inline bool operator==(Candidates lhs, Candidates rhs) noexcept {
        return lhs.raw() == rhs.raw();
    }

    inline bool operator!=(Candidates lhs, Candidates rhs) noexcept {
        return lhs.raw() != rhs.raw();
    }

    constexpr Candidates CAND_EVEN = Candidates(Candidates::mask_type{0b0101010100}); // 0b101010101
    constexpr Candidates CAND_ODD  = Candidates(Candidates::mask_type{0b1010101010}); // 0b010101010
    constexpr Candidates CAND_ALL  = Candidates(Candidates::MASK_ALL);
    constexpr Candidates CAND_NONE = Candidates(Candidates::MASK_NONE);
} // namespace sudoku

#endif // CANDIDATES_H
