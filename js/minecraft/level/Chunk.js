import * as THREE from '../../libs/three.module.js';
import { AABB } from '../phys/AABB.js';
import { Tesselator } from '../render/Tesselator.js';
import { Tile } from './tile/Tile.js';

export class Chunk {
    static rebuiltThisFrame = 0;
    static updates = 0;

    constructor(level, x0, y0, z0, x1, y1, z1) {
        this.level = level;
        this.x0 = x0;
        this.y0 = y0;
        this.z0 = z0;
        this.x1 = x1;
        this.y1 = y1;
        this.z1 = z1;

        this.x = (this.x0 + this.x1) / 2;
        this.y = (this.y0 + this.y1) / 2;
        this.z = (this.z0 + this.z1) / 2;

        this.aabb = new AABB(this.x0, this.y0, this.z0, this.x1, this.y1, this.z1);
        this.dirty = true;

        this.t = new Tesselator();

        this.texture = level.texture;
        this.material = level.material;

        this.meshes = [new THREE.Mesh(), new THREE.Mesh()];
        this.meshes.forEach(m => m.frustumCulled = true);
    }

    rebuild(layer) {
        //if (Chunk.rebuiltThisFrame >= 2) return;

        this.dirty = false;
        Chunk.updates++;
        Chunk.rebuiltThisFrame++;

        this.t.init();

        for (let x = this.x0; x < this.x1; x++) {
            for (let y = this.y0; y < this.y1; y++) {
                for (let z = this.z0; z < this.z1; z++) {

                    const tileId = this.level.getTile(x, y, z);

                    if (tileId > 0) {
                        const tile = Tile.tiles[tileId];
                        tile.render(this.t, this.level, layer, x, y, z);
                    }
                }
            }
        }

        if (this.meshes[layer].geometry) {
            this.meshes[layer].geometry.dispose();
        }

        if (this.t.vertexCount > 0) {
            const newGeometry = this.t.flush();
            if (newGeometry) {
                this.meshes[layer].geometry = newGeometry;
                this.meshes[layer].material = this.material;
                this.meshes[layer].visible = true;
            } else {
                this.meshes[layer].geometry = new THREE.BufferGeometry();
                this.meshes[layer].visible = false;
            }
        } else {
            this.meshes[layer].geometry = new THREE.BufferGeometry();
            this.meshes[layer].visible = false;
        }
    }

    addQuad(t, x0, y0, z0, u0, v0, x1, y1, z1, u1, v1, x2, y2, z2, u2, v2, x3, y3, z3, u3, v3) {
        t.vertexUV(x0, y0, z0, u0, v0);
        t.vertexUV(x1, y1, z1, u1, v1);
        t.vertexUV(x2, y2, z2, u2, v2);
        t.vertexUV(x3, y3, z3, u3, v3);
    }

    render(layer) {
        if (this.dirty) {
            this.rebuild(0);
            this.rebuild(1);
        }
        this.meshes[layer].visible = this.meshes[layer].geometry.attributes.position !== undefined;
    }

    setDirty() {
        this.dirty = true;
    }

    isDirty() {
        return this.dirty;
    }

    distanceToSqr(player) {
        const xd = player.x - this.x;
        const yd = player.y - this.y;
        const zd = player.z - this.z;
        return xd * xd + yd * yd + zd * zd;
    }
}