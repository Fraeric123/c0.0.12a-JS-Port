import { Entity } from './Entity.js';
import { AABB } from './phys/AABB.js';

export class Player extends Entity {
    constructor(level) {
        super(level);

        this.level = level;

        this.x = 0; this.y = 0; this.z = 0;
        this.xo = 0; this.yo = 0; this.zo = 0;

        this.xd = 0; this.yd = 0; this.zd = 0;

        this.yRot = 0;
        this.xRot = 0;

        this.walk_speed = 1.3

        this.bb = null;
        this.onGround = false;

        this.heightOffset = 1.62;

        this.keys = {};
        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);

        this.resetPos();
    }

    resetPos() {
        let x = Math.random() * this.level.width;
        let y = this.level.depth + 10;
        let z = Math.random() * this.level.height;
        this.setPos(x, y, z);
    }

    setPos(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        let w = 0.3;
        let h = 0.9;
        this.bb = new AABB(x - w, y - h, z - w, x + w, y + h, z + w);
    }

    tick(camera) {
        this.xo = this.x;
        this.yo = this.y;
        this.zo = this.z;

        let xa = 0;
        let ya = 0;

        const inWater = super.isInWater();
        const inLava = super.isInLava();

        if (this.keys['KeyR']) this.resetPos();

        if (this.keys['ArrowUp'] || this.keys['KeyW']) ya -= 1;
        if (this.keys['ArrowDown'] || this.keys['KeyS']) ya += 1;
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) xa -= 1;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) xa += 1;

        if (this.keys['Space']) {
            if (inWater) {
                this.yd += 0.04;
            } else if (inLava) {
                this.yd += 0.04;
            } else if (this.onGround) {
                this.yd = 0.42;
                this.keys['Space'] = false;
            }
        }
        if (inWater) {
            const yo = this.y;
            this.moveRelative(xa, ya, 0.02);
            this.move(this.xd, this.yd, this.zd);
            this.xd *= 0.8;
            this.yd *= 0.8;
            this.zd *= 0.8;
            this.yd = (this.yd - 0.02);
            if (this.horizontalCollision && super.isFree(this.xd, this.yd + 0.6 - this.y + yo, this.zd))
                this.yd = 0.3;
        } else if (inLava) {
            const yo = this.y;
            this.moveRelative(xa, ya, 0.02);
            this.move(this.xd, this.yd, this.zd);
            this.xd *= 0.5;
            this.yd *= 0.5;
            this.zd *= 0.5;
            this.yd = (this.yd - 0.02);
            if (this.horizontalCollision && super.isFree(this.xd, this.yd + 0.6 - this.y + yo, this.zd))
                this.yd = 0.3;
        } else {
            this.moveRelative(xa, ya, this.onGround ? 0.1 : 0.02);
            this.move(this.xd, this.yd, this.zd);
            this.xd *= 0.91;
            this.yd *= 0.98;
            this.zd *= 0.91;
            this.yd = (this.yd - 0.08);
            if (this.onGround) {
                this.xd *= 0.6;
                this.zd *= 0.6;
            }
        }
    }
}