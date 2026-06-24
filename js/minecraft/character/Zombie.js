import { Entity } from '../Entity.js';
import { ZombieModel } from './ZombieModel.js';

export class Zombie extends Entity {
    constructor(level, x, y, z, scene) {
        super(level);

        this.x = x;
        this.y = y;
        this.z = z;

        super.setPos(x, y, z)

        this.rotA = (Math.random() + 1) * 0.01;

        this.timeOffs = Math.random() * 1239813;
        this.rot = Math.random() * Math.PI * 2;
        this.speed = 1.0;

        this.currentBrightness = 0.1;

        this.model = new ZombieModel(scene);
        this.group = this.model.group;
    }

    tick() {
        this.xo = this.x;
        this.yo = this.y;
        this.zo = this.z;

        let xa = 0;
        let za = 0;

        this.rot += this.rotA;
        this.rotA *= 0.99;
        this.rotA += (Math.random() - Math.random()) * Math.random() * Math.random() * 0.01;

        xa = Math.sin(this.rot);
        za = Math.cos(this.rot);

        if (this.onGround && Math.random() < 0.01) {
            this.yd = 0.5;
        }

        this.moveRelative(
            xa,
            za,
            this.onGround ? 0.1 : 0.02
        );

        this.yd -= 0.08;

        this.move(this.xd, this.yd, this.zd);

        const groundFriction = (this.onGround ? 0.546 : 0.91) * this.speed;

        this.xd *= groundFriction;
        this.zd *= groundFriction;
        this.yd *= 0.98;

        if (this.y < -100.0) super.remove();
    }

    render(a) {
        const time = (performance.now() / 1000) * 10 * this.speed + this.timeOffs;

        let brightness = super.isLit(true) ? 1.0 : 0.3;

        if (brightness != this.currentBrightness) {
            this.currentBrightness = brightness;

            this.group.traverse((child) => {
                if (child.isMesh) {
                    child.material.color.setRGB(this.currentBrightness, this.currentBrightness, this.currentBrightness);
                }
            });
        }

        const x = this.xo + (this.x - this.xo) * a;
        const y = this.yo + (this.y - this.yo) * a;
        const z = this.zo + (this.z - this.zo) * a;

        this.group.position.set(x, y, z);

        const size = 0.058333334;
        const yy = -Math.abs(Math.sin(time * 0.6662)) * 5.0 - 23.0;

        this.group.scale.set(size, -size, size);

        this.group.position.y += yy * size + 3;

        this.group.rotation.y = this.rot + Math.PI;

        this.model.render(time);
    }
}