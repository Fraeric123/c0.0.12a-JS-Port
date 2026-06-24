export class Polygon {
    constructor(vertices, u0 = null, v0 = null, u1 = null, v1 = null) {
        this.vertices = vertices.slice();
        this.vertexCount = vertices.length;

        if (u0 !== null && v0 !== null && u1 !== null && v1 !== null) {
            this.vertices[0] = this.vertices[0].remap(u1, v0);
            this.vertices[1] = this.vertices[1].remap(u0, v0);
            this.vertices[2] = this.vertices[2].remap(u0, v1);
            this.vertices[3] = this.vertices[3].remap(u1, v1);
        }
    }

    getVerticesAndUVs() {
        const positions = [];
        const uvs = [];

        const indices = [0, 1, 2, 0, 2, 3];

        for (const i of indices) {
            const v = this.vertices[i];
            positions.push(v.x, v.y, v.z);
            uvs.push(v.u / 64.0, v.v / 32.0);
        }

        return { positions, uvs };
    }

    debugPrint() {
        for (let i = 3; i >= 0; i--) {
            const v = this.vertices[i];
            console.log(`  Vertex ${i}: (${v.x}, ${v.y}, ${v.z}), UV: (${v.u}, ${v.v})`);
        }
    }
}