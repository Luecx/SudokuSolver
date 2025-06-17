import { RegionType } from "../region/RegionType.js";
import { RuleTypeHandler } from "./rule_handler.js";
import { buildInsetPath } from "../util/inset_path.js";
import { SelectionMode } from "../board/board_selectionEnums.js";
import * as utils from "./rule_utils.js";

export class IrregularRegionsHandler extends RuleTypeHandler {
    constructor(board) {
        super("Irregular Regions", board);
        this.tag = "Irregular-Regions";
        this.can_create_rules = false;

        this.regionKeys = [
            'region1', 'region2', 'region3',
            'region4', 'region5', 'region6',
            'region7', 'region8', 'region9'
        ];

        this.collidingCells = [];
    }

    defaultRules() {
        return [];
    }

    getGeneralWarnings() {
        let warnings = [];

        if (this.collidingCells.length > 0) {
            warnings.push(gettext("Regions cannot overlap with each other"));
            return warnings;
        }

        for (const key of this.regionKeys) {
            const region = this.fields?.[key];

            if (!region) {
                warnings.push(gettext("Regions are empty"));
                break;
            }

            if (region.items.length !== 9) {
                warnings.push(gettext("Regions must have exactly 9 cells"));
                break;
            }
        }

        return warnings;
    }

    getGeneralRuleScheme() {

        this.regionKeys = [
            'region1', 'region2', 'region3',
            'region4', 'region5', 'region6',
            'region7', 'region8', 'region9'
        ];
        return this.regionKeys.map((key, i) => ({
            key,
            type: "region",
            regionType: RegionType.CELLS,
            selectionMode: SelectionMode.MULTIPLE,
            label: gettext(`Region ${i + 1}`)
        }));
    }

    getSpecificRuleScheme() {
        return [];
    }

    getDescriptionHTML() {
        return `
            ${gettext("Irregular regions must follow these rules:")}
            <ul>
                <li>${gettext("Can be any shape and anywhere.")}</li>
                <li>${gettext("Must have exactly 9 cells.")}</li>
                <li>${gettext("Cannot overlap with each other.")}</li>
            </ul>
        `;
    }

    getDescriptionPlayHTML() {
        return gettext(
            "In <b>Irregular Region Sudoku</b> standard Sudoku rules apply. " +
            "Additionally, the grid is divided into irregularly shaped regions " +
            "instead of standard 3x3 boxes. Each of these irregular regions must also " +
            "contain all digits from 1 to 9 exactly once."
        );
    }

    renderAll(ctx) {
        if (!this.enabled) return;
        this.render(ctx);
    }

    render(ctx) {
        ctx.save();

        const regionColors = [
            'rgba(255, 0, 0, 0.3)',
            'rgba(0, 255, 0, 0.3)',
            'rgba(0, 0, 255, 0.3)',
            'rgba(255, 255, 0, 0.3)',
            'rgba(255, 0, 255, 0.3)',
            'rgba(0, 255, 255, 0.3)',
            'rgba(255, 165, 0, 0.3)',
            'rgba(128, 0, 128, 0.3)',
            'rgba(0, 128, 0, 0.3)'
        ];

        for (let i = 0; i < this.regionKeys.length; i++) {
            const key = this.regionKeys[i];
            this.drawRegions(ctx, this.fields[key], regionColors[i]);
        }

        this.collidingCells = this.findCollidingCells();
        for (const cell of this.collidingCells) {
            utils.drawCollisionX(this.board, ctx, cell);
        }

        ctx.restore();
    }

    findCollidingCells() {
        const cellCounts = new Map();
        for (const key of this.regionKeys) {
            const region = this.fields?.[key];
            if (!region) continue;

            for (const item of region.items) {
                const cellKey = `${item.r},${item.c}`;
                if (!cellCounts.has(cellKey)) {
                    cellCounts.set(cellKey, { count: 1, cell: item, regions: [key] });
                } else {
                    const entry = cellCounts.get(cellKey);
                    entry.count += 1;
                    entry.regions.push(key);
                }
            }
        }

        const collidingCells = [];
        for (const [_, entry] of cellCounts.entries()) {
            if (entry.count > 1) 
                collidingCells.push(entry.cell);
        }

        return collidingCells;
    }

    drawRegions(ctx, region, color) {
        if (!region) return;

        const cells = region.items.map(({ r, c }) => ({ x: c, y: r }));
        const loops = buildInsetPath(cells, 0);

        ctx.fillStyle = color;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        ctx.beginPath();

        for (const loop of loops) {
            loop.forEach((pt, i) => {
                const topLeft = this.board.getCellTopLeftCTX(pt.x, pt.y);
                const x = topLeft.x;
                const y = topLeft.y;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.closePath();
        }

        ctx.fill();
    }
}
