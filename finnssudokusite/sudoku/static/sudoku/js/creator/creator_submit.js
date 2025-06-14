// creator_submit.js

import { getCSRFToken } from "../csrf/csrf.js";

export class CreatorSubmit {
    constructor(parent) {
        this.parent = parent;
    }

    init() {
        const btn = this.parent.get("submit-sudoku-btn");
        if (!btn) return;

        btn.addEventListener("click", (e) => this.handleSubmit(e));
        document.querySelector("input[name='sudoku_name']")?.addEventListener("input", () => {
            this.checkIfCanSubmit();
        });
    }

    async handleSubmit(e) {
        e.preventDefault();

        const box = this.parent.get("upload-loading-box");
        const text = this.parent.get("upload-progress-text");
        const bar = this.parent.get("upload-progress-bar");

        if (!box || !text || !bar) return;

        bar.style.width = "0%";
        bar.style.backgroundColor = "gold";
        bar.textContent = "Uploading Sudoku...";
        box.style.display = "block";
        text.textContent = "Encoding Sudoku as JSON...";

        const solutions = this.parent.analysis.solutions;
        if (!solutions || solutions.list.length !== 1) {
            throw new Error("Expected exactly one solution before saving.");
        }

        const payload = {
            title: document.querySelector("input[name='sudoku_name']").value || "Untitled Sudoku",
            board: this.parent.board.saveBoard(),
            solution: solutions.list[0].toFlatString(),
            tags: this.parent.board.getTags()
        };

        let serverSuccess = null;
        let serverDone = false;
        let animationStartTime = performance.now();
        let animationFrameId = null;

        function animate(currentTime) {
            const elapsed = currentTime - animationStartTime;
            const fakeProgress = serverDone ? 1 : Math.min(0.95, 0.1 + 0.85 * (1 - Math.exp(-elapsed / 2000)));

            bar.style.width = `${fakeProgress * 100}%`;

            if (serverDone) {
                bar.style.backgroundColor = serverSuccess ? "green" : "red";
                bar.textContent = serverSuccess ? "Upload complete" : "Upload failed";
                text.textContent = serverSuccess ? "Your Sudoku was saved." : "Upload error.";
                cancelAnimationFrame(animationFrameId);
            } else {
                animationFrameId = requestAnimationFrame(animate);
            }
        }

        animationFrameId = requestAnimationFrame(animate);

        try {
            const response = await fetch("/save-sudoku/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCSRFToken(),
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            text.textContent = "Processing response...";
            const data = await response.json();
            serverSuccess = data.status === "success";

            if (!serverSuccess) {
                throw new Error(data.message || "Server returned failure status");
            }
        } catch (error) {
            serverSuccess = false;
            console.error("Save failed:", error);
            text.textContent = error.message || "Failed to save Sudoku";
        } finally {
            serverDone = true;
        }
    }

    checkIfCanSubmit() {
        const btn = this.parent.get("submit-sudoku-btn");
        const name = document.querySelector("input[name='sudoku_name']")?.value?.trim() || "";

        const nameValid = name.length > 0;
        const uniqueSolution = this.parent.analysis.solutions_temp_list.length === 1;

        btn.disabled = !(nameValid && uniqueSolution);

        const updateStatus = (id, isValid) => {
            const statusDiv = this.parent.get(id);
            if (!statusDiv) return;
            const icon = statusDiv.querySelector("i");
            if (!icon) return;

            icon.classList.remove("fa-check", "fa-times", "text-success", "text-danger");
            icon.classList.add(isValid ? "fa-check" : "fa-times");
            icon.classList.add(isValid ? "text-success" : "text-danger");
        };

        updateStatus("status-name", nameValid);
        updateStatus("status-solution", uniqueSolution);
        updateStatus("status-unique", true); // always true as uniqueness is implied by having one solution
    }
}
