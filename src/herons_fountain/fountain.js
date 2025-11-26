import * as THREE from 'three';

export class Fountain {
    constructor(scene) {
        this.scene = scene;
        this.containers = {};
        this.pipes = {};
        this.hoses = []; // dynamic hoses between containers
        this.pendingHoseStart = null; // key of first selected container
        this.ports = { A: {}, B: {}, C: {} }; // attachment points on containers
        this.particles = [];
        // Start levels to match desired UI example: Top (A) 100%, Basin (B) 75%, Air (C) 26%
        // Note: A corresponds to basin internally, B is upper side tank (top container), C is air chamber
        this.waterLevels = { A: 0.75, B: 1.0, C: 0.26 };
        this.airPressure = 0.0;
        this.flowRate = 0.05;
        this.flowIntensity = 0.25; // 0..1 set via UI
        this.isActive = true;
        this.particleSystem = null;
        this.maxParticles = 400;
        this.streamMesh = null;
        this.streamMaterial = null;
        this.time = 0;
        this.spoutTip = null;
        // Basin ripple surface
        this.basinSurface = null;
        this.basinSurfaceMaterial = null;
        this.maxRipples = 6;
        this.activeRipples = [];
        this.sideGroup = null; // group that holds the two side containers stacked vertically
        this.isFlipping = false;
        this.flipOrientation = 0; // multiples of PI on sideGroup.rotation.z
        this.defaultPipesEnabled = false; // hide legacy horizontal pipes
        this.bowlParams = { bottomY: 3.35, height: 1.4, innerBottomR: 1.5, innerTopR: 1.5, absorbY: 3.6 };
        
        this.createContainers();
        if (this.defaultPipesEnabled) this.createPipes();
        this.createParticleSystem();
        this.createBasinWaterSurface();
        // Auto-create default hoses and nozzle so the system runs without manual steps
        this.addDefaultDiagramHoses();
        this.createGround();
    }

