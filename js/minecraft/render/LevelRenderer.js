import * as THREE from '../../libs/three.module.js';
import { Chunk } from '../level/Chunk.js';
import { DirtyChunkSorter } from '../level/DirtyChunkSorter.js';
import { Tesselator } from '../render/Tesselator.js';

export class LevelRenderer {
    constructor(level, scene) {
        this.CHUNK_SIZE = 16;
        this.level = level;
        this.scene = scene;

        this.xChunks = Math.floor(level.width / this.CHUNK_SIZE);
        this.yChunks = Math.floor(level.depth / this.CHUNK_SIZE);
        this.zChunks = Math.floor(level.height / this.CHUNK_SIZE);

        this.chunks = new Array(this.xChunks * this.yChunks * this.zChunks);

        this.drawDistance = 0;

        for (let x = 0; x < this.xChunks; x++) {
            for (let y = 0; y < this.yChunks; y++) {
                for (let z = 0; z < this.zChunks; z++) {
                    let x0 = x * this.CHUNK_SIZE;
                    let y0 = y * this.CHUNK_SIZE;
                    let z0 = z * this.CHUNK_SIZE;
                    let x1 = (x + 1) * this.CHUNK_SIZE;
                    let y1 = (y + 1) * this.CHUNK_SIZE;
                    let z1 = (z + 1) * this.CHUNK_SIZE;

                    if (x1 > level.width) x1 = level.width;
                    if (y1 > level.depth) y1 = level.depth;
                    if (z1 > level.height) z1 = level.height;

                    const chunkIndex = (x + y * this.xChunks) * this.zChunks + z;
                    const newChunk = new Chunk(level, x0, y0, z0, x1, y1, z1);
                    this.chunks[chunkIndex] = newChunk;

                    this.scene.add(newChunk.meshes[0]);
                    this.scene.add(newChunk.meshes[1]);
                }
            }
        }

        level.addListener(this);
    }

    pick(distance = 5.0, camera) {
        const start = new THREE.Vector3().copy(camera.position);
        const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();

        let x = Math.floor(start.x);
        let y = Math.floor(start.y);
        let z = Math.floor(start.z);

        const stepX = dir.x > 0 ? 1 : -1;
        const stepY = dir.y > 0 ? 1 : -1;
        const stepZ = dir.z > 0 ? 1 : -1;

        const tDeltaX = Math.abs(1 / dir.x);
        const tDeltaY = Math.abs(1 / dir.y);
        const tDeltaZ = Math.abs(1 / dir.z);

        let tMaxX = (dir.x > 0 ? (x + 1 - start.x) : (start.x - x)) * tDeltaX;
        let tMaxY = (dir.y > 0 ? (y + 1 - start.y) : (start.y - y)) * tDeltaY;
        let tMaxZ = (dir.z > 0 ? (z + 1 - start.z) : (start.z - z)) * tDeltaZ;

        let f = -1;
        let dist = 0;

        if (this.level.getTile(x, y, z) !== 0) {
            return { x: x, y: y, z: z, f: f };
        }

        while (dist < distance) {
            if (tMaxX < tMaxY) {
                if (tMaxX < tMaxZ) {
                    dist = tMaxX;
                    tMaxX += tDeltaX;
                    x += stepX;
                    f = stepX > 0 ? 4 : 5;
                } else {
                    dist = tMaxZ;
                    tMaxZ += tDeltaZ;
                    z += stepZ;
                    f = stepZ > 0 ? 2 : 3;
                }
            } else {
                if (tMaxY < tMaxZ) {
                    dist = tMaxY;
                    tMaxY += tDeltaY;
                    y += stepY;
                    f = stepY > 0 ? 0 : 1;
                } else {
                    dist = tMaxZ;
                    tMaxZ += tDeltaZ;
                    z += stepZ;
                    f = stepZ > 0 ? 2 : 3;
                }
            }

            if (this.level.getTile(x, y, z) !== 0) {
                return { x: x, y: y, z: z, f: f };
            }
        }
        return null;
    }

    renderSurroundingGround() {
        if (this.groundMesh) {
            this.groundMesh.visible = true;
        }
    }

