import * as THREE from '../../libs/three.module.js';
import { Tesselator } from '../render/Tesselator.js';
import { Tile } from '../level/tile/Tile.js';
import { Particle } from './Particle.js';

export class ParticleEngine {
    constructor(level, scene, texture) {
        this.level = level;
        this.particles = [];
        this.tesselator = new Tesselator();

        this.material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
            vertexColors: true,
            transparent: true,
            alphaTest: 0.1
        });

        this.mesh = new THREE.Mesh(new THREE.BufferGeometry(), this.material);
        scene.add(this.mesh);
    }

    add(x, y, z, xd, yd, zd, blockId) {
        let tex = 1;
        const tile = Tile.tiles[blockId];
        if (tile) tex = tile.tex;

        this.particles.push(new Particle(this.level, x, y, z, xd, yd, zd, tex));
    }

    tick() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.tick();

            if (p.removed) {
                this.particles.splice(i, 1);
            }
        }
    }

    render(player, a) {
        if (this.particles.length === 0) {
            if (this.mesh.geometry.attributes.position) {
                this.mesh.geometry.dispose();
                this.mesh.geometry = new THREE.BufferGeometry();
            }
            return;
        }

        const yRad = player.yRot * Math.PI / 180.0;
        const xRad = player.xRot * Math.PI / 180.0;

        const cosY = Math.cos(yRad);
        const sinY = Math.sin(yRad);
        const cosX = Math.cos(xRad);
        const sinX = Math.sin(xRad);

        const xa = cosY;
        const za = -sinY;

        const yxa = sinY * sinX;
        const yya = cosX;
        const yza = cosY * sinX;

        this.tesselator.init();

        for (const p of this.particles) {
            p.render(this.tesselator, a, xa, za, yxa, yya, yza);
        }

        const newGeo = this.tesselator.flush();
        if (newGeo) {
            this.mesh.geometry.dispose();
            this.mesh.geometry = newGeo;
        }
    }
}