    createContainers() {
        const containerGeometry = new THREE.CylinderGeometry(1, 1, 2, 32);
        const glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x7fb8ff,
            transparent: true,
            opacity: 0.75,
            metalness: 0.0,
            roughness: 0.35,
            transmission: 0.0,
            thickness: 0.6
        });

        // Top container (A) - fountain basin (stays in place on the left) - HOLLOW AND OPEN TOP
        this.containers.A = new THREE.Group();
        // Create hollow fountain basin with wider top opening (fountain-like)
        const fountainOuterRadius = 1.6;
        const fountainInnerRadius = 1.4; // Hollow interior
        const fountainHeight = 1.4;
        const fountainTopRadius = 1.7; // Wider at top for fountain basin effect
        
        // Create outer wall (slightly flared at top like a fountain) - OPEN TOP, CLOSED BOTTOM
        // Extend wall height slightly to create visible edges
        const wallExtension = 0.25; // Extend walls upward to create visible edges
        const outerWallGeometry = new THREE.CylinderGeometry(
            fountainTopRadius, 
            fountainOuterRadius, 
            fountainHeight + wallExtension, // Extend upward for edges
            32
        );
        // Remove only top cap (keep side faces including extended edges, keep bottom cap)
        const outerPositions = outerWallGeometry.attributes.position.array;
        const outerIndices = outerWallGeometry.index.array;
        const newIndices = [];
        const totalHeight = fountainHeight + wallExtension;
        const topY = totalHeight / 2;
        
        for (let i = 0; i < outerIndices.length; i += 3) {
            const i0 = outerIndices[i] * 3;
            const i1 = outerIndices[i + 1] * 3;
            const i2 = outerIndices[i + 2] * 3;
            const y0 = outerPositions[i0 + 1];
            const y1 = outerPositions[i1 + 1];
            const y2 = outerPositions[i2 + 1];
            
            // Keep all side faces (including extended edges above original top)
            // Remove only the top cap face (all vertices at topY)
            const allAtTop = Math.abs(y0 - topY) < 0.01 && Math.abs(y1 - topY) < 0.01 && Math.abs(y2 - topY) < 0.01;
            if (!allAtTop) {
                newIndices.push(outerIndices[i], outerIndices[i + 1], outerIndices[i + 2]);
            }
        }
        outerWallGeometry.setIndex(newIndices);
        outerWallGeometry.computeVertexNormals();
        
        // Use DoubleSide material so walls are visible from both inside and outside
        const bowlMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x0b2e6d, 
            metalness: 0.05, 
            roughness: 0.6,
            side: THREE.DoubleSide // Make walls visible from both sides
        });
        const outerWall = new THREE.Mesh(outerWallGeometry, bowlMaterial);
        // Position centered on original basin height, so extended edges are above
        outerWall.position.y = 4;
        outerWall.castShadow = true;
        outerWall.receiveShadow = true;
        this.containers.A.add(outerWall);
        
        // Create inner wall (hollow interior) - OPEN TOP, CLOSED BOTTOM
        const innerWallGeometry = new THREE.CylinderGeometry(
            fountainTopRadius * 0.95, // Slightly smaller inner top
            fountainInnerRadius, 
            fountainHeight - 0.1 + wallExtension, // Extend upward for edges
            32
        );
        // Remove only top cap (keep side faces including extended edges)
        const innerPositions = innerWallGeometry.attributes.position.array;
        const innerIndices = innerWallGeometry.index.array;
        const newInnerIndices = [];
        const innerTotalHeight = fountainHeight - 0.1 + wallExtension;
        const innerTopY = innerTotalHeight / 2;
        
        for (let i = 0; i < innerIndices.length; i += 3) {
            const i0 = innerIndices[i] * 3;
            const i1 = innerIndices[i + 1] * 3;
            const i2 = innerIndices[i + 2] * 3;
            const y0 = innerPositions[i0 + 1];
            const y1 = innerPositions[i1 + 1];
            const y2 = innerPositions[i2 + 1];
            
            // Keep all side faces (including extended edges), remove only top cap
            const allAtTop = Math.abs(y0 - innerTopY) < 0.01 && Math.abs(y1 - innerTopY) < 0.01 && Math.abs(y2 - innerTopY) < 0.01;
            if (!allAtTop) {
                newInnerIndices.push(innerIndices[i], innerIndices[i + 1], innerIndices[i + 2]);
            }
        }
        innerWallGeometry.setIndex(newInnerIndices);
        innerWallGeometry.computeVertexNormals();
        
        // Use DoubleSide material for inner wall too
        const innerWallMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x0b2e6d, 
            metalness: 0.05, 
            roughness: 0.6,
            side: THREE.DoubleSide // Make walls visible from both sides
        });
        const innerWall = new THREE.Mesh(innerWallGeometry, innerWallMaterial);
        // Position centered on original basin height, so extended edges are above
        innerWall.position.y = 4;
        innerWall.castShadow = false;
        innerWall.receiveShadow = true;
        this.containers.A.add(innerWall);
        
        // Add solid bottom to close the bottom and prevent particles from falling through
        // Use a thick cylinder instead of just a ring for better collision
        const bottomThickness = 0.15; // Thick bottom to prevent particles falling through
        const bottomGeometry = new THREE.CylinderGeometry(
            fountainOuterRadius,
            fountainOuterRadius,
            bottomThickness,
            32
        );
        const bottomMesh = new THREE.Mesh(bottomGeometry, bowlMaterial);
        bottomMesh.position.y = 4 - fountainHeight / 2 - bottomThickness / 2;
        bottomMesh.castShadow = true;
        bottomMesh.receiveShadow = true;
        this.containers.A.add(bottomMesh);
        
        // Also add inner bottom to close the hollow interior
        const innerBottomGeometry = new THREE.CylinderGeometry(
            fountainInnerRadius,
            fountainInnerRadius,
            bottomThickness,
            32
        );
        const innerBottomMesh = new THREE.Mesh(innerBottomGeometry, bowlMaterial);
        innerBottomMesh.position.y = 4 - fountainHeight / 2 - bottomThickness / 2;
        innerBottomMesh.castShadow = true;
        innerBottomMesh.receiveShadow = true;
        this.containers.A.add(innerBottomMesh);
        
        // Extend walls upward to create edges/rims that keep water in
        // The walls already extend to the top, but we need to make sure they're visible as edges
        // The outer and inner walls already create the edges - they just need to extend high enough
        // Top is open (no cap) - water can flow in from the top, but walls keep it contained

        // Water in container A (legacy cylinder; will be hidden by ripple surface)
        const waterGeometryA = new THREE.CylinderGeometry(0.9, 0.9, 1.0, 32);
        const waterMaterialA = new THREE.MeshStandardMaterial({ color: 0x4169E1, metalness: 0.0, roughness: 0.4, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
        this.containers.A.water = new THREE.Mesh(waterGeometryA, waterMaterialA);
        this.containers.A.water.position.y = 4;
        this.containers.A.water.visible = false;
        this.containers.A.water.castShadow = true;

        // Add a solid bottom inside the bowl so it visually holds water
        const bowlBottom = new THREE.Mesh(new THREE.CylinderGeometry(this.bowlParams.innerTopR, this.bowlParams.innerTopR, 0.06, 32), new THREE.MeshPhysicalMaterial({ color: 0x202535, metalness: 0.2, roughness: 0.6, transparent: true, opacity: 0.6 }));
        bowlBottom.position.set(0, 3.35, 0);
        bowlBottom.receiveShadow = true;
        this.scene.add(bowlBottom);

        // Create a side group that stacks the two side containers vertically (to the right)
        this.sideGroup = new THREE.Group();
        this.sideGroup.position.set(3.5, 2.5, 0); // closer to bowl; becomes pivot position later
        this.scene.add(this.sideGroup);

        // Upper side container (B)
        this.containers.B = new THREE.Group();
        this.containers.B.position.set(0, 1.5, 0); // local to sideGroup
        const containerB = new THREE.Mesh(containerGeometry, glassMaterial);
        containerB.castShadow = true;
        containerB.receiveShadow = true;
        this.containers.B.add(containerB);

        // Water in container B
        const waterGeometryB = new THREE.CylinderGeometry(0.9, 0.9, 1.8, 32);
        const waterMaterialB = new THREE.MeshStandardMaterial({
            color: 0x4169E1,
            metalness: 0.0,
            roughness: 0.4,
            side: THREE.DoubleSide
        });
        this.containers.B.water = new THREE.Mesh(waterGeometryB, waterMaterialB);
        // position water so it fills from the bottom of the cylinder (local space)
        this.containers.B.water.position.set(0, -0.9 + 0.9 * this.waterLevels.B, 0);
        this.containers.B.water.castShadow = true;
        this.containers.B.add(this.containers.B.water);

        // Lower side container (C)
        this.containers.C = new THREE.Group();
        this.containers.C.position.set(0, -1.5, 0); // local to sideGroup
        const containerC = new THREE.Mesh(containerGeometry, glassMaterial);
        containerC.castShadow = true;
        containerC.receiveShadow = true;
        this.containers.C.add(containerC);

        // Water in container C
        const waterGeometryC = new THREE.CylinderGeometry(0.9, 0.9, 1.8, 32);
        const waterMaterialC = new THREE.MeshStandardMaterial({
            color: 0x4169E1,
            metalness: 0.0,
            roughness: 0.4,
            side: THREE.DoubleSide
        });
        this.containers.C.water = new THREE.Mesh(waterGeometryC, waterMaterialC);
        this.containers.C.water.position.set(0, -0.9 + 0.9 * this.waterLevels.C, 0);
        this.containers.C.water.castShadow = true;
        this.containers.C.add(this.containers.C.water);

        // Add basin A to scene directly; add B and C via the sideGroup
        this.scene.add(this.containers.A);
        this.scene.add(this.containers.A.water);
        this.sideGroup.add(this.containers.B);
        this.sideGroup.add(this.containers.C);

        // Create default attachment ports on containers for hose anchoring
        // Place ports slightly INSIDE the glass so hoses appear to enter
        this.ports.A.right = this.createPort(this.containers.A, new THREE.Vector3(0.8, 4.0, 0));
        this.ports.A.left = this.createPort(this.containers.A, new THREE.Vector3(-0.8, 4.0, 0));
        // Specialized bowl ports: nozzle at top-center, drain near bottom center
        // Raise nozzle slightly so stream is clearly visible above bowl rim
        this.ports.A.nozzle = this.createPort(this.containers.A, new THREE.Vector3(0.0, 5.2, 0));
        this.ports.A.drain = this.createPort(this.containers.A, new THREE.Vector3(0.2, 3.1, 0));

        // Visual curved swan-neck nozzle is created when default hoses (P1,P2,P3) are added

        this.ports.B.left = this.createPort(this.containers.B, new THREE.Vector3(-0.85, 0.0, 0));
        this.ports.B.right = this.createPort(this.containers.B, new THREE.Vector3(0.85, 0.0, 0));
        this.ports.B.top = this.createPort(this.containers.B, new THREE.Vector3(0.0, 0.9, 0));
        this.ports.B.bottom = this.createPort(this.containers.B, new THREE.Vector3(0.0, -0.9, 0));
        this.ports.C.left = this.createPort(this.containers.C, new THREE.Vector3(-0.85, 0.0, 0));
        this.ports.C.right = this.createPort(this.containers.C, new THREE.Vector3(0.85, 0.0, 0));
        this.ports.C.top = this.createPort(this.containers.C, new THREE.Vector3(0.0, 0.9, 0));
        this.ports.C.bottom = this.createPort(this.containers.C, new THREE.Vector3(0.0, -0.9, 0));
    }

    createPipes() {
        const pipeMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x666666,
            metalness: 0.8,
            roughness: 0.2
        });

        // Pipes (simple placeholders): from basin to upper and lower side containers
        const pipe1Geometry = new THREE.CylinderGeometry(0.1, 0.1, 5, 16);
        this.pipes.pipe1 = new THREE.Mesh(pipe1Geometry, pipeMaterial);
        // approx between basin (x≈0,y=4) and upper side container (x≈5,y≈4)
        this.pipes.pipe1.position.set(2.5, 4, 0);
        this.pipes.pipe1.rotation.z = Math.PI / 2; // horizontal
        this.pipes.pipe1.castShadow = true;

        // from basin drain height (y≈1) to lower side container (x≈5,y≈1)
        const pipe2Geometry = new THREE.CylinderGeometry(0.1, 0.1, 5, 16);
        this.pipes.pipe2 = new THREE.Mesh(pipe2Geometry, pipeMaterial);
        this.pipes.pipe2.position.set(2.5, 1, 0);
        this.pipes.pipe2.rotation.z = Math.PI / 2;
        this.pipes.pipe2.castShadow = true;

        // Add pipes to scene
        Object.values(this.pipes).forEach(pipe => {
            this.scene.add(pipe);
        });
    }

    // --- Interactive hose mechanics ---
    setFlowIntensity(value) {
        this.flowIntensity = Math.max(0, Math.min(1, value));
    }

    createPort(parentGroup, localPosition) {
        const port = new THREE.Object3D();
        port.position.copy(localPosition);
        parentGroup.add(port);
        return port;
    }

    findContainerKeyByMesh(mesh) {
        for (const key of Object.keys(this.containers)) {
            if (this.containers[key].children.includes(mesh)) return key;
        }
        return null;
    }

    handleContainerClick(containerKey) {
        if (this.pendingHoseStart === null) {
            this.pendingHoseStart = containerKey;
            return;
        }
        if (this.pendingHoseStart === containerKey) {
            // clicked same container; cancel
            this.pendingHoseStart = null;
            return;
        }
        this.addHose(this.pendingHoseStart, containerKey);
        this.pendingHoseStart = null;
    }

    removeHosesForContainer(containerKey) {
        const toRemove = this.hoses.filter(h => h.from === containerKey || h.to === containerKey);
        toRemove.forEach(h => {
            if (h.mesh && h.mesh.parent) h.mesh.parent.remove(h.mesh);
        });
        this.hoses = this.hoses.filter(h => !(h.from === containerKey || h.to === containerKey));
    }

    addHose(fromKey, toKey) {
        const curve = new THREE.CatmullRomCurve3([
            this.getContainerWorldPosition(fromKey),
            this.getMidpoint(fromKey, toKey),
            this.getContainerWorldPosition(toKey)
        ]);
        const geometry = new THREE.TubeGeometry(curve, 32, 0.08, 12, false);
        const material = new THREE.MeshPhysicalMaterial({
            color: 0x222a33,
            metalness: 0.2,
            roughness: 0.4
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        this.scene.add(mesh);
        this.hoses.push({ from: fromKey, to: toKey, curve, mesh });
    }

    addHoseCurved(fromKey, toKey, getPoints) {
        const pts = getPoints();
        const curve = new THREE.CatmullRomCurve3(pts);
        const geometry = new THREE.TubeGeometry(curve, 64, 0.08, 12, false);
        const material = new THREE.MeshPhysicalMaterial({
            color: 0x11161c,
            metalness: 0.25,
            roughness: 0.35
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        this.scene.add(mesh);
        this.hoses.push({ from: fromKey, to: toKey, curve, mesh, getPoints });
    }

    addFreeformHoseWithPoints(fromKey, toKey, worldPoints) {
        // Choose attachment ports based on relative positions so ends don't overlap
        const startObj = this.chooseDefaultPort(fromKey, toKey);
        const endObj = this.chooseDefaultPort(toKey, fromKey);
        // Mid control: place an invisible guide roughly along the drawn path
        const midObj = new THREE.Object3D();
        if (worldPoints && worldPoints.length) {
            const midIndex = Math.floor(worldPoints.length / 2);
            midObj.position.copy(worldPoints[midIndex]);
        } else {
            // fallback midpoint between containers
            const a = this.getContainerWorldPosition(fromKey);
            const b = this.getContainerWorldPosition(toKey);
            midObj.position.set((a.x + b.x) / 2, Math.max(a.y, b.y) + 0.2, 0);
        }
        this.scene.add(midObj);

        // Build mesh and store hose record
        const material = new THREE.MeshPhysicalMaterial({ color: 0x11161c, metalness: 0.25, roughness: 0.35 });
        const dummyCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]);
        const mesh = new THREE.Mesh(new THREE.TubeGeometry(dummyCurve, 64, 0.08, 12, false), material);
        mesh.castShadow = true;
        this.scene.add(mesh);
        const hose = { from: fromKey, to: toKey, mesh, startObj, endObj, midObj };
        this.hoses.push(hose);
        this.rebuildTubeForHose(hose);
    }

    getContainerWorldPosition(key) {
        const group = this.containers[key];
        const worldPos = new THREE.Vector3();
        group.updateMatrixWorld();
        group.getWorldPosition(worldPos);
        // place hose entry at cylinder side near center vertically for A and at local center for B/C
        if (key === 'A') worldPos.y = 4; // basin height
        return worldPos;
    }

    getContainerAttachmentPoint(key, angleRadians = 0, heightOffset = 0) {
        // Returns a point slightly outside the cylinder at the given polar angle around it
        const base = this.getContainerWorldPosition(key);
        const radius = 1.1; // just outside glass
        const offset = new THREE.Vector3(Math.cos(angleRadians) * radius, 0, Math.sin(angleRadians) * radius);
        base.add(offset);
        base.y += heightOffset;
        return base;
    }

    getMidpoint(aKey, bKey) {
        const a = this.getContainerWorldPosition(aKey);
        const b = this.getContainerWorldPosition(bKey);
        return new THREE.Vector3((a.x + b.x) / 2, Math.max(a.y, b.y) + 0.5, (a.z + b.z) / 2);
    }

    addDiagramHoses() {
        // Hose 1: A -> B (gentle slope to upper right container)
        this.addHoseCurved('A', 'B', () => {
            const start = this.getContainerAttachmentPoint('A', 0, 0.1); // right side of basin
            const end = this.getContainerAttachmentPoint('B', Math.PI, 0.4); // left side of upper container
            const mid = new THREE.Vector3((start.x + end.x) / 2, start.y - 0.4, 0);
            return [start, mid, end];
        });

        // Hose 2: A -> C (swooping arc over and down to the lower container)
        this.addHoseCurved('A', 'C', () => {
            const start = this.getContainerAttachmentPoint('A', 0.1, 0.15); // slightly up and to right
            const end = this.getContainerAttachmentPoint('C', Math.PI, 0.3); // left side of lower container
            const apexX = this.sideGroup ? this.sideGroup.position.x - 0.2 : (start.x + end.x) / 2;
            const apexY = Math.max(start.y, this.getContainerWorldPosition('B').y + 0.6);
            const mid = new THREE.Vector3(apexX, apexY, 0);
            return [start, mid, end];
        });

        // Hose 3: B -> C (vertical drop along the right side)
        this.addHoseCurved('B', 'C', () => {
            const bRight = this.getContainerAttachmentPoint('B', 0, 0.2); // right side of upper
            const cRight = this.getContainerAttachmentPoint('C', 0, 0.2); // right side of lower
            // Add a guide point to produce a mostly vertical path
            const guideX = (this.sideGroup ? this.sideGroup.position.x : bRight.x) + 0.6;
            const p1 = new THREE.Vector3(guideX, bRight.y, 0);
            const p2 = new THREE.Vector3(guideX, cRight.y, 0);
            return [bRight, p1, p2, cRight];
        });
    }

    createParticleSystem() {
        // Create particle system for fountain spout that drops back into basin A
        const particleCount = this.maxParticles;
        const particleGeometry = new THREE.SphereGeometry(0.06, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: 0x66aaff,
            transparent: true,
            opacity: 0.85,
            depthWrite: false
        });
        particleMaterial.blending = THREE.AdditiveBlending;

        this.particleSystem = new THREE.Group();

        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.visible = false;
            this.particleSystem.add(particle);
            this.particles.push({
                mesh: particle,
                velocity: new THREE.Vector3(),
                life: 0,
                maxLife: 2 + Math.random() * 2
            });
        }

        this.scene.add(this.particleSystem);

        // Create a ribbon-like stream (thin tube) we can morph per frame for continuous flow
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0,0,0),
            new THREE.Vector3(0,-0.5,0),
            new THREE.Vector3(0,-1.0,0)
        ]);
        const tubeGeo = new THREE.TubeGeometry(curve, 16, 0.05, 8, false);
        this.streamMaterial = this.createStreamShaderMaterial();
        this.streamMesh = new THREE.Mesh(tubeGeo, this.streamMaterial);
        this.streamMesh.visible = false;
        this.scene.add(this.streamMesh);
    }

    createBasinWaterSurface() {
        // Simple ripple surface for basin using ShaderMaterial
        // Keep slightly inside the cylindrical bowl inner radius to avoid protruding through glass
        const radiusTop = Math.max(0.1, this.bowlParams.innerTopR - 0.05);
        const geom = new THREE.CircleGeometry(radiusTop, 64);
        const uniforms = {
            uTime: { value: 0 },
            uColorDeep: { value: new THREE.Color(0x264a9b) },
            uColorShallow: { value: new THREE.Color(0x5aa8ff) },
            uOpacity: { value: 0.9 },
            uRipples: { value: Array(this.maxRipples).fill(0).map(()=> new THREE.Vector3(0,0,-1000)) }, // x,y,timeStart
            uRippleCount: { value: 0 },
            uAbsorbY: { value: this.bowlParams.absorbY }
        };
        const vertex = `
            varying vec2 vUv;
            void main(){
              vUv = uv*2.0-1.0; // map to [-1,1]
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
            }
        `;
        const fragment = `
            varying vec2 vUv;
            uniform float uTime;
            uniform vec3 uColorDeep;
            uniform vec3 uColorShallow;
            uniform float uOpacity;
            uniform vec3 uRipples[${Math.max(1,this.maxRipples)}];
            uniform int uRippleCount;
            float ripple(vec2 p, vec2 c, float t0){
              float t = max(0.0, uTime - t0);
              float d = length(p - c);
              // expanding ring with damping
              float w = 20.0;
              float s = sin(d*w - t*6.0);
              float envelope = exp(-2.0*d) * exp(-1.5*t);
              return s * envelope * 0.15;
            }
            void main(){
              vec2 p = vUv;
              float h = 0.0;
              for(int i=0;i<${Math.max(1,this.maxRipples)};i++){
                if(i < uRippleCount){
                  h += ripple(p, uRipples[i].xy, uRipples[i].z);
                }
              }
              float m = clamp(h*0.5 + 0.5, 0.0, 1.0);
              vec3 col = mix(uColorDeep, uColorShallow, m);
              // Soft edge fade to ensure surface never visually bleeds through the bowl rim
              float rim = length(p);
              float edgeFade = smoothstep(0.9, 1.0, rim);
              float alpha = uOpacity * (1.0 - edgeFade);
              gl_FragColor = vec4(col, alpha);
            }
        `;
        this.basinSurfaceMaterial = new THREE.ShaderMaterial({ uniforms, vertexShader: vertex, fragmentShader: fragment, transparent: true, depthWrite: true, depthTest: true });
        const mesh = new THREE.Mesh(geom, this.basinSurfaceMaterial);
        mesh.rotation.x = -Math.PI/2;
        mesh.position.set(0, this.bowlParams.absorbY + 0.005, 0);
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        this.basinSurface = mesh;
    }

    createStreamShaderMaterial() {
        const uniforms = {
            uTime: { value: 0 },
            uColorTop: { value: new THREE.Color(0x9fd0ff) },
            uColorBottom: { value: new THREE.Color(0x5aa8ff) },
            uOpacity: { value: 0.7 }
        };
        const vertex = `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              // slight wobble to mimic surface tension
              vec3 pos = position;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `;
        const fragment = `
            varying vec2 vUv;
            uniform float uTime;
            uniform vec3 uColorTop;
            uniform vec3 uColorBottom;
            uniform float uOpacity;
            // simple noise
            float hash(float n){ return fract(sin(n)*43758.5453123); }
            float noise(vec2 x){
              vec2 p = floor(x);
              vec2 f = fract(x);
              f = f*f*(3.0-2.0*f);
              float n = p.x + p.y*57.0;
              float res = mix(mix(hash(n+0.0), hash(n+1.0), f.x), mix(hash(n+57.0), hash(n+58.0), f.x), f.y);
              return res;
            }
            void main(){
              // vertical gradient and animated ripples
              float t = uTime*2.0;
              float ripple = noise(vec2(vUv.x*20.0, vUv.y*40.0 - t))*0.25;
              float fade = smoothstep(0.0, 0.1, vUv.y) * (1.0 - smoothstep(0.8, 1.0, vUv.y));
              vec3 col = mix(uColorTop, uColorBottom, vUv.y + ripple*0.2);
              float alpha = uOpacity * fade * (0.8 + ripple*0.2);
              gl_FragColor = vec4(col, alpha);
            }
        `;
        return new THREE.ShaderMaterial({ uniforms, vertexShader: vertex, fragmentShader: fragment, transparent: true, depthWrite: false });
    }

    createSwanNeckNozzle() {
        // Remove prior nozzle visual if any
        if (this.nozzleMesh && this.nozzleMesh.parent) this.nozzleMesh.parent.remove(this.nozzleMesh);

        // Control points: start inside bowl center, curve up and forward, then down
        // Rotate 90° around Y so the neck curves across the bowl center and pours inward
        const start = new THREE.Vector3(0.0, 4.95, 0); // near rim inside
        const arch = new THREE.Vector3(0.25, 5.4, 0.0); // higher arch
        const tip = new THREE.Vector3(0.05, 5.25, 0.0); // raised tip
        const curve = new THREE.CatmullRomCurve3([start, arch, tip]);
        const geom = new THREE.TubeGeometry(curve, 24, 0.05, 10, false);
        const mat = new THREE.MeshPhysicalMaterial({ color: 0x11161c, metalness: 0.3, roughness: 0.4 });
        const mesh = new THREE.Mesh(geom, mat);
        this.containers.A.add(mesh);
        this.nozzleMesh = mesh;

        // Spout tip located at end of curve; emit downward
        const tipObj = new THREE.Object3D();
        tipObj.position.copy(tip);
        tipObj.userData = { direction: new THREE.Vector3(0, -1, 0) };
        this.containers.A.add(tipObj);
        this.spoutTip = tipObj;
    }

    createGround() {
        const groundGeometry = new THREE.PlaneGeometry(20, 20);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -4;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }

    update(deltaTime) {
        if (!this.isActive) return;

        // Update water flow
        this.updateWaterFlow(deltaTime);
        
        // Update air pressure
        this.updateAirPressure();
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // Update container water levels
        this.updateWaterLevels();

        // Auto-flip when the upper fills or the lower empties
        this.checkAutoFlip();

        // Update hose geometry (elastic effect toward current endpoints)
        this.updateHoses();

        // Advance stream shader time
        if (this.streamMaterial) {
            this.time += deltaTime;
            this.streamMaterial.uniforms.uTime.value = this.time;
        }
        // Advance basin ripple time and decay old ripples
        if (this.basinSurfaceMaterial) {
            this.basinSurfaceMaterial.uniforms.uTime.value = this.time;
            // Cull ripples older than 4s
            const now = this.time;
            this.activeRipples = this.activeRipples.filter(r => now - r.startTime < 4);
            const ripples = this.basinSurfaceMaterial.uniforms.uRipples.value;
            for (let i = 0; i < this.maxRipples; i++) {
                if (i < this.activeRipples.length) {
                    ripples[i].set(this.activeRipples[i].center.x, this.activeRipples[i].center.y, this.activeRipples[i].startTime);
                } else {
                    ripples[i].set(0, 0, -1000);
                }
            }
            this.basinSurfaceMaterial.uniforms.uRippleCount.value = this.activeRipples.length;
        }
    }

    updateWaterFlow(deltaTime) {
        // 1) P1: Basin A drains down to bottom of C only if that hose exists
        const hasDrain = this.hoses.some(h => h.from === 'A' && h.startObj === this.ports.A.drain && h.to === 'C' && h.endObj === this.ports.C.bottom);
        if (hasDrain) {
            const drainAmount = 0.6 * this.flowRate * this.flowIntensity * deltaTime;
            // A's visual level is fixed; assume equivalent volume leaves B to C to conserve mass
            const actualDrain = Math.min(drainAmount, this.waterLevels.B, 1 - this.waterLevels.C);
            this.waterLevels.B -= actualDrain;
            this.waterLevels.C += actualDrain;
        }

        // 2) P3: Pressurized air in C forces water from bottom of B up to A via riser
        const hasRiser = this.hoses.some(h => h.from === 'B' && h.startObj === this.ports.B.bottom && h.to === 'A' && h.endObj === this.ports.A.nozzle);
        if (hasRiser && this.airPressure > 0.05 && this.waterLevels.B > 0) {
            // Pressure-driven flow through hollow riser (B.bottom -> A.nozzle)
            const pressureFlow = (this.flowRate * 1.25) * this.flowIntensity * this.airPressure * deltaTime;
            const actualFlow = Math.min(pressureFlow, this.waterLevels.B);
            this.waterLevels.B -= actualFlow;
            // Do not raise A's visual slab; just emit particles to indicate inflow

            // Visual fountain particles when jetting into basin
            if (actualFlow > 0) this.createFountainParticles();
        }

        // 3) P2: Air transfer from top of C to top of B if hose exists (affects pressure only)
        const hasAirLine = this.hoses.some(h => h.from === 'C' && h.startObj === this.ports.C.top && h.to === 'B' && h.endObj === this.ports.B.top);
        this.airLineConnected = hasAirLine;

        // 4) Custom hoses (user-created only): move water along from->to.
        // Strengthen gravity effect by boosting base hose flow slightly
        const baseRate = 0.9 * this.flowRate * this.flowIntensity * deltaTime;
        this.hoses.forEach(h => {
            const isBottomPickup = (h.startObj === this.ports.B.bottom || h.startObj === this.ports.C.bottom);
            const hoseRate = isBottomPickup ? baseRate * 1.6 : baseRate;
            const from = h.from;
            const to = h.to;
            // Prevent water from flowing through the air line P2 (C.top -> B.top)
            if (h.startObj === this.ports.C.top && h.endObj === this.ports.B.top) {
                return; // air-only path
            }
            const available = this.waterLevels[from];
            const capacity = 1 - this.waterLevels[to];
            const moved = Math.max(0, Math.min(hoseRate, available, capacity));
            if (moved > 0) {
                this.waterLevels[from] -= moved;
                this.waterLevels[to] += moved;
            }
        });
        // Do not set isActive to false here; auto-flip will keep the system cycling
    }

    updateAirPressure() {
        // Pressure only builds if the air line P2 is present and both B and C are sealed
        const sealFactor = this.airLineConnected ? 1 : 0.2; // if no air line, weak coupling
        const heightHead = Math.max(0, this.waterLevels.C - this.waterLevels.B); // proxy for head difference
        // Add contribution from A→C drain rate to simulate momentum of inflow into C
        const inflowFactor = Math.min(1, (1 - this.waterLevels.A) + this.waterLevels.C);
        this.airPressure = Math.max(0, Math.min(1, sealFactor * (heightHead * 2.0 + 0.5 * inflowFactor)));
    }

    updateHoses() {
        // Rebuild tube geometry from anchored objects so hoses follow container motion and rotation
        this.hoses.forEach(h => this.rebuildTubeForHose(h));
        // Keep sideGroup anchored under pivot to minimize stretch
        if (this.sidePivot && this.sideGroup) {
            this.sideGroup.position.set(5, 2.5, 0);
        }
    }

    rebuildTubeForHose(hose) {
        // Get world endpoints
        const s = hose.startObj.getWorldPosition(new THREE.Vector3());
        const e = hose.endObj.getWorldPosition(new THREE.Vector3());
        // Nudge endpoints slightly inward along Y for bottom/ top ports to ensure sealing
        if (hose.startObj === this.ports.C.bottom || hose.startObj === this.ports.B.bottom) s.y += 0.03;
        if (hose.endObj === this.ports.C.bottom || hose.endObj === this.ports.B.bottom) e.y += 0.03;
        if (hose.startObj === this.ports.C.top || hose.startObj === this.ports.B.top) s.y -= 0.03;
        if (hose.endObj === this.ports.C.top || hose.endObj === this.ports.B.top) e.y -= 0.03;
        // sag proportional to length
        const length = s.distanceTo(e);
        const mid = hose.midObj.getWorldPosition(new THREE.Vector3());
        const sag = Math.min(0.15, 0.05 + length * 0.02);
        mid.y -= sag;
        const curve = new THREE.CatmullRomCurve3([s, mid, e], false, 'catmullrom', 0.1);
        const newGeo = new THREE.TubeGeometry(curve, 60, 0.08, 12, false);
        hose.mesh.geometry.dispose();
        hose.mesh.geometry = newGeo;
        hose.curve = curve;
    }

    chooseDefaultPort(fromKey, toKey) {
        const fromPos = this.getContainerWorldPosition(fromKey);
        const toPos = this.getContainerWorldPosition(toKey);
        const side = toPos.x >= fromPos.x ? 'right' : 'left';
        const ports = this.ports[fromKey];
        return ports[side] || Object.values(ports)[0];
    }

    // Create the three default hoses per the diagram and description
    addDefaultDiagramHoses() {
        // Clear existing hoses to avoid duplicates
        this.hoses.forEach(h => { if (h.mesh && h.mesh.parent) h.mesh.parent.remove(h.mesh); });
        this.hoses = [];

        // 1) P1 – Water line: bowl drain down to bottom of receiver (C)
        // This hose is fixed relative to the bowl (A) and does not rotate with side containers
        const start1 = this.ports.A.drain; // inside drain point of bowl
        const end1 = this.ports.C.bottom;  // bottom of lower tank to water-seal the air in C
        const mid1 = new THREE.Object3D();
        const aPos = start1.getWorldPosition(new THREE.Vector3());
        const cPos = end1.getWorldPosition(new THREE.Vector3());
        mid1.position.set((aPos.x + cPos.x) / 2, Math.max(aPos.y, cPos.y + 0.8), 0);
        this.scene.add(mid1);
        this.hoses.push(this.createAnchoredHose('A', 'C', start1, mid1, end1));

        // 2) P2 – Air line: from top of C to top of B
        const start2 = this.ports.C.top;    // top of receiver tank C
        const end2 = this.ports.B.top;      // top of donor tank B
        const mid2 = new THREE.Object3D();
        const cR = start2.getWorldPosition(new THREE.Vector3());
        const bR = end2.getWorldPosition(new THREE.Vector3());
        const guideX = Math.max(cR.x, bR.x) + 0.4;
        mid2.position.set(guideX, (cR.y + bR.y) / 2, 0);
        this.scene.add(mid2);
        this.hoses.push(this.createAnchoredHose('C', 'B', start2, mid2, end2));

        // 3) P3 – Water riser: this hose is mounted to B and the bowl; it rotates with side containers
        const start3 = this.ports.B.bottom;  // pick up from bottom of donor tank
        const end3 = this.ports.A.nozzle;    // nozzle point in bowl
        const mid3 = new THREE.Object3D();
        const bL = start3.getWorldPosition(new THREE.Vector3());
        const aL = end3.getWorldPosition(new THREE.Vector3());
        mid3.position.set((bL.x + aL.x) / 2, Math.max(bL.y, aL.y) + 0.6, 0);
        // Parent this guide to the pivot so it follows rotation, while endpoints remain anchored
        if (this.sidePivot) this.sidePivot.add(mid3); else this.scene.add(mid3);
        this.hoses.push(this.createAnchoredHose('B', 'A', start3, mid3, end3));

        // Create the visual swan-neck nozzle only when P3 exists
        this.createSwanNeckNozzle();
    }

    createAnchoredHose(fromKey, toKey, startObj, midObj, endObj) {
        const material = new THREE.MeshPhysicalMaterial({ color: 0x11161c, metalness: 0.25, roughness: 0.35 });
        const dummyCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]);
        const mesh = new THREE.Mesh(new THREE.TubeGeometry(dummyCurve, 60, 0.08, 12, false), material);
        mesh.castShadow = true;
        this.scene.add(mesh);
        const hose = { from: fromKey, to: toKey, mesh, startObj, midObj, endObj };
        this.rebuildTubeForHose(hose);
        return hose;
    }

    updateWaterLevels() {
        // Update water mesh heights and positions
        const waterA = this.containers.A.water;
        const waterB = this.containers.B.water;
        const waterC = this.containers.C.water;

        // Fountain basin water level - use actual waterLevels.A (75%)
        // Update basin surface position based on water level
        const waterLevelA = Math.max(0, Math.min(1, this.waterLevels.A));
        const baseScale = waterLevelA; // Use actual water level (0.75 = 75%)
        const pulse = 0.02 * this.airPressure;
        waterA.scale.y = baseScale + pulse;
        // Position water surface at the correct height based on water level
        // Use bowlParams for consistent positioning
        const basinBottomY = this.bowlParams.bottomY;
        const basinHeight = this.bowlParams.height;
        const basinTopY = basinBottomY + basinHeight;
        const waterSurfaceY = basinBottomY + basinHeight * waterLevelA;
        waterA.position.y = waterSurfaceY;
        
        // Update basin surface shader position to match water level
        if (this.basinSurface) {
            const surfaceY = basinBottomY + basinHeight * waterLevelA;
            this.basinSurface.position.y = surfaceY + 0.005; // Slightly above to avoid z-fighting
        }
        
        // Update absorbY to match current water level for particle absorption
        this.bowlParams.absorbY = waterSurfaceY;

        // Container B water level – clamp and ensure it fills from the bottom
        this.waterLevels.B = Math.max(0, Math.min(1, this.waterLevels.B));
        waterB.scale.y = this.waterLevels.B;
        waterB.position.y = -0.9 + 0.9 * this.waterLevels.B;

        // Container C water level – clamp and ensure it fills from the bottom
        this.waterLevels.C = Math.max(0, Math.min(1, this.waterLevels.C));
        waterC.scale.y = this.waterLevels.C;
        waterC.position.y = -0.9 + 0.9 * this.waterLevels.C;
    }

    createFountainParticles() {
        // Create particles for fountain effect: jet height scales with head and air pressure
        // If nozzle not present (Add Hoses not pressed), do nothing
        if (!this.spoutTip) return;
        // Only produce stream when P2 and P3 are active and pressure is non-trivial
        if (!this.airLineConnected) return;
        if (this.airPressure <= 0.05) return;
        const fountainHeight = 1.6 + this.airPressure * 4.2; // strong downward stream with pressure
        const particleCount = Math.max(25, Math.floor((0.5 + this.flowIntensity) * this.airPressure * 120));

        for (let i = 0; i < particleCount; i++) {
            const availableParticle = this.particles.find(p => !p.mesh.visible);
            if (availableParticle) {
                availableParticle.mesh.visible = true;
                // Emit from the spoutTip pointing strictly downward
                const tip = this.spoutTip.getWorldPosition(new THREE.Vector3());
                const dir = new THREE.Vector3(0, -1, 0);
                // Bias spawn further toward bowl center and reduce lateral jitter to avoid any droplets near or outside the rim
                const bowlCenter = new THREE.Vector3(0, this.bowlParams.absorbY, 0);
                const spawn = tip.clone().lerp(bowlCenter, 0.22);
                availableParticle.mesh.position.copy(spawn).add(new THREE.Vector3((Math.random()-0.5)*0.01, 0, (Math.random()-0.5)*0.01));
                const tangentJitter = new THREE.Vector3((Math.random()-0.5)*0.02, (Math.random()-0.5)*0.04, (Math.random()-0.5)*0.02);
                const initialVel = dir.clone().multiplyScalar(fountainHeight * (1.0 + Math.random()*0.3)).add(tangentJitter);
                availableParticle.velocity.copy(initialVel);
                availableParticle.life = 0;
                availableParticle.maxLife = 0.9 + Math.random() * 0.8;
            }
        }
    }

    updateParticles(deltaTime) {
        this.particles.forEach(particle => {
            if (particle.mesh.visible) {
                // Update position
                particle.mesh.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
                
                // Apply gravity
                particle.velocity.y -= 9.8 * deltaTime;
                
                // Update life
                particle.life += deltaTime;
                
                // Fade out
                const lifeRatio = particle.life / particle.maxLife;
                particle.mesh.material.opacity = 0.7 * (1 - lifeRatio);

                // Absorb into bowl if particle crosses bowl plane and falls within bowl radius
                const p = particle.mesh.position;
                const withinRadius = (p.x*p.x + p.z*p.z) <= (this.bowlParams.innerTopR * this.bowlParams.innerTopR);
                
                // Prevent particles from falling through the bottom - use actual bottom position
                const basinBottomY = this.bowlParams.bottomY;
                const bottomCollisionY = basinBottomY - 0.2; // Account for bottom thickness + margin
                if (p.y <= bottomCollisionY && withinRadius) {
                    // Particle hit the bottom - stop it and make it invisible
                    particle.mesh.visible = false;
                    particle.velocity.set(0, 0, 0);
                    return;
                }
                
                // Hard cull any particle that drifts outside a slightly expanded boundary near the basin to ensure no droplets appear outside top container visually
                const outsideCullRadius = (this.bowlParams.innerTopR + 0.15) * (this.bowlParams.innerTopR + 0.15);
                if ((p.x*p.x + p.z*p.z) > outsideCullRadius && p.y <= (this.bowlParams.absorbY + 0.2)) {
                    particle.mesh.visible = false;
                    return;
                }
                
                // Absorb particles that hit the water surface
                if (p.y <= this.bowlParams.absorbY && withinRadius) {
                    // Trigger a small splash burst
                    this.spawnSplash(p.clone());
                    // Add a ripple at impact point projected into basin surface UV space
                    if (this.basinSurfaceMaterial) {
                        // Map world x,z to surface [-1,1] based on innerTopR radius
                        const uvx = THREE.MathUtils.clamp(p.x / this.bowlParams.innerTopR, -1, 1);
                        const uvy = THREE.MathUtils.clamp(p.z / this.bowlParams.innerTopR, -1, 1);
                        this.activeRipples.unshift({ center: new THREE.Vector2(uvx, uvy), startTime: this.time, strength: 1 });
                        if (this.activeRipples.length > this.maxRipples) this.activeRipples.pop();
                    }
                    particle.mesh.visible = false;
                }
                
                // Hide when life expires
                if (particle.life >= particle.maxLife) {
                    particle.mesh.visible = false;
                }
            }
        });
    }

    spawnSplash(position) {
        const count = 6 + Math.floor(Math.random()*6);
        for (let i = 0; i < count; i++) {
            const p = this.particles.find(pp => !pp.mesh.visible);
            if (!p) return;
            p.mesh.visible = true;
            p.mesh.position.copy(position.clone().add(new THREE.Vector3((Math.random()-0.5)*0.2, 0.02, (Math.random()-0.5)*0.2)));
            const angle = Math.random()*Math.PI*2;
            const speed = 0.8 + Math.random()*0.6;
            p.velocity.set(Math.cos(angle)*0.3, speed, Math.sin(angle)*0.3);
            p.life = 0;
            p.maxLife = 0.3 + Math.random()*0.4;
        }
    }

    flipSystem() {
        if (this.isFlipping) return;

        // Swap the side container levels (simulate physical flip)
        const tempLevel = this.waterLevels.B;
        this.waterLevels.B = this.waterLevels.C;
        this.waterLevels.C = tempLevel;
        
        // Reset air pressure and reactivate
        this.airPressure = 0;
        this.isActive = true;
        
        // Animate the flip of the side group
        this.animateFlip();
    }

    animateFlip() {
        if (!this.sideGroup) return;

        this.isFlipping = true;
        const duration = 1000; // ms
        const start = performance.now();
        // Rotate around a custom pivot to avoid hose stretch: wrap sideGroup in a pivot group
        if (!this.sidePivot) {
            this.sidePivot = new THREE.Group();
            this.sidePivot.position.copy(this.sideGroup.position.clone());
            this.scene.add(this.sidePivot);
            this.sideGroup.position.set(0, 0, 0);
            this.sidePivot.add(this.sideGroup);
        } else {
            // keep pivot aligned with desired anchor near bowl
            this.sidePivot.position.set(3.5, 2.5, 0);
        }
        // Rotate around X (along the hose direction) so the pair flips side-to-side parallel to the fountain
        const startRotation = this.sidePivot.rotation.x;
        const endRotation = startRotation + Math.PI; // swap top/bottom parallel to bowl pipe

        const step = (now) => {
            const t = Math.min((now - start) / duration, 1);
            // ease in/out
            const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            this.sidePivot.rotation.x = startRotation + (endRotation - startRotation) * eased;
            if (t < 1) {
                requestAnimationFrame(step);
            } else {
                this.sidePivot.rotation.x = endRotation;
                this.isFlipping = false;
            }
        };

        requestAnimationFrame(step);
    }

    checkAutoFlip() {
        if (this.isFlipping) return;
        // Rotate when the receiving (lower) container is nearly full
        const lowerFull = this.waterLevels.C >= 0.98;
        const upperEmpty = this.waterLevels.B <= 0.02;
        if (lowerFull || upperEmpty) {
            this.flipSystem();
        }
    }

    resetSystem() {
        // Reset all water levels (Top A 100%, Basin B 75%, Air C 26% in UI terms)
        // Internal mapping: A=bowl (UI B), B=top container (UI A), C=air chamber (UI C)
        this.waterLevels = { A: 0.75, B: 1.0, C: 0.26 };
        this.airPressure = 0;
        this.isActive = true;
        
        // Reset rotations
        if (this.sidePivot) {
            this.sidePivot.rotation.set(0, 0, 0);
        }
        Object.values(this.containers).forEach(container => {
            container.rotation.set(0, 0, 0);
        });
        this.isFlipping = false;
        // Remove all user hoses upon reset
        this.hoses.forEach(h => { if (h.mesh && h.mesh.parent) h.mesh.parent.remove(h.mesh); });
        this.hoses = [];
    }

    getStatus() {
        // Map to UI labels: Top Container (A) is internal B; Fountain Basin (B) is internal A; Air Chamber (C) is internal C
        return {
            containerA: Math.round(this.waterLevels.B * 100),
            containerB: Math.round(this.waterLevels.A * 100),
            containerC: Math.round(this.waterLevels.C * 100),
            pressure: Math.round(this.airPressure * 100),
            isActive: this.isActive
        };
    }
} 