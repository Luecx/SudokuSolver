// game_state.js

import { getCSRFToken } from "../csrf/csrf.js";

export class GameState {
    constructor() {
        this.completed_before = null;
        this.resumed = null;
    }

    getKey(sudokuId) {
        return `sudoku_${sudokuId}`;
    }

    async save_state(sudokuId, board, timer) {
        const key = this.getKey(sudokuId);
        const data = {
            sudoku_id: sudokuId,
            time: parseInt(timer.getDuration() || 0),
            board_state: board.contentLayer.getState(),
            timestamp: Date.now(),
            status: "ongoing",
            completed_before: this.completed_before === true
        };

        // Save to localStorage
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error("Saving ongoing state to cache failed:", e);
        }

        // Save to server
        try {
            await fetch("/save-ongoing/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCSRFToken()
                },
                body: JSON.stringify({
                    sudoku_id: data.sudoku_id,
                    time: data.time,
                    board_state: data.board_state
                })
            });
        } catch (e) {
            console.warn("Saving ongoing state to server failed:", e);
        }
    }

    async save_completed(sudokuId, board, timer, rating = null) {
        const key = this.getKey(sudokuId);
        const data = {
            sudoku_id: sudokuId,
            time: parseInt(timer.getDuration() || 0),
            board_state: board.contentLayer.getState()
        };
        if (rating != null) {
            data.rating = rating;
        }

        // Clear localStorage
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn("Failed to remove cache on completion:", e);
        }

        // Save to server
        try {
            await fetch("/complete/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCSRFToken()
                },
                body: JSON.stringify(data)
            });
        } catch (e) {
            console.error("Saving completed state to server failed:", e);
        }
    }

    async load(sudokuId, board, timer) {
        const key = this.getKey(sudokuId);

        let serverData = null;
        let cacheData = null;

        // Load from server
        try {
            const res = await fetch(`/load-state/${sudokuId}/`);
            const json = await res.json();
            if (json.status === "success" || json.status === "completed") {
                serverData = {
                    time: json.time ?? json.completion_time ?? 0,
                    status: json.status,
                    board_state: json.board_state,
                    completed_before: json.status === "completed"
                };
            }
        } catch { /* ignore */ }

        // Load from cache
        try {
            const local = localStorage.getItem(key);
            if (local) {
                const parsed = JSON.parse(local);
                cacheData = {
                    time: parsed.time,
                    status: parsed.status,
                    board_state: parsed.board_state,
                    completed_before: parsed.completed_before === true
                };
            }
        } catch { /* ignore */ }

        if (serverData.board_state) 
            console.log(serverData.board_state);

        // Pick entry with lower time
        let selected = null;
        if (serverData && cacheData) {
            selected = serverData.time <= cacheData.time ? serverData : cacheData;
        } else {
            selected = serverData || cacheData;
        }

        if (selected) {
            if (selected.board_state) {
                let boardState = selected.board_state;
                if (typeof boardState === 'string') {
                    try {
                        boardState = JSON.parse(boardState);
                    } catch (e) {
                        console.error("Failed to parse board_state:", e);
                        boardState = [];
                    }
                }
                board.contentLayer.loadState(boardState);
            }
            timer.setTimer(selected.time || 0);
            this.completed_before = selected.completed_before === true;
            this.resumed = selected.status === "ongoing";
        } else {
            this.completed_before = false;
            this.resumed = false;
        }
    }
}
