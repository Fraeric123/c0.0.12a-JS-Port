import * as THREE from '../libs/three.module.js';

import { Textures } from './render/Textures.js';

import { BitmapFont } from './gui/BitmapFont.js';
import { LevelGenScreen } from './gui/LevelGenScreen.js';
import { PauseScreen } from './gui/PauseScreen.js';

import { Tile } from './level/tile/Tile.js';
import { GrassTile } from './level/tile/GrassTile.js';
import { DirtTile } from './level/tile/DirtTile.js';
import { BushTile } from './level/tile/BushTile.js';
import { LiquidTile } from './level/tile/LiquidTile.js';
import { CalmLiquidTile } from './level/tile/CalmLiquidTile.js';

import { Level } from './level/Level.js';
import { LevelGen } from './level/levelgen/LevelGen.js';
import { LevelRenderer } from './render/LevelRenderer.js';
import { Tesselator } from './render/Tesselator.js';
import { AABB } from './phys/AABB.js';

import { ParticleEngine } from './particle/ParticleEngine.js';

import { Timer } from './Timer.js';
import { Entity } from './Entity.js';

import { Zombie } from './character/Zombie.js';

import { Player } from './Player.js';

export const SteveTexture = Textures.loadTexture('./assets/textures/char.png');

SteveTexture.magFilter = THREE.NearestFilter;
SteveTexture.minFilter = THREE.NearestFilter;
SteveTexture.generateMipmaps = false;
SteveTexture.flipY = true;

Tile.empty = null;
Tile.rock = new Tile(1, 1);
Tile.grass = new GrassTile(2);
Tile.dirt = new DirtTile(3, 2);
Tile.stoneBrick = new Tile(4, 16);
Tile.wood = new Tile(5, 4);
Tile.bush = new BushTile(6);
Tile.unbreakable = new Tile(7, 17);
Tile.water = new LiquidTile(8, 1);
Tile.calmWater = new CalmLiquidTile(9, 1);
Tile.lava = new LiquidTile(10, 2);
Tile.calmLava = new CalmLiquidTile(11, 2);

class Minecraft {
    constructor() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.timer = new Timer(20.0, this);
        this.level = null;
        this.levelRenderer = null;
        this.player = null;
        this.entities = [];

        this.paintTexture = Tile.stoneBrick.id;

        this.renderer = null;
        this.scene = null;
        this.camera = null;

        this.pause = false;

        this.title = "0.0.12a Port";

        this.guiWidth = this.width * 240 / this.height;
        this.guiHeight = 240;
        this.guiBlockMesh = null;
        this.guiCamera = null;
        this.guiScene = null;

        this.screen = null;
        this.mouseX = 0;
        this.mouseY = 0;

        this.fogColor = new THREE.Color(0.5, 0.8, 1.0);

        this.guiCanvas = document.createElement('canvas');
        this.guiCanvas.style.imageRendering = 'pixelated';
        this.guiCanvas.style.imageRendering = 'crisp-edges';
        this.guiCanvas.id = 'gui-canvas';
        this.guiCanvas.style.position = 'absolute';
        this.guiCanvas.style.top = '0';
        this.guiCanvas.style.left = '0';
        this.guiCanvas.style.width = '100%';
        this.guiCanvas.style.height = '100%';
        this.guiCanvas.style.backgroundColor = 'transparent';
        this.guiCanvas.style.pointerEvents = 'auto';

        document.body.appendChild(this.guiCanvas);

        this.ctx = this.guiCanvas.getContext('2d');

        this.bitmap_font = new BitmapFont(this.ctx, "./assets/fonts/default.gif");

        this.resizeCanvas();

