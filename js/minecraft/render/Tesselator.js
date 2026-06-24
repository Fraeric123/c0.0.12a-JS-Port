import * as THREE from '../../libs/three.module.js';

export class Tesselator {
    static instance = new Tesselator();

    constructor() {
        this.positions = [];
        this.uvs = [];
        this.colors = [];
        this.buffer = [];
        this.vertexCount = 0;
        this.u = 0; this.v = 0;
        this.r = 0; this.g = 0; this.b = 0;
        this.hasColor = false;
        this.hasTexture = false;
        this.noColor = false;
        this.len = 3;
        this.isLines = false;
    }

    init(isLines = false) {
        this.positions = [];
        this.uvs = [];
        this.colors = [];
        this.buffer = [];
        this.vertexCount = 0;
        this.hasColor = false;
        this.hasTexture = false;
        this.isLines = isLines;
    }

    colorRGBA(c) {
        const r = ((c >> 16) & 0xFF) / 255.0;
        const g = ((c >> 8) & 0xFF) / 255.0;
        const b = (c & 0xFF) / 255.0;
        this.color(r, g, b);
    }

    tex(u, v) {
        if (!this.hasTexture) this.len += 2;
        this.hasTexture = true;
        this.u = u;
        this.v = v;
    }

    color(r, g, b) {
        if (this.noColor) return;
        if (!this.hasColor) this.len += 3;
        this.hasColor = true;
        this.r = r;
        this.g = g;
        this.b = b;
    }

    vertexUV(x, y, z, u, v) {
        this.tex(u, v);
        this.vertex(x, y, z);
    }

    vertex(x, y, z) {
        if (this.isLines) {
            this.positions.push(x, y, z);
            if (this.hasColor) this.colors.push(this.r, this.g, this.b);
            this.vertexCount++;
            return;
        }

        this.buffer.push({ x, y, z, u: this.u, v: this.v, r: this.r, g: this.g, b: this.b });

        if (this.buffer.length === 4) {
            const indices = [0, 1, 2, 0, 2, 3];
            for (const idx of indices) {
                const vert = this.buffer[idx];
                this.positions.push(vert.x, vert.y, vert.z);
                if (this.hasTexture) this.uvs.push(vert.u, 1.0 - vert.v);
                if (this.hasColor) this.colors.push(vert.r, vert.g, vert.b);
                this.vertexCount++;
            }
            this.buffer = [];
        }
    }

    flush() {
        if (this.vertexCount === 0) return null;
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
        if (this.hasTexture && !this.isLines) geometry.setAttribute('uv', new THREE.Float32BufferAttribute(this.uvs, 2));
        if (this.hasColor) geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
        geometry.computeBoundingSphere();
        geometry.computeBoundingBox();
        return geometry;
    }
}