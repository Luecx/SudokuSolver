/**
 * Region.js
 *
 * Represents a region of items of a single type (cells, edges, corners, or row/col selectors).
 * Supports common region operations like union, intersection, difference,
 * conversion to attached cells, and connectivity analysis.
 */

import { RegionType } from "./RegionType.js";
import { CellIdx } from "./CellIdx.js";
import { EdgeIdx } from "./EdgeIdx.js";
import { CornerIdx } from "./CornerIdx.js";
import { RCIdx } from "./RCIdx.js";
import { DiagonalIdx } from "./DiagonalIdx.js";

/**
 * Maps each region type to its corresponding class.
 */
export const RegionClassMap = {
    [RegionType.CELLS]: CellIdx,
    [RegionType.EDGES]: EdgeIdx,
    [RegionType.CORNERS]: CornerIdx,
    [RegionType.ROWCOL]: RCIdx,
    [RegionType.DIAGONAL]: DiagonalIdx,
};

export class Region {
    /**
     * Constructs a region of a given type.
     * @param {RegionType} type - The type of region elements.
     * @param {Array} items - Optional initial items in the region.
     */
    constructor(type, items = []) {
        if (!(type in RegionClassMap)) {
            throw new Error(`Unsupported region type: ${type}`);
        }
        this.type = type;
        this.itemClass = RegionClassMap[type];
        this.items = items.map(item => {
            if (!(item instanceof this.itemClass)) {
                throw new Error(`Expected ${this.itemClass.name}, got ${item?.constructor?.name}`);
            }
            return item.copy();
        });
    }

    /**
     * Finds the index of an item by value.
     * @param {*} idx - The item to search for.
     * @returns {number} Index in the list, or -1.
     */
    findIndex(idx) {
        return this.items.findIndex(item => item.equals(idx));
    }

    /**
     * Adds an item to the region, if not already present.
     * @param {*} idx
     */
    add(idx) {
        if (!(idx instanceof this.itemClass)) {
            throw new Error(`Expected ${this.itemClass.name}, got ${idx?.constructor?.name}`);
        }
        if (!this.has(idx)) {
            this.items.push(idx.copy());
        }
    }

    /**
     * Removes an item from the region.
     * @param {*} idx
     */
    remove(idx) {
        const i = this.findIndex(idx);
        if (i !== -1) {
            this.items.splice(i, 1);
        }
    }

    /**
     * Checks whether the region contains a given item.
     * @param {*} idx
     * @returns {boolean}
     */
    has(idx) {
        return this.findIndex(idx) !== -1;
    }

    /** Clears all items from the region. */
    clear() {
        this.items = [];
    }

    /** @returns {number} Number of items in the region. */
    size() {
        return this.items.length;
    }

    /**
     * Applies a function to each item.
     * @param {function} fn
     */
    forEach(fn) {
        this.items.forEach(fn);
    }

    /**
     * @returns {Array} A shallow copy of the items array.
     */
    values() {
        return [...this.items];
    }

    /**
     * Converts all items to their string representations.
     * @returns {string[]}
     */
    toStrings() {
        return this.items.map(i => i.toString());
    }

    /**
     * Creates a deep copy of this region.
     * @returns {Region}
     */
    copy() {
        const region = new Region(this.type);
        this.items.forEach(item => region.add(item.copy()));
        return region;
    }

    /**
     * Constructs a Region from a list of items.
     * @param {RegionType} type
     * @param {Array} list
     * @returns {Region}
     */
    static fromList(type, list) {
        const region = new Region(type);
        list.forEach(item => region.add(item));
        return region;
    }

    /**
     * Constructs a Region from a list of string representations.
     * @param {RegionType} type
     * @param {string[]} stringList
     * @returns {Region}
     */
    static fromStrings(type, stringList) {
        const Class = RegionClassMap[type];
        const region = new Region(type);
        stringList.forEach(str => region.add(Class.fromString(str)));
        return region;
    }

    /**
     * Splits a cell region into connected subregions (4-connected).
     * @returns {Region[]} List of subregions.
     */
    connectedRegions() {
        if (this.type !== RegionType.CELLS) {
            throw new Error("connectedRegions is only supported for RegionType.CELLS");
        }

        const remaining = new Set(this.items.map(i => i.toString()));
        const strToItem = new Map(this.items.map(i => [i.toString(), i]));
        const neighbors = [[0, 1], [1, 0], [0, -1], [-1, 0]];
        const regions = [];

        while (remaining.size > 0) {
            const region = new Region(this.type);
            const stack = [];
            const firstStr = remaining.values().next().value;
            stack.push(strToItem.get(firstStr));
            remaining.delete(firstStr);

            while (stack.length > 0) {
                const current = stack.pop();
                region.add(current);

                for (const [dr, dc] of neighbors) {
                    const neighbor = new CellIdx(current.r + dr, current.c + dc);
                    const key = neighbor.toString();
                    if (remaining.has(key)) {
                        stack.push(neighbor);
                        remaining.delete(key);
                    }
                }
            }

            regions.push(region);
        }

        return regions;
    }

    /**
     * Returns a region of all CellIdx objects attached to this region.
     * Calls `attachedCells()` on each item.
     * @param {number} board_size - Required for RCIdx regions.
     * @returns {Region}
     */
    attachedCells(board_size = 9) {
        const region = new Region(RegionType.CELLS);
        this.items.forEach(item => {
            if (typeof item.attachedCells === 'function') {
                item.attachedCells(board_size).forEach(cell => region.add(cell));
            } else {
                console.warn("Item missing attachedCells():", item);
            }
        });
        return region;
    }

    /**
     * Computes the maximum "king move" (Chebyshev distance) between any two adjacent cells.
     * @returns {number}
     */
    largestKingJump() {
        if (this.type !== RegionType.CELLS) {
            throw new Error("largestKingJump is only supported for RegionType.CELLS");
        }

        if (this.items.length < 2) return 0;

        let maxDistance = 0;
        for (let i = 0; i < this.items.length - 1; ++i) {
            const a = this.items[i], b = this.items[i + 1];
            const distance = Math.max(Math.abs(a.r - b.r), Math.abs(a.c - b.c));
            if (distance > maxDistance) maxDistance = distance;
        }

        return maxDistance;
    }

    /**
     * Returns the union of this region with another.
     * @param {Region} other
     * @returns {Region}
     */
    union(other) {
        if (this.type !== other.type) throw new Error("Type mismatch");
        return Region.fromList(this.type, [...this.items, ...other.items]);
    }

    /**
     * Returns the intersection of this region with another.
     * @param {Region} other
     * @returns {Region}
     */
    intersection(other) {
        if (this.type !== other.type) throw new Error("Type mismatch");
        return Region.fromList(this.type, this.items.filter(i => other.has(i)));
    }

    /**
     * Returns the difference between this region and another.
     * @param {Region} other
     * @returns {Region}
     */
    difference(other) {
        if (this.type !== other.type) throw new Error("Type mismatch");
        return Region.fromList(this.type, this.items.filter(i => !other.has(i)));
    }
}
