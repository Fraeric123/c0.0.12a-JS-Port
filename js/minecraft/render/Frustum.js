export class Frustum {
    static _instance = new Frustum();

    constructor() {
        this.m_Frustum = Array.from({ length: 6 }, () => new Float32Array(4));

        this.proj = new Float32Array(16);
        this.modl = new Float32Array(16);
        this.clip = new Float32Array(16);
    }

    static RIGHT = 0;
    static LEFT = 1;
    static BOTTOM = 2;
    static TOP = 3;
    static BACK = 4;
    static FRONT = 5;

    static getFrustum(customProjMatrix, customModlMatrix) {
        if (customProjMatrix && customModlMatrix) {
            Frustum._instance.calculateFrustum(customProjMatrix, customModlMatrix);
        } else { }
        return Frustum._instance;
    }

    normalizePlane(side) {
        const f = this.m_Frustum[side];
        const magnitude = Math.sqrt(f[0] * f[0] + f[1] * f[1] + f[2] * f[2]);

        f[0] /= magnitude;
        f[1] /= magnitude;
        f[2] /= magnitude;
        f[3] /= magnitude;
    }

    calculateFrustum(projectionMatrix, modelViewMatrix) {
        this.proj.set(projectionMatrix);
        this.modl.set(modelViewMatrix);

        const modl = this.modl;
        const proj = this.proj;
        const clip = this.clip;

        clip[0] = modl[0] * proj[0] + modl[1] * proj[4] + modl[2] * proj[8] + modl[3] * proj[12];
        clip[1] = modl[0] * proj[1] + modl[1] * proj[5] + modl[2] * proj[9] + modl[3] * proj[13];
        clip[2] = modl[0] * proj[2] + modl[1] * proj[6] + modl[2] * proj[10] + modl[3] * proj[14];
        clip[3] = modl[0] * proj[3] + modl[1] * proj[7] + modl[2] * proj[11] + modl[3] * proj[15];

        clip[4] = modl[4] * proj[0] + modl[5] * proj[4] + modl[6] * proj[8] + modl[7] * proj[12];
        clip[5] = modl[4] * proj[1] + modl[5] * proj[5] + modl[6] * proj[9] + modl[7] * proj[13];
        clip[6] = modl[4] * proj[2] + modl[5] * proj[6] + modl[6] * proj[10] + modl[7] * proj[14];
        clip[7] = modl[4] * proj[3] + modl[5] * proj[7] + modl[6] * proj[11] + modl[7] * proj[15];

        clip[8] = modl[8] * proj[0] + modl[9] * proj[4] + modl[10] * proj[8] + modl[11] * proj[12];
        clip[9] = modl[8] * proj[1] + modl[9] * proj[5] + modl[10] * proj[9] + modl[11] * proj[13];
        clip[10] = modl[8] * proj[2] + modl[9] * proj[6] + modl[10] * proj[10] + modl[11] * proj[14];
        clip[11] = modl[8] * proj[3] + modl[9] * proj[7] + modl[10] * proj[11] + modl[11] * proj[15];

        clip[12] = modl[12] * proj[0] + modl[13] * proj[4] + modl[14] * proj[8] + modl[15] * proj[12];
        clip[13] = modl[12] * proj[1] + modl[13] * proj[5] + modl[14] * proj[9] + modl[15] * proj[13];
        clip[14] = modl[12] * proj[2] + modl[13] * proj[6] + modl[14] * proj[10] + modl[15] * proj[14];
        clip[15] = modl[12] * proj[3] + modl[13] * proj[7] + modl[14] * proj[11] + modl[15] * proj[15];

        this.m_Frustum[0][0] = clip[3] - clip[0];
        this.m_Frustum[0][1] = clip[7] - clip[4];
        this.m_Frustum[0][2] = clip[11] - clip[8];
        this.m_Frustum[0][3] = clip[15] - clip[12];
        this.normalizePlane(0);

        this.m_Frustum[1][0] = clip[3] + clip[0];
        this.m_Frustum[1][1] = clip[7] + clip[4];
        this.m_Frustum[1][2] = clip[11] + clip[8];
        this.m_Frustum[1][3] = clip[15] + clip[12];
        this.normalizePlane(1);

        this.m_Frustum[2][0] = clip[3] + clip[1];
        this.m_Frustum[2][1] = clip[7] + clip[5];
        this.m_Frustum[2][2] = clip[11] + clip[9];
        this.m_Frustum[2][3] = clip[15] + clip[13];
        this.normalizePlane(2);

        this.m_Frustum[3][0] = clip[3] - clip[1];
        this.m_Frustum[3][1] = clip[7] - clip[5];
        this.m_Frustum[3][2] = clip[11] - clip[9];
        this.m_Frustum[3][3] = clip[15] - clip[13];
        this.normalizePlane(3);

        this.m_Frustum[4][0] = clip[3] - clip[2];
        this.m_Frustum[4][1] = clip[7] - clip[6];
        this.m_Frustum[4][2] = clip[11] - clip[10];
        this.m_Frustum[4][3] = clip[15] - clip[14];
        this.normalizePlane(4);

        this.m_Frustum[5][0] = clip[3] + clip[2];
        this.m_Frustum[5][1] = clip[7] + clip[6];
        this.m_Frustum[5][2] = clip[11] + clip[10];
        this.m_Frustum[5][3] = clip[15] + clip[14];
        this.normalizePlane(5);
    }

    cubeInFrustum(x1, y1, z1, x2, y2, z2) {
        for (let i = 0; i < 6; i++) {
            const f = this.m_Frustum[i];
            if (
                f[0] * x1 + f[1] * y1 + f[2] * z1 + f[3] > 0 ||
                f[0] * x2 + f[1] * y1 + f[2] * z1 + f[3] > 0 ||
                f[0] * x1 + f[1] * y2 + f[2] * z1 + f[3] > 0 ||
                f[0] * x2 + f[1] * y2 + f[2] * z1 + f[3] > 0 ||
                f[0] * x1 + f[1] * y1 + f[2] * z2 + f[3] > 0 ||
                f[0] * x2 + f[1] * y1 + f[2] * z2 + f[3] > 0 ||
                f[0] * x1 + f[1] * y2 + f[2] * z2 + f[3] > 0 ||
                f[0] * x2 + f[1] * y2 + f[2] * z2 + f[3] > 0
            ) {
                continue;
            }
            return false;
        }
        return true;
    }

    isVisible(aabb) {
        return this.cubeInFrustum(aabb.x0, aabb.y0, aabb.z0, aabb.x1, aabb.y1, aabb.z1);
    }
}