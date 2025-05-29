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

    getCompletionTimeString() {
        const totalSeconds = this.seconds;
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;

        if (h > 0) {
            return `${h} hour${h !== 1 ? 's' : ''}, ${m} minute${m !== 1 ? 's' : ''}, and ${s} second${s !== 1 ? 's' : ''}`;
        } else if (m > 0) {
            return `${m} minute${m !== 1 ? 's' : ''} and ${s} second${s !== 1 ? 's' : ''}`;
        } else {
            return `${s} second${s !== 1 ? 's' : ''}`;
        }
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
            this.start();
        }

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) this.stop();
            else this.start();
        });
    }
}
