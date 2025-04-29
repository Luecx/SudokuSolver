import { createBoard } from "../board/board.js";
import { CreatorRuleManager } from "./creator_rule_manager.js";
import { SelectionMode } from "../board/board_selectionEnums.js";
import { RegionType}     from "../region/RegionType.js";
import { getCSRFToken} from "../csrf/csrf.js";

class Creator {
    constructor() {
        const container = document.querySelector(".board-container");

        if (!container) {
            throw new Error("Creator: .board-container element not found in the DOM.");
        }

        // create the board and hook it up to the UI
        this.board = createBoard(container);
        this.board.initBoard();
        this.board.setSelectionMode({
            target:    RegionType.CELLS,
            mode:      SelectionMode.MULTIPLE,
            preserveOnModifier: "Shift", // hold Shift to preserve selection
        });

        document.getElementById("submit-sudoku-btn").addEventListener("click", async () => {
            const json = this.board.saveBoard();

            console.log(json)

            const payload = {
                title: "My Sudoku",  // you can later ask the user for a real title
                board: json,
            };

            console.log(payload);

            try {
                const response = await fetch("/save-sudoku/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": getCSRFToken(),
                    },
                    body: JSON.stringify(payload),
                });

                const data = await response.json();

                if (data.status === "success") {
                    alert(`✅ Sudoku saved! ID: ${data.sudoku_id}`);
                } else {
                    alert(`❌ Error saving sudoku: ${data.message}`);
                }
            } catch (error) {
                console.error("Save error:", error);
                alert("❌ Unexpected error while saving.");
            }
        });

        // create the rule manager and hook it up to the board and the ui
        this.rule_manager = new CreatorRuleManager(this.board);

        // console.log("Creator initialized with board:", this.board);
    }
}



new Creator();