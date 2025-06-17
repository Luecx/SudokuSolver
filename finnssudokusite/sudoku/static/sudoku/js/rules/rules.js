import {KropkiHandler} from "./rule_kropki.js";
import {XVRuleHandler} from "./rule_xv.js";
import {StandardRuleHandler} from "./rule_standard.js";
import {DiagonalRuleHandler} from "./rule_diagonal.js";
import {SandwichHandler} from "./rule_sandwich.js";
import {ArrowHandler} from "./rule_arrow.js";
import {ParityHandler} from "./rule_parity.js";
import {PalindromeHandler} from "./rule_palindrome.js";
import {ThermoHandler} from "./rule_thermo.js";
import {RenbanHandler} from "./rule_renban.js";
import { WhisperHandler} from "./rule_whisper.js";
import { KillerHandler } from "./rule_killer.js";
import { ChevronHandler } from "./rule_chevron.js";
import { AntiChessRuleHandler } from "./rule_anti_chess.js";
import { MagicSquareHandler } from "./rule_magic_square.js";
import { IrregularRegionsHandler } from "./rule_irregular_regions.js";
import { ExtraRegionsHandler } from "./rule_extra_regions.js";
import { CloneHandler } from "./rule_clone.js";
import { CustomSumHandler } from "./rule_custom_sum.js";
import { DiagonalSumHandler } from "./rule_diag_sum.js";
import { NumberedRoomsHandler } from "./rule_numbered_rooms.js";
import { DutchFlatRuleHandler } from "./rule_dutch_flat.js";
import { WildApples } from "./rule_wild_apples.js";
import { QuadrupleRuleHandler } from "./rule_quadruples.js";

// Add any new rule handlers here
export function createAllRuleHandlers(board) {
    return [
        new KropkiHandler(board),
        new XVRuleHandler(board),
        new StandardRuleHandler(board),
        new DiagonalRuleHandler(board),
        new SandwichHandler(board),
        new ArrowHandler(board),
        new ParityHandler(board),
        new PalindromeHandler(board),
        new ThermoHandler(board),
        new RenbanHandler(board),
        new WhisperHandler(board),
        new KillerHandler(board),
        new ChevronHandler(board),
        new AntiChessRuleHandler(board),
        new MagicSquareHandler(board),
        new IrregularRegionsHandler(board),
        new ExtraRegionsHandler(board),
        new CloneHandler(board),
        new CustomSumHandler(board),
        new DiagonalSumHandler(board),
        new NumberedRoomsHandler(board),
        new DutchFlatRuleHandler(board),
        new WildApples(board),
        new QuadrupleRuleHandler(board)
    ];
}