        window.addEventListener('resize', () => this.onResize());
    }

    onResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.resizeCanvas();

        this.guiWidth = this.guiCanvas.width;
        this.guiHeight = this.guiCanvas.height;

        if (this.camera) {
            this.camera.aspect = this.width / this.height;
            this.camera.updateProjectionMatrix();
        }

        if (this.renderer) {
            this.renderer.setSize(this.width, this.height);
        }

        if (this.guiCamera) {
            this.guiCamera.right = window.innerWidth * 240 / window.innerHeight;
            this.guiCamera.bottom = window.innerHeight * 240 / window.innerHeight;
            this.guiCamera.updateProjectionMatrix();
        }

        this.render(true);
    }

    resizeCanvas() {
        this.guiCanvas.height = 1440;
        this.guiCanvas.width = (window.innerWidth * this.guiCanvas.height) / window.innerHeight;
    }

    renderGUIBlock() {
        if (this.isCapturingScreenshot) return;
        if (this.guiBlockMesh) {
            this.guiBlockMesh.position.set(window.innerWidth * 240 / window.innerHeight - 12, 12, 0);
        }

        if (this.guiBlockMesh) {
            this.renderer.autoClear = false;
            this.renderer.render(this.guiScene, this.guiCamera);
            this.renderer.autoClear = true;
        }
    }

    updateGUIBlock() {
        if (!this.guiScene) return;
        if (!this.levelRenderer || !this.level.texture) return;

        if (this.guiBlockMesh) {
            this.guiScene.remove(this.guiBlockMesh);
            this.guiBlockMesh.geometry.dispose();
        }

        const selectedBlockId = this.paintTexture;
        const tile = Tile.tiles[selectedBlockId];
        if (!tile) return;

        const t = new Tesselator();
        t.init();

        const mockLevel = {
            width: 256,
            height: 256,
            isLit: () => true,
            getTile: () => 0,
            isSolidTile: (x, y, z) => false,
            getBrightness: () => 1,
        };

        tile.render(t, mockLevel, 0, 0, 0, 0);
        tile.render(t, mockLevel, 1, 0, 0, 0);

        const geometry = t.flush();

        if (!geometry) return;

        const guiMaterial = new THREE.MeshBasicMaterial({
            map: this.level.texture,
            vertexColors: true,
            transparent: true,
            alphaTest: 0.5,
            side: THREE.DoubleSide
        });

        this.guiBlockMesh = new THREE.Mesh(geometry, guiMaterial);

        geometry.translate(-0.5, -0.5, -0.5);

        this.guiBlockMesh.scale.set(12, 12, 12);

        this.guiBlockMesh.rotation.reorder('YXZ');
        this.guiBlockMesh.rotation.x = THREE.MathUtils.degToRad(165);
        this.guiBlockMesh.rotation.y = THREE.MathUtils.degToRad(46);
        this.guiBlockMesh.rotation.z = THREE.MathUtils.degToRad(15);

        this.guiScene.add(this.guiBlockMesh);
    }

    renderGUI(skippause) {
        const w = this.guiCanvas.width;
        const h = this.guiCanvas.height;

        this.ctx.clearRect(0, 0, w, h);
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'difference';
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.imageSmoothingEnabled = false;

        const crosshairSize = 12;
        const centerX = w / 2;
        const centerY = h / 2;

        this.ctx.beginPath();
        this.ctx.moveTo(centerX - crosshairSize, centerY);
        this.ctx.lineTo(centerX + crosshairSize, centerY);
        this.ctx.moveTo(centerX, centerY - crosshairSize);
        this.ctx.lineTo(centerX, centerY + crosshairSize);
        this.ctx.stroke();
        this.ctx.restore();

        this.bitmap_font.drawText(this.title, 20, 20, true, 3, 0xFFFFFF);
        this.bitmap_font.drawText(`${this.timer.calmfps.toFixed(0)} fps, ${this.timer.chunkUpdatesPerSecond} chunk updates`, 20, 50, true, 3, 0xFFFFFF);
        //čřthis.bitmap_font.drawText(`${this.player.x.toFixed(2)} X ${(this.player.y-0.62).toFixed(2)} Y ${this.player.z.toFixed(2)} Z`, 20, 80, true, 3, 0xFFFFFF);
        //this.bitmap_font.drawText(`Seed: ${this.level.random.seed}`, 20, 110, true, 3, 0xFFFFFF);
        //this.bitmap_font.drawText(`Entity couter: ${this.entities.length}`, 20, 140, true, 3, 0xFFFFFF);

        this.renderGUIBlock();

        if (this.screen !== null) {
            this.screen.render(this.mouseX, this.mouseY, w, h);
        }
    }

    async init() {
        this.renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setClearColor(this.fogColor);
        this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
        document.body.appendChild(this.renderer.domElement);

        this.scene = new THREE.Scene();
        //this.scene.fog = new THREE.FogExp2(this.fogColor, 0.01);

        this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 0.05, 1000.0);

        this.guiScene = new THREE.Scene();

        this.guiWidth = (this.width * 240) / this.height;
        this.guiCamera = new THREE.OrthographicCamera(0, this.guiWidth, 0, 240, -100, 100);
        this.guiCamera.position.set(0, 0, 50);
        this.guiCamera.lookAt(0, 0, 0);

        await this.generateNewLevel();

        this.setScreen(new PauseScreen());

        this.setupControls();

        this.updateGUIBlock();

        this.render();        
    }

    loop() {
        requestAnimationFrame(() => this.loop());
        if (!this.pause) {
            this.timer.advanceTime();
            for (let i = 0; i < this.timer.ticks; i++) {
                this.tick();
            }
        }
        this.render();
    }

    async run() {
        await this.init();
        this.loop();
    }

    async saveLevel() {
        try {
            const blocks = this.level.blocks;

            const blob = new Blob([blocks]);
            const compressionStream = blob.stream().pipeThrough(new CompressionStream('gzip'));

            const compressedBuffer = await new Response(compressionStream).arrayBuffer();

            const saveBlob = new Blob([compressedBuffer], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(saveBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'level.dat';
            link.click();

            URL.revokeObjectURL(url);

            console.log(`World saved`);
        } catch (error) {
            console.error("World save error:", error);
        }
    }

    async loadLevel() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.dat';
        input.onchange = async e => {
            try {
                const file = e.target.files[0];
                if (!file) return;

                const decompressionStream = file.stream().pipeThrough(new DecompressionStream('gzip'));
                const decompressedBuffer = await new Response(decompressionStream).arrayBuffer();
                const decompressedData = new Uint8Array(decompressedBuffer);

                if (decompressedData.length !== this.level.blocks.length) {
                    console.error("Incorrect world size: " + decompressedData.length + " ~= " + this.level.blocks.length);
                    return;
                }

                this.level.blocks.set(decompressedData);

                this.level.calcLightDepths(0, 0, this.level.width, this.level.height);
                this.levelRenderer.allChanged();

                console.log(`World loaded`);

                this.render(true);
            } catch (error) {
                console.error("World save error. GZIP only", error);
            }
        };
        input.click();
    }

    takeScreenshot() {
        const superSamplingFactor = 2;
        const screenshotWidth = this.width * superSamplingFactor;
        const screenshotHeight = this.height * superSamplingFactor;

        const renderTarget = new THREE.WebGLRenderTarget(screenshotWidth, screenshotHeight, {
            minFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat
        });

        this.renderer.setRenderTarget(renderTarget);

        this.renderer.setClearColor(this.fogColor);
        this.renderer.clear();

        this.levelRenderer.render(this.player, 0);
        this.levelRenderer.render(this.player, 1);
        this.particleEngine.render(this.player, this.timer.a);
        this.entities.forEach(z => z.render(this.timer.a));

        this.renderer.render(this.scene, this.camera);

        this.renderer.setRenderTarget(null);

        const canvas2d = document.createElement('canvas');
        canvas2d.width = screenshotWidth;
        canvas2d.height = screenshotHeight;
        const ctx2d = canvas2d.getContext('2d');

        const buffer = new Uint8Array(screenshotWidth * screenshotHeight * 4);
        this.renderer.readRenderTargetPixels(renderTarget, 0, 0, screenshotWidth, screenshotHeight, buffer);

        const imageData = ctx2d.createImageData(screenshotWidth, screenshotHeight);
        for (let y = 0; y < screenshotHeight; y++) {
            const srcRow = (screenshotHeight - 1 - y) * screenshotWidth * 4;
            const destRow = y * screenshotWidth * 4;
            for (let x = 0; x < screenshotWidth * 4; x++) {
                imageData.data[destRow + x] = buffer[srcRow + x];
            }
        }
        ctx2d.putImageData(imageData, 0, 0);

        const dataURL = canvas2d.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `minecraft-screenshot-${Date.now()}.png`;
        link.href = dataURL;
        link.click();

        renderTarget.dispose();
    }

    setupControls() {
        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === document.body) {
                this.pause = false;
            } else {
                this.setScreen(new PauseScreen());
                this.pause = true;
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement) {
                this.player.turn(-e.movementX, e.movementY);
            }
        });

        this.guiCanvas.addEventListener('mousemove', (e) => {
            const rect = this.guiCanvas.getBoundingClientRect();
            this.mouseX = (e.clientX - rect.left) * (this.guiCanvas.width / rect.width);
            this.mouseY = (e.clientY - rect.top) * (this.guiCanvas.height / rect.height);
        });

        this.guiCanvas.addEventListener('mousedown', (e) => {
            if (this.screen !== null) {
                this.screen.mouseClicked(this.mouseX, this.mouseY, e.button);
            } else {
                if (!document.pointerLockElement) document.body.requestPointerLock();
            }
        });

        window.addEventListener('mousedown', (e) => {
            if (!document.pointerLockElement) return;
            if (e.button === 0) {
                this.rightMouseButtonDown = true;
            }
            if (e.button === 1) {
                this.middleMouseButtonDown = true;
            }
            else if (e.button === 2) {
                this.leftMouseButtonDown = true;
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.rightMouseButtonDown = false;
            }
            if (e.button === 1) {
                this.middleMouseButtonDown = false;
            }
            if (e.button === 2) {
                this.leftMouseButtonDown = false;
            }
        });

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Enter') {
                this.saveLevel();
            }
            if (e.code === 'Insert') {
                this.loadLevel();
            }
            if (e.code === 'KeyG') {
                const blockEntity = new Zombie(this.level, this.player.x, this.player.y, this.player.z, this.scene);

                this.entities.push(blockEntity);
            }
            if (e.code === 'KeyO') {
                this.takeScreenshot();
            }
            if (e.code === 'Digit1' || e.code === 'Numpad1') {
                this.paintTexture = 2;
                this.updateGUIBlock();
            }
            if (e.code === 'Digit2' || e.code === 'Numpad2') {
                this.paintTexture = 3;
                this.updateGUIBlock();
            }
            if (e.code === 'Digit3' || e.code === 'Numpad3') {
                this.paintTexture = 4;
                this.updateGUIBlock();
            }
            if (e.code === 'Digit4' || e.code === 'Numpad4') {
                this.paintTexture = 5;
                this.updateGUIBlock();
            }
            if (e.code === 'Digit5' || e.code === 'Numpad5') {
                this.paintTexture = 6;
                this.updateGUIBlock();
            }
            if (e.code === 'KeyF') {
                this.levelRenderer.toggleDrawDistance();
                console.log(this.levelRenderer.drawDistance);
            }
            //console.log(e.code);
        });

        window.addEventListener('wheel', (event) => {
            if (!document.pointerLockElement) return;
            const validTileIds = Object.keys(Tile.tiles)
                .map(Number)
                .filter(id => Tile.tiles[id] !== null && id !== 0);

            if (validTileIds.length === 0) return;

            let currentIndex = validTileIds.indexOf(this.paintTexture);
            if (currentIndex === -1) currentIndex = 0;

            if (event.deltaY > 0) {
                currentIndex++;
            } else {
                currentIndex--;
            }

            if (currentIndex >= validTileIds.length) currentIndex = 0;
            if (currentIndex < 0) currentIndex = validTileIds.length - 1;

            this.paintTexture = validTileIds[currentIndex];
            this.updateGUIBlock()
        }, { passive: true });

        window.addEventListener('contextmenu', e => e.preventDefault());
    }

    setScreen(screen) {
        this.screen = screen;
        if (screen !== null) {
            document.exitPointerLock();
            screen.init(this, this.guiCanvas.width, this.guiCanvas.height);
        }
    }

    isFree(aabb) {
        if (this.player.bb.intersects(aabb))
            return false;
        for (let i = 0; i < this.entities.length; i++) {
            if ((this.entities[i]).bb.intersects(aabb))
                return false;
        }
        return true;
    }

    async generateNewLevel() {
        this.setScreen(new LevelGenScreen());

        this.screen.setTitle("Generating level");

        if (this.levelRenderer) {
            for (let i = 0; i < this.levelRenderer.chunks.length; i++) {
                const chunk = this.levelRenderer.chunks[i];
                this.scene.remove(chunk.meshes[0]);
                this.scene.remove(chunk.meshes[1]);
            }
        }

        this.level = new Level(256, 32, 70);

        this.levelRenderer = new LevelRenderer(this.level, this.scene);
        this.particleEngine = new ParticleEngine(this.level, this.scene, this.level.texture);
        this.level.particleEngine = this.particleEngine;

        const generator = new LevelGen(this.screen);
        await generator.generateLevel(this.level, "Player", 256, 32, 70);

        this.player = new Player(this.level);
        this.player.level = this.level;
        this.player.resetPos();

        this.entities.forEach(e => this.scene.remove(e.group));
        this.entities = [];

        for (let i = 0; i < 10; i++) {
            const zombie = new Zombie(this.level, 128, 64, 127, this.scene);
            zombie.resetPos();
            this.entities.push(zombie);
        }

        this.render(true);

        this.setScreen(null);
    }

    tick() {
        this.level.tick();
        this.particleEngine.tick();

        this.entities.forEach(e => {
            e.tick();

            if (e.removed) {
                this.scene.remove(e.group);
                this.entities.splice(this.entities.indexOf(e), 1);
            }
        });

        if (this.leftMouseButtonDown) {
            if (!this.lastBuildTime) {
                this.lastBuildTime = performance.now();
            } else {
                const elapsed = performance.now() - this.lastBuildTime;
                if (elapsed > 200) {
                    const hit = this.levelRenderer.pick(5.0, this.camera);

                    if (hit) {
                        let x = hit.x;
                        let y = hit.y;
                        let z = hit.z;

                        if (hit.f === 0) y--;
                        if (hit.f === 1) y++;
                        if (hit.f === 2) z--;
                        if (hit.f === 3) z++;
                        if (hit.f === 4) x--;
                        if (hit.f === 5) x++;

                        const playerAABB = this.player.bb;
                        const tileAABB = new AABB(x, y, z, x + 1, y + 1, z + 1);

                        if (this.isFree(tileAABB)) {
                            this.lastBuildTime = 0;
                            this.level.setTile(x, y, z, this.paintTexture);
                        }
                    }
                }
            }
        } else {
            this.lastBuildTime = 200;
        }

        if (this.rightMouseButtonDown) {
            if (!this.lastMineTime) {
                this.lastMineTime = performance.now();
            } else {
                const elapsed = performance.now() - this.lastMineTime;
                if (elapsed > 200) {
                    const hit = this.levelRenderer.pick(5.0, this.camera);

                    if (hit) {
                        const oldTile = Tile.tiles[this.level.getTile(hit.x, hit.y, hit.z)];
                        const changed = this.level.setTile(hit.x, hit.y, hit.z, 0);
                        if (oldTile != null && changed) {
                            this.lastMineTime = 0;
                            oldTile.destroy(this.level, hit.x, hit.y, hit.z, this.particleEngine);
                        }
                    }
                }
            }
        } else {
            this.lastMineTime = 200;
        }

        this.player.tick(this.camera);
    }

    render(skippause = false) {
        this.moveCameraToPlayer();

        if (!this.pause || skippause) {
            if (this.levelRenderer) {
                const hit = this.levelRenderer.pick(5.0, this.camera);
                if (hit) {
                    this.levelRenderer.renderHit(hit, 0, 0xFFFFFF, (Math.sin(performance.now() / 110.0) * 0.2 + 0.5) / 1.7);
                }
            }

            this.levelRenderer.updateDirtyChunks(this.player)

            this.levelRenderer.render(this.player, 0);
            this.levelRenderer.render(this.player, 1);

            this.particleEngine.render(this.player, this.timer.a);

            this.entities.forEach(e => e.render(this.timer.a));

            this.levelRenderer.renderSurroundingGround();
            this.levelRenderer.renderSurroundingWater();

            this.renderer.render(this.scene, this.camera);

            if (this.levelRenderer && this.levelRenderer.selectionMesh) {
                this.levelRenderer.selectionMesh.visible = false;
            }
        }

        this.renderGUI(skippause);
    }

    moveCameraToPlayer() {
        this.camera.rotation.set(
            THREE.MathUtils.degToRad(this.player.xRot),
            THREE.MathUtils.degToRad(this.player.yRot),
            0,
            'YXZ'
        );

        const a = this.timer.a;
        const x = this.player.xo + (this.player.x - this.player.xo) * a;
        const y = this.player.yo + (this.player.y - this.player.yo) * a;
        const z = this.player.zo + (this.player.z - this.player.zo) * a;

        this.camera.position.set(x, y, z);
        this.camera.translateZ(0.3);
    }
}

const game = new Minecraft();
await game.run();