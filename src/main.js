import './style.css';
import {
	Mesh,
	OrthographicCamera,
	PlaneGeometry,
	Scene,
	ShaderMaterial,
	WebGLRenderer,
	NoToneMapping,
	DoubleSide
} from 'three';


const simplexNoiseShader = /*glsl*/`
vec3 mod289(vec3 x) {
	return x - floor(x * (1. / 289.)) * 289.;
}
vec4 mod289(vec4 x) {
	return x - floor(x * (1. / 289.)) * 289.;
}
vec4 permute(vec4 x) {
	return mod289(((x * 34.) + 10.) * x);
}
vec4 taylorInvSqrt(vec4 r) {
	return 1.79284291400159 - .85373472095314 * r;
}
float snoise(vec3 v) {
	const vec2 C = vec2(1. / 6., 1. / 3.);
	const vec4 D = vec4(0., .5, 1., 2.);

	vec3 i = floor(v + dot(v, C.yyy));
	vec3 x0 = v - i + dot(i, C.xxx);

	vec3 g = step(x0.yzx, x0.xyz);
	vec3 l = 1. - g;
	vec3 i1 = min(g.xyz, l.zxy);
	vec3 i2 = max(g.xyz, l.zxy);

	vec3 x1 = x0 - i1 + C.xxx;
	vec3 x2 = x0 - i2 + C.yyy;
	vec3 x3 = x0 - D.yyy;

	i = mod289(i);
	vec4 p = permute(permute(permute(i.z + vec4(0., i1.z, i2.z, 1.)) + i.y + vec4(0., i1.y, i2.y, 1.)) + i.x + vec4(0., i1.x, i2.x, 1.));

	float n_ = .142857142857;
	vec3 ns = n_ * D.wyz - D.xzx;
	vec4 j = p - 49. * floor(p * ns.z * ns.z);
	vec4 x_ = floor(j * ns.z);
	vec4 y_ = floor(j - 7. * x_);
	vec4 x = x_ * ns.x + ns.yyyy;
	vec4 y = y_ * ns.x + ns.yyyy;
	vec4 h = 1. - abs(x) - abs(y);
	vec4 b0 = vec4(x.xy, y.xy);
	vec4 b1 = vec4(x.zw, y.zw);

	vec4 s0 = floor(b0) * 2. + 1.;
	vec4 s1 = floor(b1) * 2. + 1.;
	vec4 sh = -step(h, vec4(0.));
	vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
	vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
	vec3 p0 = vec3(a0.xy, h.x);
	vec3 p1 = vec3(a0.zw, h.y);
	vec3 p2 = vec3(a1.xy, h.z);
	vec3 p3 = vec3(a1.zw, h.w);

	vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
	p0 *= norm.x;
	p1 *= norm.y;
	p2 *= norm.z;
	p3 *= norm.w;

	vec4 m = max(.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.);
	m = m * m;
	return 105. * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

const fragmentShader = /*glsl*/`
	precision highp float;
	varying vec2 vUv;
	varying float height;
	uniform float uTime;
	varying vec2 swirlOffset;

	${simplexNoiseShader}

	void main() {

		float line = pow(1.0 - distance(vUv.y, 0.35) * 2.0, 20.0);
		
		gl_FragColor = mix(vec4(
			vUv.x,
			1.0,//0.1 + v1 * 0.25 + v2 * 0.6,
			vUv.y,
			0.0
		), vec4(1.0), line);
	}
`;

const vertexShader = /*glsl*/`
	varying vec2 vUv;
	varying vec2 swirlOffset;
	varying float height;
	uniform vec2 viewportSize;
	uniform float uTime;

	${simplexNoiseShader}

	void main() {
		vUv = vec2(uv.x * viewportSize.x, uv.y * viewportSize.y);

		vec3 pos = position;

		float offset = 0.0;
		float slowTime = uTime / 30000.0;
		offset += snoise(vec3(vUv.x * 4.0 - slowTime, vUv.y * 4.0 * 2.0, slowTime * 2.5)) * 0.05;
		offset += snoise(vec3(vUv.x * 2.0 + slowTime, vUv.y * 2.0 * 2.0, slowTime * 2.0)) * 0.05;

		swirlOffset = vec2(
			snoise(vec3(vUv.x * 6.0, vUv.y * 6.0, slowTime * 2.0)) * 3.14,
			0.05//(pow((snoise(vec3(vUv.x, vUv.y, slowTime * 2.0)) * 0.5 + 0.5), 2.0) * 2.0 - 1.0) * 0.5
			//snoise(vec3(vUv.x * 1.0, vUv.y * 1.0, slowTime * 2.0)) * 0.25
			//snoise(vec3(vUv.x, vUv.y, slowTime * 2.0)) * 2.0
		);

		height = offset / 0.1;
	
		pos.y += offset;

		gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
	}
`;







const renderer = new WebGLRenderer({
	antialias: false,
	premultipliedAlpha: false
});

renderer.toneMapping = NoToneMapping;

const scene = new Scene();
const geometry = new PlaneGeometry(1, 1, 512, 128);

const uniforms = {
	viewportSize: {
		value: [1.0, 1.0]
	},
	uTime: {
		value: performance.now(),
	}
};


const material = new ShaderMaterial({
	fragmentShader,
	vertexShader,
	uniforms: uniforms,
	transparent: true,
	depthTest: false,
	depthWrite: false,
	side: DoubleSide,
});


const mesh = new Mesh(geometry, material);
mesh.scale.set(2, 3.5, 1);
mesh.rotation.x = Math.PI * 0.75;
//mesh.rotation.y = Math.PI / 4;
scene.add(mesh);

const camera = new OrthographicCamera(-1, 1, -1, 1, 0, 100);
camera.position.z = 50;

function resize() {
	const width = document.body.clientWidth;
	const height = document.body.clientHeight;
	renderer.setSize(width, height);
	let multiplier = 0.001;
	multiplier /= Math.max(1, Math.max(width, height) / 1400);
	uniforms.viewportSize.value[0] = width * multiplier;
	uniforms.viewportSize.value[1] = height * multiplier;
}

function draw() {
	uniforms.uTime.value = performance.now();

	renderer.render(scene, camera);
	window.requestAnimationFrame(draw);
}


window.addEventListener('DOMContentLoaded', () => {

	document.body.appendChild(renderer.domElement);
	window.addEventListener('resize', resize);
	resize();
	draw();
})
