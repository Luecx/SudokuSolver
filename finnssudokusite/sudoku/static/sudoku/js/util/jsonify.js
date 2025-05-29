/**
 * @file jsonify.js
 * @description
 * Provides custom serialization and deserialization of region-related types
 * for safe use with JSON.stringify and JSON.parse.
 *
 * This ensures that types such as CellIdx, CornerIdx, EdgeIdx, RCIdx, DiagonalIdx,
 * and Region are preserved across storage, network transfer, or session persistence.
 *
 * Example:
 * ```js
 * const obj = { cell: new CellIdx(0, 0) };
 * const json = serializeObject(obj);
 * const restored = deserializeObject(json);
 * console.log(restored.cell instanceof CellIdx); // true
 * ```
 */

import { CellIdx } from "../region/CellIdx.js";
import { CornerIdx } from "../region/CornerIdx.js";
import { EdgeIdx } from "../region/EdgeIdx.js";
import { RCIdx } from "../region/RCIdx.js";
import { DiagonalIdx } from "../region/DiagonalIdx.js";
import { Region } from "../region/Region.js";

// === Internal type mapping (future extensibility) ===
const typeMap = {
    "CellIdx": CellIdx,
    "CornerIdx": CornerIdx,
    "EdgeIdx": EdgeIdx,
    "RCIdx": RCIdx,
    "DiagonalIdx": DiagonalIdx,
    "Region": Region,
};

// === JSON.stringify replacer ===

/**
 * Replacer function for JSON.stringify that encodes known custom types.
 *
 * @param {string} key - The object key (not used).
 * @param {any} value - The value to serialize.
 * @returns {any} A JSON-serializable representation.
 */
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
    if (value instanceof DiagonalIdx) {
        return { __type__: "DiagonalIdx", type: value.type, index: value.index };
    }
    if (value instanceof Region) {
        return {
            __type__: "Region",
            type: value.type,
            items: value.items, // assumes items are serializable or recursively handled
        };
    }
    return value;
}

// === JSON.parse reviver ===

/**
 * Reviver function for JSON.parse that reconstructs known custom types.
 *
 * @param {string} key - The object key (not used).
 * @param {any} value - The parsed value.
 * @returns {any} The deserialized object or original value.
 */
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
            case "DiagonalIdx":
                return new DiagonalIdx(value.type, value.index);
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
 * Serializes an object to JSON, preserving custom types.
 *
 * @param {Object} obj - Object to serialize.
 * @returns {string} JSON string with type metadata.
 */
export function serializeObject(obj) {
    return JSON.stringify(obj, customReplacer);
}

/**
 * Deserializes a JSON string and restores custom types.
 *
 * @param {string} jsonString - JSON string to parse.
 * @returns {Object} Restored object tree with class instances.
 */
export function deserializeObject(jsonString) {
    return JSON.parse(jsonString, customReviver);
}