    compileSurroundingGround() {
        if (this.groundMesh) {
            if (this.scene) this.scene.remove(this.groundMesh);
            this.groundMesh.geometry.dispose();
        }

        const t = Tesselator.instance;
        const groundLevel = this.level.getGroundLevel();
        const y = groundLevel - 2.0;

        let s = 128;
        if (s > this.level.width) s = this.level.width;
        if (s > this.level.height) s = this.level.height;
        const d = 5;

        t.init();

        for (let xx = -s * d; xx < this.level.width + s * d; xx += s) {
            for (let i = -s * d; i < this.level.height + s * d; i += s) {
                let yy = y;
                if (xx >= 0 && i >= 0 && xx < this.level.width && i < this.level.height) {
                    yy = 0.0;
                }

                t.color(1.0, 1.0, 1.0);
                t.vertexUV(xx + 0, yy, i + s, 0.0, s);
                t.vertexUV(xx + s, yy, i + s, s, s);
                t.vertexUV(xx + s, yy, i + 0, s, 0.0);
                t.vertexUV(xx + 0, yy, i + 0, 0.0, 0.0);
            }
        }

        for (let xx = 0; xx < this.level.width; xx += s) {
            t.color(0.8, 0.8, 0.8);
            t.vertexUV(xx + 0, 0.0, 0.0, 0.0, 0.0);
            t.vertexUV(xx + s, 0.0, 0.0, s, 0.0);
            t.vertexUV(xx + s, y, 0.0, s, y);
            t.vertexUV(xx + 0, y, 0.0, 0.0, y);

            t.color(0.8, 0.8, 0.8);
            t.vertexUV(xx + 0, y, this.level.height, 0.0, y);
            t.vertexUV(xx + s, y, this.level.height, s, y);
            t.vertexUV(xx + s, 0.0, this.level.height, s, 0.0);
            t.vertexUV(xx + 0, 0.0, this.level.height, 0.0, 0.0);
        }

        for (let zz = 0; zz < this.level.height; zz += s) {
            t.color(0.6, 0.6, 0.6);
            t.vertexUV(0.0, y, zz + 0, 0.0, 0.0);
            t.vertexUV(0.0, y, zz + s, s, 0.0);
            t.vertexUV(0.0, 0.0, zz + s, s, y);
            t.vertexUV(0.0, 0.0, zz + 0, 0.0, y);

            t.color(0.6, 0.6, 0.6);
            t.vertexUV(this.level.width, 0.0, zz + 0, 0.0, y);
            t.vertexUV(this.level.width, 0.0, zz + s, s, y);
            t.vertexUV(this.level.width, y, zz + s, s, 0.0);
            t.vertexUV(this.level.width, y, zz + 0, 0.0, 0.0);
        }

        const geometry = t.flush();
        if (!geometry) return;

        const textureLoader = new THREE.TextureLoader();
        const rockTexture = textureLoader.load('./assets/textures/rock.png');
        rockTexture.magFilter = THREE.NearestFilter;
        rockTexture.minFilter = THREE.NearestFilter;
        rockTexture.wrapS = THREE.RepeatWrapping;
        rockTexture.wrapT = THREE.RepeatWrapping;

        const material = new THREE.MeshBasicMaterial({
            map: rockTexture,
            vertexColors: true
        });

        this.groundMesh = new THREE.Mesh(geometry, material);
        if (this.scene) {
            this.scene.add(this.groundMesh);
        }
    }

    renderSurroundingWater() {
        if (this.waterMesh) {
            this.waterMesh.visible = true;
        }
    }

    compileSurroundingWater() {
        if (this.waterMesh) {
            if (this.scene) this.scene.remove(this.waterMesh);
            this.waterMesh.geometry.dispose();
        }

        const t = Tesselator.instance;
        const groundLevel = this.level.getGroundLevel();
        const y = groundLevel;

        let s = 128;
        if (s > this.level.width) s = this.level.width;
        if (s > this.level.height) s = this.level.height;
        const d = 5;

        t.init();

        for (let xx = -s * d; xx < this.level.width + s * d; xx += s) {
            for (let zz = -s * d; zz < this.level.height + s * d; zz += s) {
                const yy = y - 0.1;
                if (xx < 0 || zz < 0 || xx >= this.level.width || zz >= this.level.height) {
                    t.color(1.0, 1.0, 1.0);

                    t.vertexUV(xx + 0, yy, zz + s, 0.0, s);
                    t.vertexUV(xx + s, yy, zz + s, s, s);
                    t.vertexUV(xx + s, yy, zz + 0, s, 0.0);
                    t.vertexUV(xx + 0, yy, zz + 0, 0.0, 0.0);

                    t.vertexUV(xx + 0, yy, zz + 0, 0.0, 0.0);
                    t.vertexUV(xx + s, yy, zz + 0, s, 0.0);
                    t.vertexUV(xx + s, yy, zz + s, s, s);
                    t.vertexUV(xx + 0, yy, zz + s, 0.0, s);
                }
            }
        }

        const geometry = t.flush();
        if (!geometry) return;

        const textureLoader = new THREE.TextureLoader();
        const waterTexture = textureLoader.load('./assets/textures/water.png');
        waterTexture.magFilter = THREE.NearestFilter;
        waterTexture.minFilter = THREE.NearestFilter;
        waterTexture.wrapS = THREE.RepeatWrapping;
        waterTexture.wrapT = THREE.RepeatWrapping;

        const material = new THREE.MeshBasicMaterial({
            map: waterTexture,
            transparent: true,
            vertexColors: true,
            side: THREE.DoubleSide
        });

        this.waterMesh = new THREE.Mesh(geometry, material);
        if (this.scene) {
            this.scene.add(this.waterMesh);
        }
    }

