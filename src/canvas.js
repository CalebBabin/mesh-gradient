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


window.vertexConfig = [
	{ name: 'presetBigNoiseA', scale: 1.5, detail: { x: 0.4, y: 0.6, z: 0.8 }, speed: 1.0 },
	{ name: 'presetBigNoiseA', scale: 0.1, detail: { x: 2.6, y: 2.6, z: 2.6 }, speed: 1.0 },
	{ name: 'presetBigNoiseA', scale: 0.075, detail: { x: 4, y: 4, z: 4 }, speed: 1.0 },
	{ name: 'presetCuttingNoiseA', scale: 1.0, detail: { x: 1.0, y: 1.0, z: 1.0 }, speed: 1.0 },
	{ name: 'presetSmoothingNoiseA', scale: 0.5, detail: { x: 1.0, y: 1.0, z: 1.0 }, speed: 1.0 },
];

window.dispatchEvent(new CustomEvent('vertexConfigLoaded'));

if (localStorage.getItem('vertexConfig')) {
	window.vertexConfig = JSON.parse(localStorage.getItem('vertexConfig'));
}


const renderer = new WebGLRenderer({
	antialias: true,
	alpha: false,
});

renderer.toneMapping = NoToneMapping;

const scene = new Scene();
const geometry = new PlaneGeometry(2.5, 5, 512, 512);

let mat, mesh;

function triggerRebuild(config) {
	mat = generateMaterial({ vertexConfig: config });
	mesh = new Mesh(geometry, mat.material);
	mesh.scale.set(1, 1, 1);
	mesh.rotation.x = Math.PI * 0.25 + Math.PI;
	scene.add(mesh);
	resize();
}
triggerRebuild(window.vertexConfig);

let rebuildTimeout = 0;
const rebuildListener = (e) => {
	clearTimeout(rebuildTimeout);

	rebuildTimeout = setTimeout(() => {
		scene.remove(mesh);
		triggerRebuild(e.detail.config);
	}, 250);
}
window.addEventListener('rebuildTheShader', rebuildListener);


const camera = new OrthographicCamera(-1, 1, -1, 1, 0, 100);
camera.position.z = 50;

function resize() {
	const width = document.body.clientWidth;
	const height = document.body.clientHeight;
	renderer.setSize(width, height);
	mat.uniforms.viewportSize.value[0] = width;
	mat.uniforms.viewportSize.value[1] = height;
}

function draw() {
	mat.tick();
	renderer.render(scene, camera);
	window.requestAnimationFrame(draw);
}


window.addEventListener('DOMContentLoaded', () => {
	document.body.appendChild(renderer.domElement);
	window.addEventListener('resize', resize);
	resize();
	draw();
})