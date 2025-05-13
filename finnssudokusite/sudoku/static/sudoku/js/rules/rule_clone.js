import { RegionType } from "../region/RegionType.js";
import { RuleTypeHandler } from "./rule_handler.js";
import { buildInsetPath } from "../util/inset_path.js";
import { SelectionMode } from "../board/board_selectionEnums.js";
import * as CloneSolver from "./rule_clone_solver.js";

export class CloneHandler extends RuleTypeHandler {
    constructor(board) {
        super("Clone", board);
        this.tag = "Clone";
        this.can_create_rules = true;
        this.usedColors = new Set();

        CloneSolver.attachCloneSolverLogic(this);
    }

    defaultRules() {
        return [];
    }

    getRuleWarnings(rule) {
        let warnings = [];

        let region = rule.fields.region;
        if (!region) {
            warnings.push("Region is empty");
            return warnings;
        }

        const cloneGroups = CloneSolver.findCloneGroups(this.rules);
        const singleRegions = cloneGroups.filter(group => group.length === 1);
        
        if (singleRegions.length > 0) {
            warnings.push("There are regions that have no clones");
        }

        return warnings;
    }

    getGeneralRuleScheme() {
        return [];
    }

    getSpecificRuleScheme() {
        return [            
            {
                key: "region",
                type: "region",
                regionType: RegionType.CELLS,
                selectionMode: SelectionMode.MULTIPLE,
                label: "Region"
            },
            {
                key: "color",
                type: "string",
                defaultValue: "",
                label: "Region Color (if not set, random color will be used)",
            }
        ];
    }

    getDescriptionHTML() {
        return `
            The <b>clones</b> must follow these rules:
            <ul>
                <li>Can be any shape and anywhere.</li>
                <li>Can overlap with each other and the regular Sudoku grid.</li>
                <li>Clones must have the same numbers in the same positions.</li>
            </ul>
        `;
    }

    getDescriptionPlayHTML() {
        return `In a <b>Clone Sudoku</b> clones with the same shape must have <b>matching</b> numbers.`; 
    }

    render(rule, ctx) {
        const region = rule.fields.region;

        if (!rule || !region) return;

        const cells = region.items.map(({ r, c }) => ({ x: c, y: r }));
        const loops = buildInsetPath(cells, 0);

        if (!rule.fields.color) rule.fields.color = this.getRandomColor();

        ctx.save();

        ctx.fillStyle = rule.fields.color;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        ctx.beginPath();

        for (const loop of loops) {
            loop.forEach((pt, i) => {
                const topLeft = this.board.getCellTopLeft(pt.x, pt.y);
                const x = topLeft.x;
                const y = topLeft.y;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.closePath();
        }

        ctx.fill();
        ctx.restore();   
    }

    // helper function

    getRandomColor() {
        let color;
        do {
            const r = Math.floor(Math.random() * 256);
            const g = Math.floor(Math.random() * 256);
            const b = Math.floor(Math.random() * 256);
            color = `rgba(${r}, ${g}, ${b}, 0.3)`;
        } while (this.usedColors.has(color));

        this.usedColors.add(color);
        return color;
    }
}
