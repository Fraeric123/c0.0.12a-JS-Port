import { Vec3 } from "./Vec3.js"

export class Vertex {
    constructor(...args) {
        if (args.length === 5 &&
            typeof args[0] === 'number' &&
            typeof args[1] === 'number' &&
            typeof args[2] === 'number') {
            const [x, y, z, u, v] = args;
            this.pos = new Vec3(x, y, z);
            this.u = u;
            this.v = v;
        }
        else if (args.length === 3 && args[0] instanceof Vertex) {
            const [vertex, u, v] = args;
            this.pos = vertex.pos;
            this.u = u;
            this.v = v;
        }
        else if (args.length === 3 && args[0] instanceof Vec3) {
            const [pos, u, v] = args;
            this.pos = pos;
            this.u = u;
            this.v = v;
        }
        else {
            throw new Error("Invalid arguments for Vertex constructor");
        }
    }

    remap(u, v) {
        return new Vertex(this, u, v);
    }

    get x() { return this.pos.x; }
    get y() { return this.pos.y; }
    get z() { return this.pos.z; }

    toString() {
        return `Vertex(pos=${this.pos}, u=${this.u}, v=${this.v})`;
    }
}