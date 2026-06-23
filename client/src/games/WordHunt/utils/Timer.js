// class Timer {
//   constructor(game) {
//     this.game = game;
//     this.minutes = game.gameTime;

//     this.isActive = false;
//     this.tickHandler = null;
//     this.startTime = null;
//     this.elapsedMs = 0;
//   }

//   start(onTick = null, onComplete = null) {
//     if (this.isActive) return;

//     this.isActive = true;
//     this.startTime = Date.now();

//     const maxTimeMs = this.minutes * 60 * 1000;

//     this.tickHandler = () => {
//       this.elapsedMs = Date.now() - this.startTime;

//       const remainingMs = maxTimeMs - this.elapsedMs;

//       // Inside Timer.js -> start() method
//       if (remainingMs <= 0) {
//         // 1. Instantly clean up internal timer states
//         this.elapsedMs = maxTimeMs;
//         this.isActive = false;

//         // 2. Clear the loop references immediately to prevent a microsecond re-fire
//         if (this.tickHandler) {
//           this.game.zim.Ticker.remove(this.tickHandler);
//           this.tickHandler = null;
//         }

//         // 3. Trigger your Game Over layout logic safely at the end
//         if (onComplete) onComplete();

//         return;
//       }

//       const minutes = Math.floor(remainingMs / 60000);
//       const seconds = Math.floor((remainingMs % 60000) / 1000);

//       if (onTick) {
//         onTick({
//           minutes,
//           seconds,
//           remainingMs,
//         });
//       }
//     };

//     this.game.zim.Ticker.add(this.tickHandler);
//   }

//   getElapsedTime() {
//     if (!this.startTime) return 0;

//     return this.isActive ? Date.now() - this.startTime : this.elapsedMs;
//   }

//   stop() {
//     if (!this.isActive) return;

//     this.elapsedMs = Date.now() - this.startTime;
//     this.isActive = false;

//     if (this.tickHandler) {
//       this.game.zim.Ticker.remove(this.tickHandler);
//       this.tickHandler = null;
//     }
//   }
// }

// export default Timer;

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
      // 🛠️ FIX #1: If the timer was stopped externally (e.g., inside checkWin),
      // bail out immediately to prevent accidental late "Times Up" triggers!
      if (!this.isActive) {
        if (this.tickHandler) {
          this.game.zim.Ticker.remove(this.tickHandler);
          this.tickHandler = null;
        }
        return;
      }

      this.elapsedMs = Date.now() - this.startTime;
      const remainingMs = maxTimeMs - this.elapsedMs;

      if (remainingMs <= 0) {
        this.elapsedMs = maxTimeMs;
        this.isActive = false;

        if (this.tickHandler) {
          this.game.zim.Ticker.remove(this.tickHandler);
          this.tickHandler = null;
        }

        // 🛠️ FIX #2: Double-check activity status again right before executing callback
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
    this.isActive = false; // This is now safely checked at the top of the ticker block!

    if (this.tickHandler) {
      this.game.zim.Ticker.remove(this.tickHandler);
      this.tickHandler = null;
    }
    this.onComplete = null;
  }
}

export default Timer;
