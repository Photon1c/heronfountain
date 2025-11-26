import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Fountain } from './fountain.js';
import { UI } from './ui.js';
import { Reset } from './reset.js';

class HeronsFountain {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.fountain = null;
        this.ui = null;
        this.reset = null;
        this.isPaused = false;
        this.clock = new THREE.Clock();
        
        this.init();
        this.setupEventListeners();
        this.animate();
    }

    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(1.084, 17.044, -9.549);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        const container = document.getElementById('canvas-container');
        container.appendChild(this.renderer.domElement);

        // Setup controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxDistance = 50;
        this.controls.minDistance = 2;
        this.controls.target.set(2.444, 2.047, -0.717);
        
        // Configure mouse buttons: Left = Rotate, Right = Pan, Middle = Zoom
        this.controls.mouseButtons = {
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN
        };

        // Setup lighting
        this.setupLighting();

        // Create fountain
        this.fountain = new Fountain(this.scene);
        
        // Create UI
        this.ui = new UI();
        
        // Create reset system
        this.reset = new Reset(this.fountain, this.ui);

        // Forward initial flow intensity from slider
        const slider = document.getElementById('flowSlider');
        const flowValue = document.getElementById('flowValue');
        if (slider && flowValue) {
            const setFlow = () => {
                const value = Number(slider.value) / 100; // 0..1
                flowValue.textContent = `${slider.value}%`;
                this.fountain.setFlowIntensity(value);
            };
            slider.addEventListener('input', setFlow);
            setFlow();
        }
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x3a4a5a, 0.6);
        this.scene.add(ambientLight);

        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(8, 12, 6);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -10;
        directionalLight.shadow.camera.right = 10;
        directionalLight.shadow.camera.top = 10;
        directionalLight.shadow.camera.bottom = -10;
        this.scene.add(directionalLight);

        // Overhead point light to illuminate the basin and stream
        const bulb = new THREE.PointLight(0xfff8d6, 1.0, 30, 2.0);
        bulb.position.set(0, 8, 0);
        bulb.castShadow = true;
        bulb.shadow.mapSize.set(1024, 1024);
        this.scene.add(bulb);
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Keyboard controls
        document.addEventListener('keydown', (event) => {
            switch(event.code) {
                case 'KeyR':
                    this.reset.flipSystem();
                    break;
                case 'Slash':
                case 'QuestionMark':
                case 'KeyI':
                    this.ui.toggleAbout();
                    break;
                case 'Space':
                    event.preventDefault();
                    this.togglePause();
                    break;
                case 'Backslash':
                    // Dev feature: Print camera position and controls target
                    this.printCameraPosition();
                    break;
            }
        });

        // Remove manual hose drawing/interaction for simplified UX

        // Right-click: remove hoses connected to a container (only if clicking on a container)
        // Only handle if clicking on the canvas, not on other elements (like dev tools)
        this.renderer.domElement.addEventListener('contextmenu', (event) => {
            // Only process if the event target is the canvas itself
            if (event.target !== this.renderer.domElement) {
                return;
            }
            const hits = getIntersections(event);
            if (hits.length) {
                event.preventDefault(); // Only prevent default if we hit something
                const mesh = hits[0].object;
                const containerKey = this.fountain.findContainerKeyByMesh(mesh);
                if (containerKey) {
                    this.fountain.removeHosesForContainer(containerKey);
                }
            }
            // If no hits, allow OrbitControls to handle right-click panning
        });

        // UI button controls
        document.getElementById('flipBtn').addEventListener('click', () => {
            this.reset.flipSystem();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.reset.resetSystem();
        });

        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.togglePause();
        });

        // Add hoses button removed; hoses are created by default inside Fountain
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pauseBtn');
        pauseBtn.textContent = this.isPaused ? '▶️ Resume' : '⏸️ Pause';
    }

    printCameraPosition() {
        if (!this.camera || !this.controls) {
            console.log('❌ Camera or controls not initialized');
            return;
        }
        
        const pos = this.camera.position;
        const target = this.controls.target;
        const rotation = this.camera.rotation;
        
        console.log('═══════════════════════════════════════');
        console.log('📷 CAMERA POSITION (Dev Mode)');
        console.log('═══════════════════════════════════════');
        console.log(`Camera Position:`);
        console.log(`  x: ${pos.x.toFixed(3)}`);
        console.log(`  y: ${pos.y.toFixed(3)}`);
        console.log(`  z: ${pos.z.toFixed(3)}`);
        console.log(`  camera.position.set(${pos.x.toFixed(3)}, ${pos.y.toFixed(3)}, ${pos.z.toFixed(3)});`);
        console.log('');
        console.log(`Controls Target:`);
        console.log(`  x: ${target.x.toFixed(3)}`);
        console.log(`  y: ${target.y.toFixed(3)}`);
        console.log(`  z: ${target.z.toFixed(3)}`);
        console.log(`  controls.target.set(${target.x.toFixed(3)}, ${target.y.toFixed(3)}, ${target.z.toFixed(3)});`);
        console.log('');
        console.log(`Camera Rotation:`);
        console.log(`  x: ${rotation.x.toFixed(3)}`);
        console.log(`  y: ${rotation.y.toFixed(3)}`);
        console.log(`  z: ${rotation.z.toFixed(3)}`);
        console.log('');
        console.log(`Distance to target: ${pos.distanceTo(target).toFixed(3)}`);
        console.log('═══════════════════════════════════════');
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (!this.isPaused) {
            const deltaTime = this.clock.getDelta();
            
            // Update fountain
            this.fountain.update(deltaTime);
            
            // Update UI
            this.ui.update(this.fountain.getStatus());
        }

        // Update controls
        this.controls.update();

        // Render
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the application
new HeronsFountain(); 