    mergeGeometries(geometries) {
        if (geometries[0] instanceof THREE.BufferGeometry) {
            return geometries[0];
        }
        return geometries[0];
    }

    renderHit(h, mode, color = 0x000000, opacity = 0.2) {
        if (!this.selectionMesh) {
            const boxGeo = new THREE.BoxGeometry(1.002, 1.002, 1.002);
            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: opacity,
                depthWrite: false
            });
            this.selectionMesh = new THREE.Mesh(boxGeo, material);
            this.selectionMesh.renderOrder = 999;
            this.scene.add(this.selectionMesh);
        }

        this.selectionMesh.visible = true;

        let x = h.x;
        let y = h.y;
        let z = h.z;

        if (mode === 1) {
            if (h.f === 0) y--;
            if (h.f === 1) y++;
            if (h.f === 2) z--;
            if (h.f === 3) z++;
            if (h.f === 4) x--;
            if (h.f === 5) x++;
        }
        if (this.selectionMesh.material.color.getHex() !== color) {
            this.selectionMesh.material.color.setHex(color);
        }
        if (this.selectionMesh.material.opacity !== opacity) {
            this.selectionMesh.material.opacity = opacity;
        }

        this.selectionMesh.position.set(x + 0.5, y + 0.5, z + 0.5);
    }

    render(player, layer) {
        Chunk.rebuiltThisFrame = 0;

        const xd = player.x - this.lX;
        const yd = player.y - this.lY;
        const zd = player.z - this.lZ;

        if ((xd * xd + yd * yd + zd * zd) > 64.0) {
            this.lX = player.x;
            this.lY = player.y;
            this.lZ = player.z;

            this.chunks.sort((chunkA, chunkB) => {
                return chunkA.distanceToSqr(player) - chunkB.distanceToSqr(player);
            });
        }

        const dd = 256 >> this.drawDistance;
        const maxDistanceSqr = dd * dd;

        this.chunks.forEach(chunk => {
            if (chunk.visible) {

                if (this.drawDistance === 0 || chunk.distanceToSqr(player) < maxDistanceSqr) {
                    chunk.render(layer);
                }
            }
        });
    }

    toggleDrawDistance() {
        this.drawDistance = (this.drawDistance + 1) % 4;
    }

    updateDirtyChunks(player, camera) {
        let dirty = this.getAllDirtyChunks();
        if (!dirty || dirty.length === 0) return;

        const sorter = new DirtyChunkSorter(player, camera);
        dirty.sort((a, b) => sorter.compare(a, b));

        const limit = Math.min(8, dirty.length);
        for (let i = 0; i < limit; i++) {
            dirty[i].rebuild(0);
            dirty[i].rebuild(1);
        }
    }

    getAllDirtyChunks() {
        let dirty = [];
        this.chunks.forEach(chunk => {
            if (chunk.isDirty()) {
                dirty.push(chunk);
            }
        });
        return dirty;
    }

    setDirty(x0, y0, z0, x1, y1, z1) {
        x0 = Math.floor(x0 / this.CHUNK_SIZE);
        x1 = Math.floor(x1 / this.CHUNK_SIZE);
        y0 = Math.floor(y0 / this.CHUNK_SIZE);
        y1 = Math.floor(y1 / this.CHUNK_SIZE);
        z0 = Math.floor(z0 / this.CHUNK_SIZE);
        z1 = Math.floor(z1 / this.CHUNK_SIZE);

        if (x0 < 0) x0 = 0;
        if (y0 < 0) y0 = 0;
        if (z0 < 0) z0 = 0;
        if (x1 >= this.xChunks) x1 = this.xChunks - 1;
        if (y1 >= this.yChunks) y1 = this.yChunks - 1;
        if (z1 >= this.zChunks) z1 = this.zChunks - 1;

        for (let x = x0; x <= x1; x++) {
            for (let y = y0; y <= y1; y++) {
                for (let z = z0; z <= z1; z++) {
                    const index = (x + y * this.xChunks) * this.zChunks + z;
                    this.chunks[index].setDirty();
                }
            }
        }
    }

    tileChanged(x, y, z) {
        this.setDirty(x - 1, y - 1, z - 1, x + 1, y + 1, z + 1);
    }

    lightColumnChanged(x, z, y0, y1) {
        this.setDirty(x - 1, y0 - 1, z - 1, x + 1, y1 + 1, z + 1);
    }

    allChanged() {
        this.setDirty(0, 0, 0, this.level.width, this.level.depth, this.level.height);
    }

}