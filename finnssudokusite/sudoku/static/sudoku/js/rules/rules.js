import {KropkiHandler} from "./rule_kropki.js";
import {XVRuleHandler} from "./rule_xv.js";
import {StandardRuleHandler} from "./rule_standard.js";
import {DiagonalRuleHandler} from "./rule_diagonal.js";
import {SandwichHandler} from "./rule_sandwich.js";
import {ArrowHandler} from "./rule_arrow.js";
import {ParityHandler} from "./rule_parity.js";
import {PalindromeHandler} from "./rule_palindrome.js";
import {ThermometerHandler} from "./rule_thermo.js";
import {RenbanHandler} from "./rule_renban.js";
import { WhisperHandler} from "./rule_whisper.js";
import { CageHandler } from "./rule_cage.js";
import { ChevronHandler } from "./rule_chevron.js";
import { ChessRuleHandler } from "./rule_chess.js";
import { MagicSquareHandler } from "./rule_magic_square.js";

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
        new ThermometerHandler(board),
        new RenbanHandler(board),
        new WhisperHandler(board),
        new CageHandler(board),
        new ChevronHandler(board),
        new ChessRuleHandler(board),
        new MagicSquareHandler(board)
    ];
}
