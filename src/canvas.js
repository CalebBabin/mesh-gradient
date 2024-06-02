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


let mat = generateMaterial();

const renderer = new WebGLRenderer({
	antialias: true,
	alpha: false,
});

renderer.toneMapping = NoToneMapping;

const scene = new Scene();
const geometry = new PlaneGeometry(2.5, 5, 512, 512);


const mesh = new Mesh(geometry, mat.material);
mesh.scale.set(1, 1, 1);
mesh.rotation.x = Math.PI * 0.25 + Math.PI;
// mesh.rotation.y = -Math.PI;
// mesh.rotation.z = -Math.PI / 4;
scene.add(mesh);

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