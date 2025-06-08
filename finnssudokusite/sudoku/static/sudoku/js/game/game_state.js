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
                credentials: "include",
                body: JSON.stringify({
                    sudoku_id: data.sudoku_id,
                    time: data.time,
                    board_state: data.board_state
                })
            });
        } catch { /* ignore */ }
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
                credentials: "include",
                body: JSON.stringify(data)
            });
        } catch { /* ignore */ }
        
        timer.stop();
    }

    async load(sudokuId, board, timer) {
        const key = this.getKey(sudokuId);
        let hasSolved = false;
        let serverOngoing = null;
        let cacheData = null;

        // --- Fetch has-solved status ---
        try {
            const res  = await fetch(`/has-solved/${sudokuId}/`);
            const json = await res.json();
            console.log("SOLVED BEFORE:", json);
            if (json.status === "success") {
                hasSolved = json.solved === true;
            }
        } catch {
            // If unauthenticated, we assume not solved
        }

        this.completed_before = hasSolved;

        // --- Try to load ongoing from server ---
        try {
            const res  = await fetch(`/ongoing-state/${sudokuId}/`);
            const json = await res.json();
            console.log("ONGOING STATE:", json);
            if (json.status === "success") {
                serverOngoing = {
                    time: json.time || 0,
                    board_state: json.board_state,
                    was_previously_completed: json.was_previously_completed === true,
                };
            }
        } catch { /* ignore */ }

        // --- Try to load from local cache ---
        try {
            const cached = localStorage.getItem(key);
            if (cached) {
                const parsed = JSON.parse(cached);
                cacheData = {
                    time: parsed.time,
                    board_state: parsed.board_state,
                    completed_before: parsed.completed_before === true
                };
            }
        } catch { /* ignore */ }

        // --- Decide which state to load ---
        let selected = null;
        if (serverOngoing && cacheData) {
            selected = serverOngoing.time >= cacheData.time ? serverOngoing : cacheData;
        } else {
            selected = serverOngoing || cacheData;
        }

        if (selected && selected.board_state) {
            try {
                let parsed = selected.board_state;
                if (typeof parsed === "string") parsed = JSON.parse(parsed);
                board.contentLayer.loadState(parsed);
            } catch (e) {
                console.warn("Failed to parse board_state:", e);
            }
            timer.setTimer(selected.time || 0);
            this.resumed = true;
        } else {
            this.resumed = false;
        }

        timer.start();
    }
}
