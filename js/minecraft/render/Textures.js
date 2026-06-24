import * as THREE from '../../libs/three.module.js';

export class Textures {
    static loadTexture(path) {
        const loader = new THREE.TextureLoader();
        const texture = loader.load(path);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        return texture;
    }
}