import { RegionType } from "./RegionType.js";
import { CellIdx } from "./CellIdx.js";
import { EdgeIdx } from "./EdgeIdx.js";
import { CornerIdx } from "./CornerIdx.js";
import { RCIdx } from "./RCIdx.js";

export const RegionClassMap = {
    [RegionType.CELLS]: CellIdx,
    [RegionType.EDGES]: EdgeIdx,
    [RegionType.CORNERS]: CornerIdx,
    [RegionType.ROWCOL]: RCIdx,
};

export class Region {
    constructor(type) {
        if (!(type in RegionClassMap)) {
            throw new Error(`Unsupported region type: ${type}`);
        }
        this.type = type;
        this.itemClass = RegionClassMap[type];
        this.items = [];
    }

    _findIndex(idx) {
        return this.items.findIndex(item => item.equals(idx));
    }

    add(idx) {
        if (!(idx instanceof this.itemClass)) {
            throw new Error(`Expected ${this.itemClass.name}, got ${idx?.constructor?.name}`);
        }
        if (!this.has(idx)) {
            this.items.push(idx.copy());
        }
    }

    remove(idx) {
        const i = this._findIndex(idx);
        if (i !== -1) {
            this.items.splice(i, 1);
        }
    }

    has(idx) {
        return this._findIndex(idx) !== -1;
    }

    clear() {
        this.items = [];
    }

    size() {
        return this.items.length;
    }

    forEach(fn) {
        this.items.forEach(fn);
    }

    values() {
        return [...this.items];
    }

    toStrings() {
        return this.items.map(i => i.toString());
    }

    copy() {
        const region = new Region(this.type);
        this.items.forEach(item => region.add(item.copy()));
        return region;
    }

    static fromList(type, list) {
        const region = new Region(type);
        list.forEach(item => region.add(item));
        return region;
    }

    static fromStrings(type, stringList) {
        const Class = RegionClassMap[type];
        const region = new Region(type);
        stringList.forEach(str => region.add(Class.fromString(str)));
        return region;
    }

    connectedRegions() {
        if (this.type !== RegionType.CELLS) {
            throw new Error("connectedRegions is only supported for RegionType.CELLS");
        }

        const remaining = new Set(this.items.map(i => i.toString()));
        const strToItem = new Map(this.items.map(i => [i.toString(), i]));

        const neighbors = [
            [0, 1], [1, 0], [0, -1], [-1, 0]
        ];

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

    largestKingJump() {
        if (this.type !== RegionType.CELLS) {
            throw new Error("largestKingJump is only supported for RegionType.CELLS");
        }

        if (this.items.length < 2) {
            return 0;
        }

        let maxDistance = 0;

        for (let i = 0; i < this.items.length - 1; ++i) {
            const a = this.items[i];
            const b = this.items[i + 1];
            const dr = Math.abs(b.r - a.r);
            const dc = Math.abs(b.c - a.c);
            const distance = Math.max(dr, dc); // king move distance
            if (distance > maxDistance) {
                maxDistance = distance;
            }
        }

        return maxDistance;
    }

    union(other) {
        if (this.type !== other.type) {
            throw new Error("Cannot union regions of different types");
        }
        const result = new Region(this.type);
        this.items.forEach(item => result.add(item));
        other.items.forEach(item => result.add(item));
        return result;
    }

    intersection(other) {
        if (this.type !== other.type) {
            throw new Error("Cannot intersect regions of different types");
        }
        const result = new Region(this.type);
        this.items.forEach(item => {
            if (other.has(item)) {
                result.add(item);
            }
        });
        return result;
    }

    difference(other) {
        if (this.type !== other.type) {
            throw new Error("Cannot difference regions of different types");
        }
        const result = new Region(this.type);
        this.items.forEach(item => {
            if (!other.has(item)) {
                result.add(item);
            }
        });
        return result;
    }
}
