import { RegionType } from "../region/RegionType.js";
import { RuleTypeHandler } from "./rule_handler.js";
import { buildInsetPath } from "../util/inset_path.js";
import { SelectionMode } from "../board/board_selectionEnums.js";

export class CloneHandler extends RuleTypeHandler {
    constructor(board) {
        super("Clone", board);
        this.tag = "Clone";
        this.can_create_rules = true;
        this.usedColors = new Set();
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

        const cloneGroups = this.findCloneGroups(this.rules);
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
                const topLeft = this.board.getCellTopLeftCTX(pt.x, pt.y);
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

    findCloneGroups(rules) {
        const cloneGroups = [];
        const processed = new Set();
             
        for (let i = 0; i < rules.length; i++) {
            if (processed.has(i)) continue;            
    
            const region = rules[i].fields.region;
            const clones = [i];
                
            for (let j = i + 1; j < rules.length; j++) {
                if (processed.has(j)) continue;
                    
                if (isRegionSameShape(region,  rules[j].fields.region)) {
                    clones.push(j);
                    processed.add(j);
                }
            }
    
            //if (clones.length < 2) {
            //    throw new Error("Clone groups must have at least 2 regions");
            //}
                
            processed.add(i);
            cloneGroups.push(clones);
        }
    
        // sort each clone regions so items are easier to compare later on
        for (const group of cloneGroups) {
            for (const regionIdx of group) {
                const region = rules[regionIdx].fields.region;
                if (!region) continue;
                
                region.items.sort((a, b) => {
                    if (a.r !== b.r) 
                        return a.r - b.r; // sort by row first
                    else 
                        return a.c - b.c; // for same row, sort by column
                });
            }
        }
            
        return cloneGroups;
    }
}
