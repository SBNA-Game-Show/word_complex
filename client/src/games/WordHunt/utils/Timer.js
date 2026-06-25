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
//       // 🛠️ FIX #1: If the timer was stopped externally (e.g., inside checkWin),
//       // bail out immediately to prevent accidental late "Times Up" triggers!
//       if (!this.isActive) {
//         if (this.tickHandler) {
//           this.game.zim.Ticker.remove(this.tickHandler);
//           this.tickHandler = null;
//         }
//         return;
//       }

//       this.elapsedMs = Date.now() - this.startTime;
//       const remainingMs = maxTimeMs - this.elapsedMs;

//       if (remainingMs <= 0) {
//         this.elapsedMs = maxTimeMs;
//         this.isActive = false;

//         if (this.tickHandler) {
//           this.game.zim.Ticker.remove(this.tickHandler);
//           this.tickHandler = null;
//         }

//         // 🛠️ FIX #2: Double-check activity status again right before executing callback
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
//     this.isActive = false; // This is now safely checked at the top of the ticker block!

//     if (this.tickHandler) {
//       this.game.zim.Ticker.remove(this.tickHandler);
//       this.tickHandler = null;
//     }
//     this.onComplete = null;
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
