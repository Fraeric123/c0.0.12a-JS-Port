import * as THREE from '../../libs/three.module.js';

export class DirtyChunkSorter {
    constructor(player, camera) {
        this.player = player;
        this.now = Date.now();
        this.frustum = new THREE.Frustum();
        if (camera) {
            const projScreenMatrix = new THREE.Matrix4();
            projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
            this.frustum.setFromProjectionMatrix(projScreenMatrix);
        }
    }

    compare(c0, c1) {
        const i0 = this.frustum.isVisible ? this.frustum.isVisible(c0.aabb) : true;
        const i1 = this.frustum.isVisible ? this.frustum.isVisible(c1.aabb) : true;

        if (i0 && !i1) return -1;
        if (i1 && !i0) return 1;

        const t0 = Math.floor((this.now - c0.dirtiedTime) / 2000);
        const t1 = Math.floor((this.now - c1.dirtiedTime) / 2000);

        if (t0 < t1) return -1;
        if (t0 > t1) return 1;

        return (c0.distanceToSqr(this.player) < c1.distanceToSqr(this.player)) ? -1 : 1;
    }
}