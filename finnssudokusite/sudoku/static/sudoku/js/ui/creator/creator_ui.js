import { createBoard } from "../board/board.js";
import { CreatorRuleManager } from "./rule_manager.js";
import { SelectionMode } from "../board/board_selectionEnums.js";
import { RegionType}     from "../region/RegionType.js";

class Creator {
    constructor() {
        const container = document.querySelector(".board-container");

        if (!container) {
            throw new Error("Creator: .board-container element not found in the DOM.");
        }

        // create the board and hook it up to the UI
        this.board = createBoard(container);
        this.board.initBoard();
        this.board.setSelection({
            target:    RegionType.CELLS,
            mode:      SelectionMode.MULTIPLE,
            onCellAdded: ({r, c}) => {
                // console.log("Cell selected:", r, c);
            },
            onCellsCleared: () => {
                //  console.log("Selection cleared");
            },
            preserveOnModifier: "Shift", // hold Shift to preserve selection
        });

        // create the rule manager and hook it up to the board and the ui
        this.rule_manager = new CreatorRuleManager(this.board);

        // console.log("Creator initialized with board:", this.board);
    }
}



new Creator();