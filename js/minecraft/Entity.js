import { AABB } from "./phys/AABB.js"

export class Entity {
    constructor(level) {
        this.level = level;

        this.xo = 0;
        this.yo = 0;
        this.zo = 0;

        this.x = 0;
        this.y = 0;
        this.z = 0;

        this.heightOffset = 0;

        this.xd = 0;
        this.yd = 0;
        this.zd = 0;

        this.yRot = 0;
        this.xRot = 0;

        this.bb = null;
        this.onGround = false;
        this.horizontalCollision = false;

        this.removed = false;

        this.bbWidth = 0.6;
        this.bbHeight = 1.8;

        this.resetPos();
    }

    resetPos() {
        const x = Math.random() * (this.level.width - 2) + 1.0;
        const y = (this.level.depth + 10);
        const z = Math.random() * (this.level.height - 2) + 1.0;
        this.setPos(x, y, z);
    }

    setPos(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        const w = this.bbWidth / 2.0;
        const h = this.bbHeight / 2.0;
        this.bb = new AABB(x - w, y - h, z - w, x + w, y + h, z + w);
    }

    remove() {
        this.removed = true;
    }

    setSize(w, h) {
        this.bbWidth = w;
        this.bbHeight = h;
    }

    turn(xo, yo) {
        this.yRot = (this.yRot + xo * 0.15);
        this.xRot = (this.xRot - yo * 0.15);
        if (this.xRot < -90.0)
            this.xRot = -90.0;
        if (this.xRot > 90.0)
            this.xRot = 90.0;
    }

    isFree(xa, ya, za) {
        const box = this.bb.cloneMove(xa, ya, za);
        const aABBs = this.level.getCubes(box);
        if (aABBs.length > 0) return false;
        if (this.level.containsAnyLiquid(box)) return false;

        return true;
    }

    isInWater() {
        return this.level.containsLiquid(this.bb.grow(0.0, -0.4, 0.0), 1);
    }

    isInLava() {
        return this.level.containsLiquid(this.bb, 2);
    }

    tick() {
        this.xo = this.x;
        this.yo = this.y;
        this.zo = this.z;
    }

    move(xa, ya, za) {
        let xaOrg = xa;
        let yaOrg = ya;
        let zaOrg = za;

        const aABBs = this.level.getCubes(this.bb.expand(xa, ya, za));

        for (let i = 0; i < aABBs.length; i++) {
            ya = aABBs[i].clipYCollide(this.bb, ya);
        }
        this.bb.move(0, ya, 0);

        for (let i = 0; i < aABBs.length; i++) {
            xa = aABBs[i].clipXCollide(this.bb, xa);
        }
        this.bb.move(xa, 0, 0);

        for (let i = 0; i < aABBs.length; i++) {
            za = aABBs[i].clipZCollide(this.bb, za);
        }
        this.bb.move(0, 0, za);

        this.horizontalCollision = !(xaOrg == xa && zaOrg == za);
        this.onGround = (yaOrg !== ya && yaOrg < 0.0);

        if (xaOrg !== xa) this.xd = 0;
        if (yaOrg !== ya) this.yd = 0;
        if (zaOrg !== za) this.zd = 0;

        this.x = (this.bb.x0 + this.bb.x1) / 2;
        this.y = this.bb.y0 + this.heightOffset;
        this.z = (this.bb.z0 + this.bb.z1) / 2;
    }

    moveRelative(xa, za, speed) {
        let dist = xa * xa + za * za;
        if (dist < 0.01)
            return;
        dist = speed / Math.sqrt(dist);
        xa *= dist;
        za *= dist;

        let sin = Math.sin(this.yRot * Math.PI / 180);
        let cos = Math.cos(this.yRot * Math.PI / 180);
        this.xd += xa * cos + za * sin;
        this.zd += za * cos - xa * sin;
    }

    isLit(isHumanoid = false) {
        const xTile = Math.floor(this.x);
        const yTile = Math.floor(this.y);
        const zTile = Math.floor(this.z);
        if (isHumanoid) {
            return (this.level.isLit(xTile, yTile, zTile) || this.level.isLit(xTile, yTile + 1, zTile));
        } else {
            return (this.level.isLit(xTile, yTile, zTile));
        }
    }
}