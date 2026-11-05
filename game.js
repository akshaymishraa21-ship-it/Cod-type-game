import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

let camera, scene, renderer, controls, raycaster;
const enemies = []; 
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

let isTouchDevice = false;
let touchMoveDir = { x: 0, y: 0 };
let lookTouchId = null;
let touchLookPrev = { x: 0, y: 0 };
let gameStarted = false;

init();
animate();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.015);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.y = 2;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    sunLight.position.set(50, 100, 50);
    scene.add(sunLight);

    createSunAndClouds();

    controls = new PointerLockControls(camera, document.body);
    scene.add(controls.getObject());

    isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Play Button Listener
    const playBtn = document.getElementById('play-btn');
    const blocker = document.getElementById('blocker');
    const crosshair = document.getElementById('crosshair');
    const touchControlsUI = document.getElementById('touch-controls');

    playBtn.addEventListener('click', () => {
        gameStarted = true;
        blocker.style.display = 'none';
        crosshair.style.display = 'block';

        if (!isTouchDevice) {
            controls.lock();
        } else {
            touchControlsUI.style.display = 'block';
        }
    });

    // Keyboard Listeners (PC)
    window.addEventListener('keydown', (e) => {
        if (!gameStarted) return;
        if (e.code === 'KeyW' || e.code === 'ArrowUp') moveForward = true;
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') moveLeft = true;
        if (e.code === 'KeyS' || e.code === 'ArrowDown') moveBackward = true;
        if (e.code === 'KeyD' || e.code === 'ArrowRight') moveRight = true;
    });
    window.addEventListener('keyup', (e) => {
        if (e.code === 'KeyW' || e.code === 'ArrowUp') moveForward = false;
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') moveLeft = false;
        if (e.code === 'KeyS' || e.code === 'ArrowDown') moveBackward = false;
        if (e.code === 'KeyD' || e.code === 'ArrowRight') moveRight = false;
    });

    // Shooting Action
    const triggerShoot = () => {
        if (!gameStarted) return;
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const intersects = raycaster.intersectObjects(enemies, true);
        if (intersects.length > 0) {
            let hitRoot = intersects[0].object;
            while (hitRoot.parent && hitRoot.parent !== scene) {
                hitRoot = hitRoot.parent;
            }
            scene.remove(hitRoot);
            enemies.splice(enemies.indexOf(hitRoot), 1);
            spawnTarget(); // Respawn new walking person
        }
    };

    raycaster = new THREE.Raycaster();
    window.addEventListener('mousedown', () => {
        if (!isTouchDevice && gameStarted && controls.isLocked) triggerShoot();
    });

    setupTouchControls(triggerShoot);

    // Ground Map
    const floorGeometry = new THREE.PlaneGeometry(300, 300, 50, 50);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x3b7a57, roughness: 0.8, metalness: 0.1 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Spawn Walking People
    for (let i = 0; i < 10; i++) {
        spawnTarget();
    }

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    window.addEventListener('resize', onWindowResize);
}

function spawnTarget() {
    const person = new THREE.Group();

    // Torso (Jacket)
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x112233 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 0.6), bodyMat);
    body.position.y = 1.9;
    person.add(body);

    // Head with Face Details
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffcc99 });
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), headMat);
    head.position.y = 3.1;
    person.add(head);

    // Eyes / Glasses accent
    const glassMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const glasses = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.2), glassMat);
    glasses.position.set(0, 3.15, 0.36);
    person.add(glasses);

    // Legs
    const legMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.5, 0.4), legMat);
    leftLeg.position.set(-0.3, 0.75, 0);
    person.add(leftLeg);

    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.5, 0.4), legMat);
    rightLeg.position.set(0.3, 0.75, 0);
    person.add(rightLeg);

    // Random initial position
    person.position.x = Math.floor(Math.random() * 60 - 30);
    person.position.z = Math.floor(Math.random() * 60 - 30);
    
    // Custom movement properties for walking AI
    person.userData = {
        walkSpeed: 2 + Math.random() * 2,
        direction: new THREE.Vector3((Math.random() - 0.5), 0, (Math.random() - 0.5)).normalize(),
        changeTimer: 0
    };

    scene.add(person);
    enemies.push(person);
}

function setupTouchControls(shootCallback) {
    const joystickZone = document.getElementById('joystick-zone');
    const joystickKnob = document.getElementById('joystick-knob');
    const shootBtn = document.getElementById('shoot-btn');

    let joystickCenter = { x: 0, y: 0 };
    let joystickTouchId = null;

    joystickZone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        joystickTouchId = touch.identifier;
        const rect = joystickZone.getBoundingClientRect();
        joystickCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    });

    joystickZone.addEventListener('touchmove', (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (touch.identifier === joystickTouchId) {
                const dx = touch.clientX - joystickCenter.x;
                const dy = touch.clientY - joystickCenter.y;
                const dist = Math.min(50, Math.sqrt(dx * dx + dy * dy));
                const angle = Math.atan2(dy, dx);
                
                joystickKnob.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`;
                touchMoveDir.x = (Math.cos(angle) * dist) / 50;
                touchMoveDir.y = (Math.sin(angle) * dist) / 50;
            }
        }
    });

    const endJoystick = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === joystickTouchId) {
                joystickTouchId = null;
                joystickKnob.style.transform = `translate(0px, 0px)`;
                touchMoveDir.x = 0;
                touchMoveDir.y = 0;
            }
        }
    };
    joystickZone.addEventListener('touchend', endJoystick);
    joystickZone.addEventListener('touchcancel', endJoystick);

    shootBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        shootCallback();
    });

    window.addEventListener('touchstart', (e) => {
        if (!isTouchDevice || !gameStarted) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (touch.clientX > window.innerWidth / 2 && lookTouchId === null) {
                lookTouchId = touch.identifier;
                touchLookPrev = { x: touch.clientX, y: touch.clientY };
            }
        }
    });

    window.addEventListener('touchmove', (e) => {
        if (!isTouchDevice || !gameStarted) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (touch.identifier === lookTouchId) {
                const dx = touch.clientX - touchLookPrev.x;
                const dy = touch.clientY - touchLookPrev.y;

                const euler = new THREE.Euler(0, 0, 0, 'YXZ');
                euler.setFromQuaternion(camera.quaternion);
                euler.y -= dx * 0.005;
                euler.x -= dy * 0.005;
                euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));
                camera.quaternion.setFromEuler(euler);

                touchLookPrev = { x: touch.clientX, y: touch.clientY };
            }
        }
    });

    const endLook = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === lookTouchId) lookTouchId = null;
        }
    };
    window.addEventListener('touchend', endLook);
    window.addEventListener('touch
