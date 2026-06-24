import * as THREE from "../../libs/three.module.js"
import { Vertex } from "./Vertex.js"
import { Polygon } from "./Polygon.js"

export class Cube {
    constructor(xTexOffs = 0, yTexOffs = 0) {
        this.xTexOffs = xTexOffs;
        this.yTexOffs = yTexOffs;

        this.vertices = [];
        this.polygons = [];

        this.x = 0; this.y = 0; this.z = 0;
        this.xRot = 0; this.yRot = 0; this.zRot = 0;

        this.mesh = null;
        this.group = null;
    }

    addBox(x0, y0, z0, w, h, d) {
        this.vertices = [];
        this.polygons = [];

        const x1 = x0 + w;
        const y1 = y0 + h;
        const z1 = z0 + d;

        const u0 = new Vertex(x0, y0, z0, 0.0, 0.0);
        const u1 = new Vertex(x1, y0, z0, 0.0, 8.0);
        const u2 = new Vertex(x1, y1, z0, 8.0, 8.0);
        const u3 = new Vertex(x0, y1, z0, 8.0, 0.0);
        const l0 = new Vertex(x0, y0, z1, 0.0, 0.0);
        const l1 = new Vertex(x1, y0, z1, 0.0, 8.0);
        const l2 = new Vertex(x1, y1, z1, 8.0, 8.0);
        const l3 = new Vertex(x0, y1, z1, 8.0, 0.0);

        this.vertices.push(u0, u1, u2, u3, l0, l1, l2, l3);

        this.polygons.push(
            new Polygon([l1, u1, u2, l2], this.xTexOffs + d + w, this.yTexOffs + d, this.xTexOffs + d + w + d, this.yTexOffs + d + h),
            new Polygon([u0, l0, l3, u3], this.xTexOffs + 0, this.yTexOffs + d, this.xTexOffs + d, this.yTexOffs + d + h),
            new Polygon([l1, l0, u0, u1], this.xTexOffs + d, this.yTexOffs + 0, this.xTexOffs + d + w, this.yTexOffs + d),
            new Polygon([u2, u3, l3, l2], this.xTexOffs + d + w, this.yTexOffs + 0, this.xTexOffs + d + w + w, this.yTexOffs + d),
            new Polygon([u1, u0, u3, u2], this.xTexOffs + d, this.yTexOffs + d, this.xTexOffs + d + w, this.yTexOffs + d + h),
            new Polygon([l0, l1, l2, l3], this.xTexOffs + d + w + d, this.yTexOffs + d, this.xTexOffs + d + w + d + w, this.yTexOffs + d + h)
        );
    }

    setPos(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;

        if (this.group) {
            this.group.position.set(this.x, this.y, this.z);
        }
    }

    createMesh(texture, parentGroup) {
        if (!texture) throw new Error("Cube.createMesh: texture required");
        if (!parentGroup) throw new Error("Cube.createMesh: parentGroup required");

        this.group = new THREE.Group();
        parentGroup.add(this.group);

        const positions = [];
        const uvs = [];
        const indices = [];
        let vertexIndex = 0;

        const faceIndices = [0, 1, 2, 0, 2, 3];

        for (const poly of this.polygons) {
            const polyVertices = poly.vertices;

            for (const offset of faceIndices) {
                indices.push(vertexIndex + offset);
            }

            const uValues = polyVertices.map(v => v.u);
            const vValues = polyVertices.map(v => v.v);
            const minU = Math.min(...uValues);
            const maxU = Math.max(...uValues);
            const minV = Math.min(...vValues);
            const maxV = Math.max(...vValues);

            for (const v of polyVertices) {
                positions.push(v.pos.x, v.pos.y, v.pos.z);

                let u = v.u;
                let vOrig = v.v;

                const pad = 0.005;

                if (u === minU) u += pad;
                if (u === maxU) u -= pad;
                if (vOrig === minV) vOrig += pad;
                if (vOrig === maxV) vOrig -= pad;

                let uFinal = u / 64.0;
                let vFinal = 1.0 - (vOrig / 32.0);

                uvs.push(uFinal, vFinal);
            }

            vertexIndex += 4;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.FrontSide,
            transparent: true,
            alphaTest: 0.5
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.group.add(this.mesh);

        if (this.x !== 0 || this.y !== 0 || this.z !== 0) {
            this.group.position.set(this.x, this.y, this.z);
        }
    }

    render() {
        if (!this.group) return;

        this.group.position.set(this.x, this.y, this.z);

        this.group.rotation.order = 'ZYX';
        this.group.rotation.set(this.xRot, this.yRot, this.zRot);
    }
}