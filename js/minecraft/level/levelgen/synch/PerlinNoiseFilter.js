export class PerlinNoiseFilter {
    constructor(levels) {
        this.levels = levels;
        this.fuzz = 16;
    }

    read(width, height, random) {
        if (!random) {
            random = new JavaRandom(Math.floor(Math.random() * 0x1000000000000));
        }

        const tmp = new Array(width * height).fill(0);
        const level = this.levels;

        let step = width >> level;
        for (let y = 0; y < height; y += step) {
            for (let x = 0; x < width; x += step) {
                tmp[x + y * width] = (random.nextInt(256) - 128) * this.fuzz;
            }
        }

        for (step = width >> level; step > 1; step = Math.floor(step / 2)) {
            let val = 256 * (step << level);
            let ss = Math.floor(step / 2);

            for (let i = 0; i < height; i += step) {
                for (let x = 0; x < width; x += step) {
                    let ul = tmp[(x + 0) % width + ((i + 0) % height) * width];
                    let ur = tmp[(x + step) % width + ((i + 0) % height) * width];
                    let dl = tmp[(x + 0) % width + ((i + step) % height) * width];
                    let dr = tmp[(x + step) % width + ((i + step) % height) * width];

                    let m = Math.trunc((ul + dl + ur + dr) / 4) + random.nextInt(val * 2) - val;

                    tmp[x + ss + (i + ss) * width] = m;
                }
            }

            for (let i = 0; i < height; i += step) {
                for (let x = 0; x < width; x += step) {
                    let c = tmp[x + i * width];
                    let r = tmp[(x + step) % width + i * width];
                    let d = tmp[x + ((i + step) % height) * width];

                    let mu = tmp[((x + ss) & (width - 1)) + ((i + ss - step) & (height - 1)) * width];
                    let ml = tmp[((x + ss - step) & (width - 1)) + ((i + ss) & (height - 1)) * width];
                    let m = tmp[(x + ss) % width + ((i + ss) % height) * width];

                    let u = Math.trunc((c + r + m + mu) / 4) + random.nextInt(val * 2) - val;
                    let l = Math.trunc((c + d + m + ml) / 4) + random.nextInt(val * 2) - val;

                    tmp[x + ss + i * width] = u;
                    tmp[x + (i + ss) * width] = l;
                }
            }
        }

        const result = new Array(width * height);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                result[x + y * width] = Math.trunc(tmp[(x % width) + (y % height) * width] / 512) + 128;
            }
        }
        return result;
    }
}