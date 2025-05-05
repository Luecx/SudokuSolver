import { CellIdx } from "../region/CellIdx.js";
import { CornerIdx } from "../region/CornerIdx.js";
import { EdgeIdx } from "../region/EdgeIdx.js";
import { RCIdx } from "../region/RCIdx.js";
import { Region } from "../region/Region.js";

// === Internal type mapping ===
const typeMap = {
    "CellIdx": CellIdx,
    "CornerIdx": CornerIdx,
    "EdgeIdx": EdgeIdx,
    "RCIdx": RCIdx,
    "Region": Region,
};

// === Serializer for JSON.stringify ===
function customReplacer(key, value) {
    if (value instanceof CellIdx) {
        return { __type__: "CellIdx", r: value.r, c: value.c };
    }
    if (value instanceof CornerIdx) {
        return { __type__: "CornerIdx", r: value.r, c: value.c };
    }
    if (value instanceof EdgeIdx) {
        return { __type__: "EdgeIdx", r1: value.r1, c1: value.c1, r2: value.r2, c2: value.c2 };
    }
    if (value instanceof RCIdx) {
        return { __type__: "RCIdx", row: value.row, col: value.col };
    }
    if (value instanceof Region) {
        return {
            __type__: "Region",
            type: value.type,
            items: value.items, // handled recursively
        };
    }
    return value;
}

// === Deserializer for JSON.parse ===
function customReviver(key, value) {
    if (value && typeof value === "object" && value.__type__) {
        switch (value.__type__) {
            case "CellIdx":
                return new CellIdx(value.r, value.c);
            case "CornerIdx":
                return new CornerIdx(value.r, value.c);
            case "EdgeIdx":
                return new EdgeIdx(value.r1, value.c1, value.r2, value.c2);
            case "RCIdx":
                return new RCIdx(value.row, value.col);
            case "Region":
                const region = new Region(value.type);
                region.items = value.items;
                return region;
        }
    }
    return value;
}

// === Public API ===

/**
 * Serialize any object containing custom types.
 * @param {Object} obj
 * @returns {string} JSON string
 */
export function serializeObject(obj) {
    return JSON.stringify(obj, customReplacer);
}

/**
 * Deserialize a JSON string into objects with restored custom types.
 * @param {string} jsonString
 * @returns {Object} Restored object
 */
export function deserializeObject(jsonString) {
    return JSON.parse(jsonString, customReviver);
}
