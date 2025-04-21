#include "candidates.h"

namespace sudoku {

// --- Member Functions ---

void Candidates::allow(Candidate candidate) {
    assert(candidate >= MIN && candidate <= MAX);
    bits_ |= (1u << candidate);
}

void Candidates::disallow(Candidate candidate) {
    assert(candidate >= MIN && candidate <= MAX);
    bits_ &= ~(1u << candidate);
}

bool Candidates::test(Candidate candidate) const {
    assert(candidate >= MIN && candidate <= MAX);
    return bits_ & (1u << candidate);
}

void Candidates::clear() noexcept {
    bits_ = MASK_NONE;
}

void Candidates::set_all() noexcept {
    bits_ = MASK_ALL;
}

Candidates::mask_type Candidates::raw() const noexcept {
    return bits_;
}

int Candidates::count() const noexcept {
#if defined(__GNUC__) || defined(__clang__)
    return __builtin_popcount(bits_);
#elif __cplusplus >= 202002L
    return std::popcount(bits_);
#else
mask_type b = bits_;
int cnt = 0;
while (b) {
    b &= b - 1;
    ++cnt;
}
return cnt;
#endif
}

Candidate Candidates::lowest() const noexcept {
#if defined(__GNUC__) || defined(__clang__)
    return bits_ ? static_cast<Candidate>(__builtin_ctz(bits_)) : 0;
#elif __cplusplus >= 202002L
    return bits_ ? static_cast<Candidate>(std::countr_zero(bits_)) : 0;
#else
for (Candidate i = MIN; i <= MAX; ++i) {
    if (test(i)) return i;
}
return 0;
#endif
}

// --- Iterator Implementation ---

Candidates::Iterator::Iterator(mask_type bits) noexcept : bits_(bits) {
    advance();
}

Candidate Candidates::Iterator::operator*() const noexcept {
    return static_cast<Candidate>(current_);
}

Candidates::Iterator& Candidates::Iterator::operator++() noexcept {
    // Clear the lowest set bit.
    bits_ &= bits_ - 1;
    advance();
    return *this;
}

bool Candidates::Iterator::operator!=(const Iterator& other) const noexcept {
    return bits_ != other.bits_;
}

void Candidates::Iterator::advance() noexcept {
    if (bits_ == 0) {
        current_ = 0;
        return;
    }
#if defined(__GNUC__) || defined(__clang__)
    current_ = __builtin_ctz(bits_);
#elif __cplusplus >= 202002L
    current_ = std::countr_zero(bits_);
#else
for (Candidate i = Candidates::MIN; i <= Candidates::MAX; ++i) {
    if (bits_ & (1u << i)) {
        current_ = i;
        return;
    }
}
current_ = 0;
#endif
}

Candidates::Iterator Candidates::begin() const noexcept {
    return Iterator(bits_);
}

Candidates::Iterator Candidates::end() const noexcept {
    return Iterator(0);
}

} // namespace sudoku
