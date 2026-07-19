class Timer {
  constructor(game) {
    this.game = game;
    this.minutes = game.gameTime;

    this.isActive = false;
    this.tickHandler = null;
    this.startTime = null;
    this.elapsedMs = 0;
    this.onComplete = null; // Store reference here
  }

  start(onTick = null, onComplete = null) {
    if (this.isActive) return;

    this.isActive = true;
    this.startTime = Date.now();
    this.onComplete = onComplete; // Save it to the instance

    const maxTimeMs = this.minutes * 60 * 1000;

    this.tickHandler = () => {
      if (!this.isActive) {
        this.cleanUpTicker();
        return;
      }

      this.elapsedMs = Date.now() - this.startTime;
      const remainingMs = maxTimeMs - this.elapsedMs;

      if (remainingMs <= 0) {
        this.elapsedMs = maxTimeMs;
        this.isActive = false;
        this.cleanUpTicker();

        // Check if onComplete still exists before running
        if (this.onComplete) {
          this.onComplete();
          this.onComplete = null;
        }
        return;
      }

      const minutes = Math.floor(remainingMs / 60000);
      const seconds = Math.floor((remainingMs % 60000) / 1000);

      if (onTick) {
        onTick({ minutes, seconds, remainingMs });
      }
    };

    this.game.zim.Ticker.add(this.tickHandler);
  }

  getElapsedTime() {
    if (!this.startTime) return 0;
    return this.isActive ? Date.now() - this.startTime : this.elapsedMs;
  }

  // Helper method to ensure clean ticker removal
  cleanUpTicker() {
    if (this.tickHandler) {
      this.game.zim.Ticker.remove(this.tickHandler);
      this.tickHandler = null;
    }
  }

  stop() {
    if (!this.isActive) return;

    this.elapsedMs = Date.now() - this.startTime;
    this.isActive = false;
    this.onComplete = null; // Safely clears out the callback now!
    this.cleanUpTicker();
  }
}

export default Timer;
