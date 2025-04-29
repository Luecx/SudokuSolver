import { RegionType } from "./RegionType.js";
import { CellIdx } from "./CellIdx.js";
import { EdgeIdx } from "./EdgeIdx.js";
import { CornerIdx } from "./CornerIdx.js";
import {RCIdx} from "./RCIdx.js";

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
}
