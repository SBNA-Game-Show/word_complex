class Timer {
  constructor(game) {
    this.game = game;
    this.minutes = game.gameTime;

    this.isActive = false;
    this.tickHandler = null;
    this.startTime = null;
    this.elapsedMs = 0;
  }

  start(onTick = null, onComplete = null) {
    if (this.isActive) return;

    this.isActive = true;
    this.startTime = Date.now();

    const maxTimeMs = this.minutes * 60 * 1000;

    this.tickHandler = () => {
      this.elapsedMs = Date.now() - this.startTime;

      const remainingMs = maxTimeMs - this.elapsedMs;

      if (remainingMs <= 0) {
        this.stop();

        if (onComplete) onComplete();

        return;
      }

      const minutes = Math.floor(remainingMs / 60000);
      const seconds = Math.floor((remainingMs % 60000) / 1000);

      if (onTick) {
        onTick({
          minutes,
          seconds,
          remainingMs,
        });
      }
    };

    this.game.zim.Ticker.add(this.tickHandler);
  }

  getElapsedTime() {
    if (!this.startTime) return 0;

    return this.isActive ? Date.now() - this.startTime : this.elapsedMs;
  }

  stop() {
    if (!this.isActive) return;

    this.elapsedMs = Date.now() - this.startTime;
    this.isActive = false;

    if (this.tickHandler) {
      this.game.zim.Ticker.remove(this.tickHandler);
      this.tickHandler = null;
    }
  }
}

export default Timer;
