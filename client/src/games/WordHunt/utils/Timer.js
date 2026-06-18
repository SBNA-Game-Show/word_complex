class Timer {
  constructor(game, minutes = 1) {
    this.game = game;

    this.minutes = minutes;

    this.isActive = false;
    this.tickHandler = null;
    this.startTime = null;
  }

  start(onTick = null, onComplete = null) {
    if (this.isActive) return;

    this.isActive = true;
    this.startTime = Date.now();

    const maxTimeMs = this.minutes * 60 * 1000;

    this.tickHandler = () => {
      const elapsed = Date.now() - this.startTime;
      const remainingMs = maxTimeMs - elapsed;

      if (remainingMs <= 0) {
        this.stop();

        if (onComplete) {
          onComplete();
        }

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

  stop() {
    if (!this.isActive) return;

    this.isActive = false;

    if (this.tickHandler) {
      this.game.zim.Ticker.remove(this.tickHandler);
      this.tickHandler = null;
    }
  }
}

export default Timer;
