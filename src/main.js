import './style.css';
import {
	Mesh,
	OrthographicCamera,
	PlaneGeometry,
	Scene,
	ShaderMaterial,
	WebGLRenderer,
	NoToneMapping,
	FrontSide,
} from 'three';
import colorSpaceGLSL from './colorSpace.glsl?raw';


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
	varying vec2 originalUv;
	varying float height;
	varying vec2 swirlOffset;
	uniform float uTime;

	${colorSpaceGLSL}
	${simplexNoiseShader}

	void main() {
		float normalizedHeight = height * 0.5 + 0.5;
		float chroma = 1.0;
		gl_FragColor = lch_to_rgb(
			vec4(
				0.6 + (normalizedHeight * 0.2),
				chroma,
				swirlOffset.x + uTime * 0.00001,
				1.0
			) * 100.0
		);

		// float stripeCount = 60.0;
		// if (mod(floor((vUv.y + vUv.x / 5.0 + uTime*0.00001) * stripeCount), 2.0) == 0.0) {
		// 	gl_FragColor *= pow(
		// 		1.0 - sin((vUv.y + vUv.x / 5.0 + uTime*0.00001) * stripeCount * 3.14159265359),
		// 		1.5
		// 	);
		// }

		// gl_FragColor = lch_to_rgb(
		// 	mix(
		// 		vec4(
		// 			normalizedHeight *0.5 + 0.5,
		// 			chroma,
		// 			normalizedHeight * 2.0 - 1.0 + uTime * 0.00002,
		// 			1.0
		// 		) * 100.0,
		// 		vec4(
		// 			1.0 - (normalizedHeight * 0.5),
		// 			chroma,
		// 			originalUv.y * 2.0 - 1.0 + uTime * 0.00001,
		// 			1.0
		// 		) * 100.0,
		// 		swirlOffset.x
		// 	)
		// );

		// float multiplier = 0.25;
		// float darken = (1.0 - height) * multiplier + (1.0 - multiplier);
		// gl_FragColor = vec4(originalUv.x * darken, originalUv.y * darken, 1.0, 1.0);
		gl_FragColor.a = 1.0;
	}
`;

const vertexShader = /*glsl*/`
	varying vec2 vUv;
	varying vec2 originalUv;
	varying vec2 swirlOffset;
	varying float height;
	uniform vec2 viewportSize;
	uniform float uTime;

	${simplexNoiseShader}

	void main() {
		if (viewportSize.x < viewportSize.y) {
			vUv = vec2(uv.x, uv.y * (viewportSize.y/viewportSize.x));
		} else {
			vUv = vec2(uv.x * (viewportSize.x/viewportSize.y), uv.y);
		}
		originalUv = vec2(uv.x, uv.y);

		vec3 pos = position;

		float offset = 0.0;
		float slowTime = uTime / 30000.0;
		offset += snoise(vec3(
			vUv.x * 1.0,
			vUv.y * 5.0 + slowTime * 0.25,
			slowTime
		));
		//offset += snoise(vec3(vUv.x * 1.0 * 0.75 + slowTime, vUv.y * 1.0 * 2.0, slowTime * 2.0)) * 0.05;

		swirlOffset = vec2(
			snoise(vec3(vUv.x * 0.2, vUv.y * 3.0, slowTime * 0.3)),
			snoise(vec3(vUv.x * 2.0, vUv.y * 2.0, slowTime * 0.5))
		);

		// extra wavyness
		offset -= (sin(uv.y * 250.0) + 1.0) * 0.5 * (pow(cos(vUv.y * 40.0 + slowTime * 0.2) * 0.5 + 0.5, 3.0) * pow(cos(vUv.x * 3.0 + vUv.y * 2.0 + slowTime * 0.3) * 0.5 + 0.5, 3.0));
	
		height = offset;
		pos.z -= offset * 0.5;

		gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
	}
`;


const renderer = new WebGLRenderer({
	antialias: true,
});

renderer.toneMapping = NoToneMapping;

const scene = new Scene();
const geometry = new PlaneGeometry(2.5, 5, 512, 512);

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
	depthTest: false,
	depthWrite: false,
	side: FrontSide,
});


const mesh = new Mesh(geometry, material);
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
	uniforms.viewportSize.value[0] = width;
	uniforms.viewportSize.value[1] = height;
}

const timeOffset = (Math.random() * 2 - 1) * 100000;
const timeMultiplier = location.search.includes('fast') ? 20 : 1;
function draw() {
	uniforms.uTime.value = performance.now() * timeMultiplier + timeOffset;

	renderer.render(scene, camera);
	window.requestAnimationFrame(draw);
}


window.addEventListener('DOMContentLoaded', () => {
	document.body.appendChild(renderer.domElement);
	window.addEventListener('resize', resize);
	resize();
	draw();

	const fullscreenButton = document.getElementById('fullscreenButton');
	fullscreenButton.addEventListener('click', () => {
		if (document.fullscreenElement) {
			document.exitFullscreen();
			return;
		} else {
			document.body.requestFullscreen();
		}
	});

	const timeoutDuration = 1000;
	let buttonTimeout = Date.now() - timeoutDuration;
	const showButton = () => {
		fullscreenButton.style.opacity = 1;
		buttonTimeout = Date.now();
	}
	window.addEventListener('mousemove', showButton);
	window.addEventListener('touchstart', showButton);
	window.addEventListener('click', showButton);
	window.addEventListener('keydown', showButton);

	setInterval(() => {
		if (Date.now() - buttonTimeout > timeoutDuration) {
			fullscreenButton.style.opacity = 0;
		}
	}, timeoutDuration / 2);
})
