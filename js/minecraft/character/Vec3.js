export class Vec3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    interpolateTo(vec, p) {
        const xt = this.x + (vec.x - this.x) * p;
        const yt = this.y + (vec.y - this.y) * p;
        const zt = this.z + (vec.z - this.z) * p;
        return new Vec3(xt, yt, zt)
    }

    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}