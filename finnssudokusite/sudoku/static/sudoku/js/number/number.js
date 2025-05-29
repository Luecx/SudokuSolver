/**
 * @file number.js
 * @description Typedefs and constants for numeric board-based puzzles like Sudoku.
 *
 * This module defines helper types and constants used throughout the Sudoku engine
 * to improve code clarity and type safety when working with numeric board data.
 */

/**
 * @typedef {number} Row
 * Represents a row index in the board (0–8).
 */

/**
 * @typedef {number} Col
 * Represents a column index in the board (0–8).
 */

/**
 * Constant indicating an empty or unset cell.
 * Used to distinguish uninitialized cells from actual digits (1–9).
 * This value should *not* be considered a valid candidate.
 *
 * @constant {number}
 */
export const NO_NUMBER = 0;
