import { Chunk } from './level/Chunk.js';

export class Timer {
    constructor(ticksPerSecond, minecraft) {
        this.ticksPerSecond = ticksPerSecond;
        this.lastTime = performance.now();
        this.minecraft = minecraft;

        this.ticks = 0;
        this.a = 0.0;
        this.timeScale = 1.0;
        this.fps = 0.0;
        this.calmfps = 0.0;
        this.passedTime = 0.0;

        this.MS_PER_SECOND = 1000.0;
        this.MAX_MS_PER_UPDATE = 1000.0;
        this.MAX_TICKS_PER_UPDATE = 100;

        this.chunkUpdatesElapsedMs = 0.0;
        this.lastTotalChunkUpdates = 0;
        this.chunkUpdatesPerSecond = 0;
    }

    advanceTime() {
        const now = performance.now();
        let passedMs = now - this.lastTime;
        this.lastTime = now;

        const currentTotalChunkUpdates = Chunk.updates;

        if (passedMs < 0) passedMs = 0;
        if (passedMs > this.MAX_MS_PER_UPDATE) {
            passedMs = this.MAX_MS_PER_UPDATE;
        }

        this.fps = this.MS_PER_SECOND / passedMs;

        this.passedTime += (passedMs * this.timeScale * this.ticksPerSecond) / this.MS_PER_SECOND;
        this.ticks = Math.floor(this.passedTime);

        if (this.ticks > this.MAX_TICKS_PER_UPDATE) {
            this.ticks = this.MAX_TICKS_PER_UPDATE;
        }

        this.passedTime -= this.ticks;
        this.a = this.passedTime;

        this.chunkUpdatesElapsedMs += passedMs;

        if (this.chunkUpdatesElapsedMs >= this.MS_PER_SECOND) {
            this.chunkUpdatesPerSecond = currentTotalChunkUpdates - this.lastTotalChunkUpdates;

            this.lastTotalChunkUpdates = currentTotalChunkUpdates;
            this.calmfps = this.fps;

            this.chunkUpdatesElapsedMs -= this.MS_PER_SECOND;
        }
    }
}