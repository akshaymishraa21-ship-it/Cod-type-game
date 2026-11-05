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
    scene.background = new THREE.Color(0x000000); // Pure black background
    scene.fog = new THREE.Fog(0x000000, 0, 50);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.y = 2; // Eye level

    // Lighting
    const light = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(light);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

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
        const intersects = raycaster.intersectObjects(objects, false);
        
        if (intersects.length > 0) {
            const hitObject = intersects[0].object;
            scene.remove(hitObject);
            objects.splice(objects.indexOf(hitObject), 1);
            spawnTarget(); // Spawn a new enemy when one is destroyed
        }
    });

    // Floor Map (Neon grid)
    const floorGeometry = new THREE.PlaneGeometry(200, 200, 40, 40);
    const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x0055ff, wireframe: true });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Spawn Initial Enemies
    for (let i = 0; i < 15; i++) {
        spawnTarget();
    }

    // Renderer Setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    window.addEventListener('resize', onWindowResize);
}

function spawnTarget() {
    const geometry = new THREE.BoxGeometry(2, 4, 2); // Taller boxes like players
    const material = new THREE.MeshPhongMaterial({ color: 0xff0000 }); // Red targets
    const box = new THREE.Mesh(geometry, material);
    box.position.x = Math.floor(Math.random() * 40 - 20);
    box.position.y = 2; // Half of height to sit on floor
    box.position.z = Math.floor(Math.random() * 40 - 20);
    scene.add(box);
    objects.push(box);
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