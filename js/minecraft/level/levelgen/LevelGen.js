import { JavaRandom } from '../../JavaRandom.js';
import { Tile } from '../tile/Tile.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export class LevelGen {
    constructor(levelGenScreen) {
        this.random = new JavaRandom();
        this.coords = new Int32Array(1048576);

        this.levelGenScreen = levelGenScreen;

        this.width = 0;
        this.height = 0;
        this.depth = 0;
        this.blocks = null;
    }

    async generateLevel(level, userName, width, height, depth) {
        console.log(`Generating level`);

        this.levelGenScreen.setTitle("Generating level");
        this.levelGenScreen.render(0, 0, this.levelGenScreen.minecraft.guiCanvas.width, this.levelGenScreen.minecraft.guiCanvas.height);
        await sleep(200);

        this.width = width;
        this.height = height;
        this.depth = depth;

        this.blocks = new Uint8Array(width * height * depth);

        console.log(`Raising..`);
        this.levelGenScreen.setStatus("Raising..", 0);
        this.levelGenScreen.render(0, 0, this.levelGenScreen.minecraft.guiCanvas.width, this.levelGenScreen.minecraft.guiCanvas.height);
        const heightMap = this.buildHeightmap(width, height);
        await sleep(20);
        console.log(`Eroding..`);
        this.levelGenScreen.setStatus("Eroding..", 20);
        this.levelGenScreen.render(0, 0, this.levelGenScreen.minecraft.guiCanvas.width, this.levelGenScreen.minecraft.guiCanvas.height);
        this.buildBlocks(heightMap);
        await sleep(20);
        console.log(`Carving..`);
        this.levelGenScreen.setStatus("Carving..", 40);
        this.levelGenScreen.render(0, 0, this.levelGenScreen.minecraft.guiCanvas.width, this.levelGenScreen.minecraft.guiCanvas.height);
        this.carveTunnels();
        await sleep(20);
        console.log(`Watering..`);
        this.levelGenScreen.setStatus("Watering..", 60);
        this.levelGenScreen.render(0, 0, this.levelGenScreen.minecraft.guiCanvas.width, this.levelGenScreen.minecraft.guiCanvas.height);
        this.addWater();
        await sleep(20);
        console.log(`Melting..`);
        this.levelGenScreen.setStatus("Melting..", 80);
        this.levelGenScreen.render(0, 0, this.levelGenScreen.minecraft.guiCanvas.width, this.levelGenScreen.minecraft.guiCanvas.height);
        this.addLava();
        await sleep(20);
        this.levelGenScreen.setStatus("Completing..", 100);
        this.levelGenScreen.render(0, 0, this.levelGenScreen.minecraft.guiCanvas.width, this.levelGenScreen.minecraft.guiCanvas.height);
        this.levelGenScreen.minecraft.levelRenderer.compileSurroundingGround();
        this.levelGenScreen.minecraft.levelRenderer.compileSurroundingWater();
        await sleep(20);

        if (typeof level.setData === "function") {
            level.setData(width, depth, height, this.blocks);
        } else {
            level.blocks = this.blocks;
        }

        level.createTime = Date.now();
        level.creator = userName;
        level.name = "A Nice World";

        return true;
    }

    buildHeightmap(width, height) {
        return new Float64Array(width * height);
    }

    buildBlocks(heightMap) {
        const w = this.width;
        const h = this.height;
        const d = this.depth;

        for (let x = 0; x < w; x++) {
            for (let y = 0; y < d; y++) {
                for (let z = 0; z < h; z++) {
                    const dh = Math.trunc(d / 2);
                    const rh = Math.trunc(d / 3);

                    const i = (y * h + z) * w + x;
                    let id = 0;

                    if (y === dh && y >= Math.trunc(d / 2) - 1) {
                        id = Tile.grass.id;
                    } else if (y <= dh) {
                        id = Tile.dirt.id;
                    }
                    if (y <= rh) {
                        id = Tile.rock.id;
                    }
                    this.blocks[i] = id;
                }
            }
        }
    }

    carveTunnels() {
        const w = this.width;
        const h = this.height;
        const d = this.depth;
        const count = Math.trunc((w * h * d) / 256 / 64);

        for (let i = 0; i < count; i++) {
            let x = this.random.nextFloat() * w;
            let y = this.random.nextFloat() * d;
            let z = this.random.nextFloat() * h;

            const length = Math.trunc(this.random.nextFloat() + this.random.nextFloat() * 150.0);
            let dir1 = this.random.nextFloat() * Math.PI * 2.0;
            let dira1 = 0.0;
            let dir2 = this.random.nextFloat() * Math.PI * 2.0;
            let dira2 = 0.0;

            for (let l = 0; l < length; l++) {
                x += Math.sin(dir1) * Math.cos(dir2);
                z += Math.cos(dir1) * Math.cos(dir2);
                y += Math.sin(dir2);

                dir1 += dira1 * 0.2;
                dira1 *= 0.9;
                dira1 += this.random.nextFloat() - this.random.nextFloat();

                dir2 += dira2 * 0.5;
                dir2 *= 0.5;
                dira2 *= 0.9;
                dira2 += this.random.nextFloat() - this.random.nextFloat();

                const size = Math.sin((l * Math.PI) / length) * 2.5 + 1.0;

                const xStart = (x - size) | 0;
                const xEnd = (x + size) | 0;
                const yStart = (y - size) | 0;
                const yEnd = (y + size) | 0;
                const zStart = (z - size) | 0;
                const zEnd = (z + size) | 0;

                for (let xx = xStart; xx <= xEnd; xx++) {
                    for (let yy = yStart; yy <= yEnd; yy++) {
                        for (let zz = zStart; zz <= zEnd; zz++) {
                            const xd = xx - x;
                            const yd = yy - y;
                            const zd = zz - z;
                            const dd = xd * xd + yd * yd * 2.0 + zd * zd;

                            if (dd < size * size && xx >= 1 && yy >= 1 && zz >= 1 && xx < w - 1 && yy < d - 1 && zz < h - 1) {
                                const ii = (yy * h + zz) * w + xx;
                                if (this.blocks[ii] === Tile.rock.id) {
                                    this.blocks[ii] = 0;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    addWater() {
        const before = performance.now();
        let tiles = 0;
        const source = 0;
        const target = Tile.calmWater.id;
        const halfDepth = Math.trunc(this.depth / 2) - 1;

        for (let x = 0; x < this.width; x++) {
            tiles += this.floodFillLiquid(x, halfDepth, 0, source, target);
            tiles += this.floodFillLiquid(x, halfDepth, this.height - 1, source, target);
        }
        for (let z = 0; z < this.height; z++) {
            tiles += this.floodFillLiquid(0, halfDepth, z, source, target);
            tiles += this.floodFillLiquid(this.width - 1, halfDepth, z, source, target);
        }

        const count = Math.trunc((this.width * this.height) / 5000);
        for (let i = 0; i < count; i++) {
            let j = this.random.nextInt(this.width);
            let k = halfDepth;
            let z = this.random.nextInt(this.height);
            if (this.blocks[(k * this.height + z) * this.width + j] === 0) {
                tiles += this.floodFillLiquid(j, k, z, 0, target);
            }
        }
        const after = performance.now();
        console.log("Flood filled " + tiles + " tiles in " + (after - before) + " ms");
    }

    addLava() {
        let lavaCount = 0;
        const count = Math.trunc((this.width * this.height * this.depth) / 10000);
        for (let i = 0; i < count; i++) {
            const x = this.random.nextInt(this.width);
            const y = this.random.nextInt(Math.trunc(this.depth / 2));
            const z = this.random.nextInt(this.height);
            if (this.blocks[(y * this.height + z) * this.width + x] === 0) {
                lavaCount++;
                this.floodFillLiquid(x, y, z, 0, Tile.calmLava.id);
            }
        }
        console.log("LavaCount: " + lavaCount);
    }

    floodFillLiquid(x, y, z, source, tt) {
        let target = tt;
        let coordBuffer = [];
        let p = 0;
        let wBits = 1, hBits = 1;
        while ((1 << wBits) < this.width) wBits++;
        while ((1 << hBits) < this.height) hBits++;

        let hMask = this.height - 1;
        let wMask = this.width - 1;

        if (!this.coords || this.coords.length !== 1048576) {
            this.coords = new Int32Array(1048576);
        }

        this.coords[p++] = ((((y << hBits) + z) << wBits) + x) | 0;
        let tiles = 0;
        let upStep = this.width * this.height;

        while (p > 0) {
            let cl = this.coords[--p] | 0;
            if (p === 0 && coordBuffer.length > 0) {
                console.log("IT HAPPENED!");
                this.coords = coordBuffer.pop();
                p = this.coords.length;
            }

            let z0 = (cl >> wBits) & hMask;
            let y0 = (cl >>> (wBits + hBits)) | 0;
            let x0 = cl & wMask;
            let x1 = x0;

            while (x0 > 0 && this.blocks[cl - 1] === source) {
                x0--;
                cl--;
            }
            while (x1 < this.width && this.blocks[cl + x1 - x0] === source) {
                x1++;
            }

            let z1 = (cl >> wBits) & hMask;
            let y1 = (cl >>> (wBits + hBits)) | 0;
            if (z1 !== z0 || y1 !== y0) {
                console.log("hoooly fuck");
            }

            let lastNorth = false;
            let lastSouth = false;
            let lastBelow = false;
            tiles += (x1 - x0);

            for (let xx = x0; xx < x1; xx++) {
                this.blocks[cl] = target;
                if (z0 > 0) {
                    let north = (this.blocks[cl - this.width] === source);
                    if (north && !lastNorth) {
                        if (p === this.coords.length) {
                            coordBuffer.push(this.coords);
                            this.coords = new Int32Array(1048576);
                            p = 0;
                        }
                        this.coords[p++] = (cl - this.width) | 0;
                    }
                    lastNorth = north;
                }
                if (z0 < this.height - 1) {
                    let south = (this.blocks[cl + this.width] === source);
                    if (south && !lastSouth) {
                        if (p === this.coords.length) {
                            coordBuffer.push(this.coords);
                            this.coords = new Int32Array(1048576);
                            p = 0;
                        }
                        this.coords[p++] = (cl + this.width) | 0;
                    }
                    lastSouth = south;
                }
                if (y0 > 0) {
                    let belowId = this.blocks[cl - upStep];
                    if (target === Tile.lava.id || target === Tile.calmLava.id) {
                        if (belowId === Tile.water.id || belowId === Tile.calmWater.id) {
                            this.blocks[cl - upStep] = Tile.rock.id;
                        }
                    }
                    let below = (belowId === source);
                    if (below && !lastBelow) {
                        if (p === this.coords.length) {
                            coordBuffer.push(this.coords);
                            this.coords = new Int32Array(1048576);
                            p = 0;
                        }
                        this.coords[p++] = (cl - upStep) | 0;
                    }
                    lastBelow = below;
                }
                cl++;
            }
        }
        return tiles;
    }
}