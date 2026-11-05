import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

let camera, scene, renderer, controls, raycaster;
const objects = []; 
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

init();
animate();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Bright daytime sky blue
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.015); // Soft atmospheric fog

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.y = 2; // Eye level

    // Lighting (Sunlight & Ambient light)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    sunLight.position.set(50, 100, 50);
    scene.add(sunLight);

    // --- ADD SUN & CLOUDS ---
    createSunAndClouds();

    // Controls
    controls = new PointerLockControls(camera, document.body);
    const blocker = document.getElementById('blocker');
    const instructions = document.getElementById('instructions');

    instructions.addEventListener('click', () => controls.lock());
    controls.addEventListener('lock', () => blocker.style.display = 'none');
    controls.addEventListener('unlock', () => blocker.style.display = 'flex');
    scene.add(controls.getObject());

    // Movement Keys
    const onKeyDown = (e) => {
        if (e.code === 'KeyW' || e.code === 'ArrowUp') moveForward = true;
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') moveLeft = true;
        if (e.code === 'KeyS' || e.code === 'ArrowDown') moveBackward = true;
        if (e.code === 'KeyD' || e.code === 'ArrowRight') moveRight = true;
    };
    const onKeyUp = (e) => {
        if (e.code === 'KeyW' || e.code === 'ArrowUp') moveForward = false;
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') moveLeft = false;
        if (e.code === 'KeyS' || e.code === 'ArrowDown') moveBackward = false;
        if (e.code === 'KeyD' || e.code === 'ArrowRight') moveRight = false;
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // Shooting (Raycaster)
    raycaster = new THREE.Raycaster();
    document.addEventListener('mousedown', () => {
        if (!controls.isLocked) return;
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const intersects = raycaster.intersectObjects(objects, true); // true to check parts of the player group
        
        if (intersects.length > 0) {
            let hitRoot = intersects[0].object;
            // Traverse up to find the main group container
            while (hitRoot.parent && hitRoot.parent !== scene) {
                hitRoot = hitRoot.parent;
            }
            scene.remove(hitRoot);
            objects.splice(objects.indexOf(hitRoot), 1);
            spawnTarget(); // Spawn a new person when one is eliminated
        }
    });

    // Realistic Ground (Grass color with grid lines)
    const floorGeometry = new THREE.PlaneGeometry(300, 300, 50, 50);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x3b7a57, 
        roughness: 0.8,
        metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Spawn Initial People Targets
    for (let i = 0; i < 12; i++) {
        spawnTarget();
    }

    // Renderer Setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    window.addEventListener('resize', onWindowResize);
}

function createSunAndClouds() {
    // 1. Sun Mesh
    const sunGeo = new THREE.SphereGeometry(8, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffee });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    sun.position.set(80, 120, -150);
    scene.add(sun);

    // 2. Fluffy Clouds
    const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    for (let i = 0; i < 15; i++) {
        const cloudGroup = new THREE.Group();
        const puffCount = 4 + Math.floor(Math.random() * 4);
        for (let p = 0; p < puffCount; p++) {
            const puffGeo = new THREE.BoxGeometry(6 + Math.random() * 6, 3, 6 + Math.random() * 6);
            const puff = new THREE.Mesh(puffGeo, cloudMat);
            puff.position.set(p * 4 - (puffCount * 2), Math.random() * 2, Math.random() * 3);
            cloudGroup.add(puff);
        }
        cloudGroup.position.set(
            (Math.random() - 0.5) * 300,
            60 + Math.random() * 30,
            (Math.random() - 0.5) * 300
        );
        scene.add(cloudGroup);
    }
}

function spawnTarget() {
    // Create a low-poly human model group
    const personGroup = new THREE.Group();

    // Body (Torso)
    const bodyGeo = new THREE.BoxGeometry(1.2, 1.8, 0.6);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2244aa }); // Tactical blue shirt
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.9;
    personGroup.add(body);

    // Head
    const headGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffcc99 }); // Skin tone
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 3.1;
    personGroup.add(head);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.5, 1.5, 0.5);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x333333 }); // Dark pants
    
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.35, 0.75, 0);
    personGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.35, 0.75, 0);
    personGroup.add(rightLeg);

    // Random placement on the map
    personGroup.position.x = Math.floor(Math.random() * 50 - 25);
    personGroup.position.z = Math.floor(Math.random() * 50 - 25);
    
    scene.add(personGroup);
    objects.push(personGroup);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now();

    if (controls.isLocked === true) {
        const delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
    }

    prevTime = time;
    renderer.render(scene, camera);
}
