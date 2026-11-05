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
let score = 0;
let ammo = 30;

// Simulate App Loading Sequence
window.addEventListener('DOMContentLoaded', () => {
    let progress = 0;
    const bar = document.getElementById('loading-bar');
    const text = document.getElementById('loading-text');
    const playBtn = document.getElementById('play-btn');

    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 15) + 10;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            text.style.display = 'none';
            document.getElementById('loading-container').style.display = 'none';
            playBtn.style.display = 'block';
        }
        bar.style.width = progress + '%';
    }, 250);
});

init();
animate();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b131f); // Dark tactical twilight sky
    scene.fog = new THREE.FogExp2(0x0b131f, 0.02);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.y = 2;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.0);
    dirLight.position.set(40, 80, 40);
    scene.add(dirLight);

    controls = new PointerLockControls(camera, document.body);
    scene.add(controls.getObject());

    isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Launch Game & Full Screen on Play Button Tap
    const playBtn = document.getElementById('play-btn');
    const blocker = document.getElementById('blocker');
    const hud = document.getElementById('hud');
    const touchControlsUI = document.getElementById('touch-controls');

    playBtn.addEventListener('click', () => {
        // Request full screen for real app experience
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {});
        }

        gameStarted = true;
        blocker.style.display = 'none';
        hud.style.display = 'block';

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
        if (!gameStarted || ammo <= 0) return;
        ammo--;
        document.getElementById('ammo').innerText = ammo;

        // Auto reload simulation
        if (ammo <= 0) {
            setTimeout(() => {
                ammo = 30;
                document.getElementById('ammo').innerText = ammo;
            }, 1200);
        }

        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const intersects = raycaster.intersectObjects(enemies, true);
        if (intersects.length > 0) {
            let hitRoot = intersects[0].object;
            while (hitRoot.parent && hitRoot.parent !== scene) {
                hitRoot = hitRoot.parent;
            }
            scene.remove(hitRoot);
            enemies.splice(enemies.indexOf(hitRoot), 1);
            
            score += 100;
            document.getElementById('score').innerText = score;
            spawnTarget();
        }
    };

    raycaster = new THREE.Raycaster();
    window.addEventListener('mousedown', () => {
        if (!isTouchDevice && gameStarted && controls.isLocked) triggerShoot();
    });

    setupTouchControls(triggerShoot);

    // Tactical Ground Arena
    const floorGeometry = new THREE.PlaneGeometry(250, 250, 30, 30);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x1a212d, roughness: 0.9 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Spawn Enemies
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

    // Body
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x223344 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.7, 0.5), bodyMat);
    body.position.y = 1.8;
    person.add(body);

    // Head
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), headMat);
    head.position.y = 2.9;
    person.add(head);

    // Tactical Helmet
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0x334422 });
    const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.35, 0.68), helmetMat);
    helmet.position.y = 3.15;
    person.add(helmet);

    // Legs
    const legMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.4, 0.35), legMat);
    leftLeg.position.set(-0.25, 0.7, 0);
    person.add(leftLeg);

    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.4, 0.35), legMat);
    rightLeg.position.set(0.25, 0.7, 0);
    person.add(rightLeg);

    person.position.x = Math.floor(Math.random() * 50 - 25);
    person.position.z = Math.floor(Math.random() * 50 - 25);
    
    person.userData = {
        walkSpeed: 1.5 + Math.random() * 2,
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
    window.addEventListener('touchcancel', endLook);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    if (gameStarted) {
        enemies.forEach((enemy) => {
            enemy.position.addScaledVector(enemy.userData.direction, enemy.userData.walkSpeed * delta);
            
            enemy.userData.changeTimer += delta;
            if (enemy.userData.changeTimer > 3.5 || Math.abs(enemy.position.x) > 35 || Math.abs(enemy.position.z) > 35) {
                enemy.userData.direction.set((Math.random() - 0.5), 0, (Math.random() - 0.5)).normalize();
                enemy.userData.changeTimer = 0;
            }
        });

        if (!isTouchDevice && controls.isLocked === true) {
            velocity.x -= velocity.x * 10.0 * delta;
            velocity.z -= velocity.z * 10.0 * delta;

            direction.z = Number(moveForward) - Number(moveBackward);
            direction.x = Number(moveRight) - Number(moveLeft);
            direction.normalize();

            if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
            if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

            controls.moveRight(-velocity.x * delta);
            controls.moveForward(-velocity.z * delta);
        } else if (isTouchDevice) {
            const moveSpeed = 12.0;
            controls.moveForward(-touchMoveDeriv(touchMoveDir.y) * moveSpeed * delta);
            controls.moveRight(touchMoveDeriv(touchMoveDir.x) * moveSpeed * delta);
        }
    }

    prevTime = time;
    renderer.render(scene, camera);
}

function touchMoveDeriv(val) {
    return Math.abs(val) > 0.1 ? val : 0;
}
