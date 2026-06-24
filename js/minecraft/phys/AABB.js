export class AABB {
    constructor(x0, y0, z0, x1, y1, z1) {
        this.epsilon = 0.001;
        this.x0 = x0;
        this.y0 = y0;
        this.z0 = z0;
        this.x1 = x1;
        this.y1 = y1;
        this.z1 = z1;
    }

    expand(xa, ya, za) {
        let _x0 = this.x0;
        let _y0 = this.y0;
        let _z0 = this.z0;
        let _x1 = this.x1;
        let _y1 = this.y1;
        let _z1 = this.z1;

        if (xa < 0.0) _x0 += xa;
        if (xa > 0.0) _x1 += xa;
        if (ya < 0.0) _y0 += ya;
        if (ya > 0.0) _y1 += ya;
        if (za < 0.0) _z0 += za;
        if (za > 0.0) _z1 += za;

        return new AABB(_x0, _y0, _z0, _x1, _y1, _z1);
    }

    grow(xa, ya, za) {
        return new AABB(
            this.x0 - xa, this.y0 - ya, this.z0 - za,
            this.x1 + xa, this.y1 + ya, this.z1 + za
        );
    }

    cloneMove(xa, ya, za) {
        return new AABB(this.x0 + za, this.y0 + ya, this.z0 + za, this.x1 + xa, this.y1 + ya, this.z1 + za);
    }

    clipXCollide(c, xa) {
        if (c.y1 <= this.y0 || c.y0 >= this.y1) return xa;
        if (c.z1 <= this.z0 || c.z0 >= this.z1) return xa;

        if (xa > 0.0 && c.x1 <= this.x0) {
            let max = this.x0 - c.x1 - this.epsilon;
            if (max < xa) xa = max;
        }
        if (xa < 0.0 && c.x0 >= this.x1) {
            let max = this.x1 - c.x0 + this.epsilon;
            if (max > xa) xa = max;
        }
        return xa;
    }

    clipYCollide(c, ya) {
        if (c.x1 <= this.x0 || c.x0 >= this.x1) return ya;
        if (c.z1 <= this.z0 || c.z0 >= this.z1) return ya;

        if (ya > 0.0 && c.y1 <= this.y0) {
            let max = this.y0 - c.y1 - this.epsilon;
            if (max < ya) ya = max;
        }
        if (ya < 0.0 && c.y0 >= this.y1) {
            let max = this.y1 - c.y0 + this.epsilon;
            if (max > ya) ya = max;
        }
        return ya;
    }

    clipZCollide(c, za) {
        if (c.x1 <= this.x0 || c.x0 >= this.x1) return za;
        if (c.y1 <= this.y0 || c.y0 >= this.y1) return za;

        if (za > 0.0 && c.z1 <= this.z0) {
            let max = this.z0 - c.z1 - this.epsilon;
            if (max < za) za = max;
        }
        if (za < 0.0 && c.z0 >= this.z1) {
            let max = this.z1 - c.z0 + this.epsilon;
            if (max > za) za = max;
        }
        return za;
    }

    intersects(c) {
        if (c.x1 <= this.x0 || c.x0 >= this.x1) return false;
        if (c.y1 <= this.y0 || c.y0 >= this.y1) return false;
        return !(c.z1 <= this.z0) && !(c.z0 >= this.z1);
    }

    move(xa, ya, za) {
        this.x0 += xa;
        this.y0 += ya;
        this.z0 += za;
        this.x1 += xa;
        this.y1 += ya;
        this.z1 += za;
    }
}