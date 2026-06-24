import { Entity } from '../Entity.js';

export class Particle extends Entity {
    constructor(level, x, y, z, xa, ya, za, tex) {
        super(level);
        this.tex = tex;

        this.setSize(0.2, 0.2);
        this.heightOffset = this.bbHeight / 2.0;
        this.setPos(x, y, z);

        this.xd = xa + (Math.random() * 2.0 - 1.0) * 0.4;
        this.yd = ya + (Math.random() * 2.0 - 1.0) * 0.4;
        this.zd = za + (Math.random() * 2.0 - 1.0) * 0.4;

        const speed = (Math.random() + Math.random() + 1.0) * 0.15;
        const dd = Math.sqrt(this.xd * this.xd + this.yd * this.yd + this.zd * this.zd);

        this.xd = (this.xd / dd) * speed * 0.4;
        this.yd = (this.yd / dd) * speed * 0.4 + 0.1;
        this.zd = (this.zd / dd) * speed * 0.4;

        this.uo = Math.random() * 3.0;
        this.vo = Math.random() * 3.0;

        this.size = Math.random() * 0.5 + 0.5;

        this.lifetime = Math.floor(4.0 / (Math.random() * 0.9 + 0.1));
        this.age = 0;
    }

    tick() {
        this.xo = this.x;
        this.yo = this.y;
        this.zo = this.z;

        if (this.age++ >= this.lifetime) {
            this.removed = true;
            return;
        }

        this.yd -= 0.04;
        this.move(this.xd, this.yd, this.zd);

        this.xd *= 0.98;
        this.yd *= 0.98;
        this.zd *= 0.98;

        if (this.onGround) {
            this.xd *= 0.7;
            this.zd *= 0.7;
        }
    }

    render(t, a, xa, za, yxa, yya, yza) {
        const uvStep = 0.015609375;

        const u0 = ((this.tex % 16) + this.uo / 4.0) / 16.0;
        const u1 = u0 + uvStep;
        const v0 = (Math.floor(this.tex / 16) + this.vo / 4.0) / 16.0;
        const v1 = v0 + uvStep;

        const r = 0.1 * this.size;

        const px = this.xo + (this.x - this.xo) * a;
        const py = this.yo + (this.y - this.yo) * a;
        const pz = this.zo + (this.z - this.zo) * a;

        const brightness = this.level.getBrightness(Math.floor(px), Math.floor(py), Math.floor(pz));
        t.color(brightness, brightness, brightness);

        t.vertexUV(px - xa * r - yxa * r, py - yya * r, pz - za * r - yza * r, u0, v1);
        t.vertexUV(px - xa * r + yxa * r, py + yya * r, pz - za * r + yza * r, u0, v0);
        t.vertexUV(px + xa * r + yxa * r, py + yya * r, pz + za * r + yza * r, u1, v0);
        t.vertexUV(px + xa * r - yxa * r, py - yya * r, pz + za * r - yza * r, u1, v1);
    }
}