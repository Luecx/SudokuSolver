// --- timer.js ---

export class Timer {
    constructor(timerElementId) {
        this.timerElement = document.getElementById(timerElementId);
        this.seconds = 0;
        this.timerInterval = null;
    }

    formatTime(sec) {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    start() {
        if (!this.timerElement || this.timerInterval) return;
        this.timerInterval = setInterval(() => {
            this.seconds++;
            this.timerElement.textContent = this.formatTime(this.seconds);
        }, 1000);
    }

    stop() {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
    }

    reset() {
        this.seconds = 0;
        if (this.timerElement) {
            this.timerElement.textContent = this.formatTime(this.seconds);
        }
    }

    getDuration() {
        return this.seconds;
    }

    // set timer to specific duration (in seconds)
    setTimer(seconds) {
        this.seconds = parseInt(seconds, 10) || 0;
        if (this.timerElement) {
            this.timerElement.textContent = this.formatTime(this.seconds);
        }
    }

    init() {
        if (this.timerElement) {
            this.timerElement.textContent = this.formatTime(this.seconds);
        }

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) this.stop();
            else this.start();
        });
    }
}
