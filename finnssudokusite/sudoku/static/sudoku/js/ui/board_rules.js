// board_rules.js
import { setupStandardRule }    from "./rules/rule_standard.js";
import { setupWhiteKropkiRule } from "./rules/rule_kropki_white.js";
import { setupBlackKropkiRule } from "./rules/rule_kropki_black.js";
import { setupArrowRule }       from "./rules/rule_arrow.js";
import { setupXRule } from "./rules/rule_x.js";
import { setupVRule } from "./rules/rule_v.js";
import { setupDiagonalRule } from "./rules/rule_diagonal.js";
import { setupParityLine } from "./rules/rule_parityline.js";

/**
 * Returns an array of handler setup functions for a given board.
 * Each setup function returns a RuleTypeHandler instance tied to that board.
 *
 * @param {object} board - The board instance this set of rules should be tied to.
 * @returns {RuleTypeHandler[]}
 */
export function getDefaultRuleHandlers(board) {
    return [
        // setupStandardRule(board),
        // setupWhiteKropkiRule(board),
        // setupBlackKropkiRule(board),
        // setupArrowRule(board),
        // setupXRule(board),
        // setupVRule(board),
        // setupDiagonalRule(board),
        // setupParityLine(board),
    ];
}
