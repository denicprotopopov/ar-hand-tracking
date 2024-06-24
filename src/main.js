import * as THREE from 'three';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

const videoElement = document.querySelector('.input_video');
const scene = new THREE.Scene();
const camera3j = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true });

const spheresLeft = [];
const spheresRight = [];
for (let i = 0; i < 21; i++) {
    const sphereGeometry = new THREE.SphereGeometry(0.01, 32, 16); // Initial sphere size
    const sphereMaterial = new THREE.MeshNormalMaterial();
    const sphereLeft = new THREE.Mesh(sphereGeometry, sphereMaterial);
    const sphereRight = new THREE.Mesh(sphereGeometry, sphereMaterial);
    spheresLeft.push(sphereLeft);
    spheresRight.push(sphereRight);
    scene.add(sphereLeft);
    scene.add(sphereRight);
}

// Create a red cube to attach to the palm
const cubeGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
scene.add(cube);
cube.visible = false; // Initially hide the cube

// Initialize the camera position
const radius = 2;
let angle = 1.57;
camera3j.position.x = radius * Math.cos(angle);
camera3j.position.z = radius * Math.sin(angle);
camera3j.position.y = 0;
camera3j.lookAt(0, 0, 0);

// Initialize the renderer
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

function convertCoordinates(x, y, z, videoWidth, videoHeight) {
    const ndcX = (x * 2 - 1) * (videoWidth / videoHeight); // Normalized device coordinates
    const ndcY = -(y * 2 - 1); // Invert Y axis
    const ndcZ = -z; // No need to scale Z

    const vector = new THREE.Vector3(ndcX, ndcY, ndcZ).unproject(camera3j);
    return {
        x: vector.x,
        y: vector.y,
        z: vector.z
    };
}

function updateSphereScale(sphere, z) {
    const scale = 1 / (z + 2); // Adjust scale based on depth
    sphere.scale.set(scale, scale, scale);
}

function onResults(results) {
    const videoWidth = videoElement.videoWidth;
    const videoHeight = videoElement.videoHeight;
    if (!results || !results.multiHandLandmarks.length) {
        cube.visible = false;
        return;
    }

    for (let i = 0; i < 21; i++) {
        spheresLeft[i].visible = false;
        spheresRight[i].visible = false;
    }

    let palmFound = false;

    for (let hand = 0; hand < results.multiHandLandmarks.length; hand++) {
        for (let i = 0; i < 21; i++) {
            const landmark = results.multiHandLandmarks[hand][i];
            const coords = convertCoordinates(landmark.x, landmark.y, landmark.z, videoWidth, videoHeight);

            if (results.multiHandedness[hand].label === "Right") {
                spheresRight[i].visible = true;
                spheresRight[i].position.set(coords.x, coords.y, coords.z);
                updateSphereScale(spheresRight[i], coords.z);
            } else {
                spheresLeft[i].visible = true;
                spheresLeft[i].position.set(coords.x, coords.y, coords.z);
                updateSphereScale(spheresLeft[i], coords.z);
            }

            if (i === 9) { // Index 0 is usually the palm
                cube.position.set(coords.x, coords.y, coords.z);
                palmFound = true;
            }
        }
    }

    cube.visible = palmFound;
}

// Initialize Mediapipe Hands
const hands = new Hands({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
});

hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

hands.onResults(onResults);

// Initialize the Camera
const cameraFeed = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 1280,
    height: 720,
    // facingMode: { exact: 'environment' }
});

// Start the Camera
cameraFeed.start();

// Resize handler to maintain aspect ratio
window.addEventListener('resize', () => {
    camera3j.aspect = window.innerWidth / window.innerHeight;
    camera3j.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Rotate the cube
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    renderer.render(scene, camera3j);
}

animate();
