import { generateMaterial } from './shader';
import './style.css';
import {
	Mesh,
	OrthographicCamera,
	PlaneGeometry,
	Scene,
	WebGLRenderer,
	NoToneMapping,
} from 'three';

window.config = {};

window.config.vertex = {
	nodes: [
		{ name: 'presetBigNoiseA', scale: 0.25 * Math.random() + 0.1, detail: { x: 3 * Math.random(), y: 2.6 * Math.random(), z: 2.6 }, speed: 1.1 },
		{ name: 'presetBigNoiseA', scale: 0.25 * Math.random() + 0.1, detail: { x: 4 * Math.random(), y: 3 * Math.random(), z: 4 }, speed: 1.2 },
		{ name: 'presetSmoothingNoiseA', scale: 0.4, detail: { x: 0.2, y: 0.2, z: 0.2 }, speed: 1.3 },
		{ name: 'presetBigNoiseA', scale: 1, detail: { x: 0.4, y: 0.6, z: 0.8 }, speed: 1.0 },
		{ name: 'presetBigNoiseA', scale: 1, detail: { x: 0.3, y: 0.6, z: 0.8 }, speed: -0.87 },
		{ name: 'presetSmoothingNoiseA', scale: 0.4, detail: { x: 0.5, y: 0.5, z: 0.5 }, speed: -1.0 },
		{ name: 'presetCuttingNoiseA', scale: 0.2, detail: { x: 0.5, y: 0.5, z: 1.0 }, speed: 1.0 },
	]
};

window.config.fragment = {
	brightnessHeightTarget: 3,
	brightnessHeightMultiplier: 0.22,
}

window.dispatchEvent(new CustomEvent('vertexConfigLoaded'));

// if (localStorage.getItem('vertexConfig')) {
// 	window.vertexConfig = JSON.parse(localStorage.getItem('vertexConfig'));
// }



const renderer = new WebGLRenderer({
	antialias: true,
	alpha: false,
});

renderer.toneMapping = NoToneMapping;

const scene = new Scene();
const geometry = new PlaneGeometry(2.5, 5, 512, 512);

let mat, mesh;

function triggerRebuild(vertexConfig = {}, fragmentConfig = {}) {
	mat = generateMaterial(vertexConfig, fragmentConfig);
	mesh = new Mesh(geometry, mat.material);
	mesh.scale.set(1, 1, 1);
	mesh.rotation.x = Math.PI * 0.25 + Math.PI;
	scene.add(mesh);
	resize();
}
// triggerRebuild(window.config.vertex, window.config.fragment);

let rebuildTimeout = 0;
const rebuildListener = (e) => {
	clearTimeout(rebuildTimeout);

	rebuildTimeout = setTimeout(() => {
		scene.remove(mesh);
		triggerRebuild(e.detail.config.vertex, e.detail.config.fragment);
	}, 100);
}
window.addEventListener('rebuildTheShader', rebuildListener);


const camera = new OrthographicCamera(-1, 1, -1, 1, 0, 100);
camera.position.z = 50;

function resize() {
	const width = document.body.clientWidth;
	const height = document.body.clientHeight;
	renderer.setSize(width, height);
	if (!mat) return;
	mat.uniforms.viewportSize.value[0] = width;
	mat.uniforms.viewportSize.value[1] = height;
}

function draw() {
	if (mat) mat.tick();
	renderer.render(scene, camera);
	window.requestAnimationFrame(draw);
}


window.addEventListener('DOMContentLoaded', () => {
	document.body.appendChild(renderer.domElement);
	window.addEventListener('resize', resize);
	resize();
	draw();
})