// --- timer.js ---

export class Timer {
    constructor(timerElementId) {
        this.timerElement = document.getElementById(timerElementId);
        this.seconds = parseInt(localStorage.getItem('sudoku_timer_seconds') || '0', 10);
        this.timerInterval = null;
    }

    formatTime(sec) {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        return `0${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    start() {
        if (!this.timerElement || this.timerInterval) return;
        this.timerInterval = setInterval(() => {
            this.seconds++;
            this.timerElement.textContent = this.formatTime(this.seconds);
            localStorage.setItem('sudoku_timer_seconds', this.seconds.toString());
        }, 1000);
    }

    stop() {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
    }

    reset() {
        this.seconds = 0;
        localStorage.removeItem('sudoku_timer_seconds');
        if (this.timerElement) {
            this.timerElement.textContent = this.formatTime(this.seconds);
        }
    }

    init() {
        if (this.timerElement) {
            this.timerElement.textContent = this.formatTime(this.seconds);
            this.start();
        }

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) this.stop();
            else this.start();
        });
    }
}
