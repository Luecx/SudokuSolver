import { BooleanOption, RegionSelectorOption } from "../creator/rule_manager_options.js";
import { SelectionMode } from "../board_selectionEnums.js";
import { RegionType}     from "../region/RegionType.js";
import { createSelectionConfig } from "../board_selectionConfig.js";
import { RuleTypeHandler } from "./rule.js";

export class KropkiHandler extends RuleTypeHandler {
    constructor(board) {
        super("Kropki", board);
        this.tag = "kropki";

        this.instanceConfig = {
            allowAddRemove: false,
            fixedInstances: [
                { label: "White Kropki Dots", color: "white" },
                { label: "Black Kropki Dots", color: "black" }
            ]
        };
    }

    ui_generalRuleFields() {
        const checkbox = new BooleanOption({
            label: "All dots given",
            defaultValue: true,
            onDone: ({ value }) => {
                this.fields.allDotsGiven = value;
            }
        });

        this.fields.allDotsGiven = checkbox.getData().value;
        return [checkbox];
    }

    ui_specificRuleFields(rule) {
        const config = createSelectionConfig({
            target: RegionType.EDGES,
            mode: SelectionMode.MULTIPLE,
            onItemsChanged: (items) => {
                console.log("Items changed:", items);
                rule.location = items;
                this.board.triggerRender();
            }
        });

        const selector = new RegionSelectorOption({
            label: rule.label,
            board: this.board,
            config,
            onDone: ({ value }) => {
                console.log("Selector done:", value);
                rule.location = value;
                this.board.triggerRender();
            }
        });

        // Set initial location if missing
        if (!rule.location) rule.location = [];

        return [selector];
    }

    render(rule, ctx) {

        console.log(rule)

        if (!rule.location) return;

        const s = this.board.getCellSize();
        const radius = s * 0.12;

        for (const edge of rule.location) {
            const { r1, c1, r2, c2 } = edge;
            const a = this.board.getCellTopLeft(r1, c1);
            const b = this.board.getCellTopLeft(r2, c2);

            console.log(a,b)

            const cx = (a.x + b.x + s) / 2;
            const cy = (a.y + b.y + s) / 2;

            ctx.save();
            ctx.fillStyle = rule.color;
            ctx.strokeStyle = "black";
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
    }
}
