import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

let camera, scene, renderer, controls, raycaster;
const objects = []; 
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// Mobile touch states
let isTouchDevice = false;
let touchMoveDir = { x: 0, y: 0 };
let touchLookPrev = { x: 0, y: 0 };
let lookTouchId = null;

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

    // Controls setup
    controls = new PointerLockControls(camera, document.body);
    const blocker = document.getElementById('blocker');
    const instructions = document.getElementById('instructions');
    const touchControlsUI = document.getElementById('touch-controls');

    // Detect if device supports touch
    isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (isTouchDevice) {
        touchControlsUI.style.display = 'block';
        instructions.innerHTML = `<p style="font-size:28px; color: #00ffff; font-weight:bold;">TAP TO START</p><p>Use Left Joystick to Move<br>Swipe Right Side to Look Around<br>Tap FIRE to Shoot</p>`;
    }

    instructions.addEventListener('click', () => {
        if (!isTouchDevice) {
            controls.lock();
        } else {
            blocker.style.display = 'none';
        }
    });

    controls.addEventListener('lock', () => blocker.style.display = 'none');
    controls.addEventListener('unlock', () => {
        if (!isTouchDevice) blocker.style.display = 'flex';
    });
    scene.add(controls.getObject());

    // Keyboard Listeners (PC)
    const onKeyDown = (e) => {
        if (e.code === 'KeyW' || e.code === 'ArrowUp') moveForward = true;
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') moveLeft = true;
        if (e.code === 'KeyS' || e.code === 'ArrowDown') moveBackward = true;
        if (e.code === 'KeyD' || e.code === 'ArrowRight') moveRight = true;
