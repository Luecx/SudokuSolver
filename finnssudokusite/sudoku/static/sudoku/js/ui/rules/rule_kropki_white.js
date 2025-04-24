import { booleanOption, regionSelector} from "../creator/rule_manager_options.js";
import { RuleTypeHandler } from "./rule.js";

export class RuleKropkiWhiteHandler extends RuleTypeHandler {
    constructor(board) {
        super("Kropki White", board);
        this.tag = "Kropki";
    }

    ui_generalRuleFields() {
        const options = [];

        const dotsGiven = booleanOption({
            label: "All dots given",
            defaultValue: false,
            id: "kropkiWhiteDotsIncomplete"
        });

        const cellSelection = regionSelector({
            label: "Select cells",
            board: this.board,
            target: 'cells',
            mode: 'multiple',
        });

        options.push(dotsGiven, cellSelection);

        return {
            elements: options.map(opt => opt.element),
            getValues: () => ({
                dotsNotAllGiven: dotsGiven.getValue()
            })
        };
    }
}
