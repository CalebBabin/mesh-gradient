import { FrontSide, ShaderMaterial } from 'three';
import GLSL_colorSpaces from './colorSpaces.glsl?raw';
import GLSL_easing from './easing.glsl?raw';

import GLSL_simplexNoise3D from './noise/simplex.glsl?raw';
let timeOffset = (Math.random() - 0.5) * 2 * 10000000;
let timeKeyDirection = 0;
let lastTimeTick = performance.now();
function timeTick() {
	window.requestAnimationFrame(timeTick);
	const delta = performance.now() - lastTimeTick;
	lastTimeTick = performance.now();
	timeOffset += timeKeyDirection * delta * 50;
};
window.requestAnimationFrame(timeTick);
const keyMap = new Map();
window.addEventListener('keydown', (e) => {
	if (keyMap.get(e.key)) return;
	switch (e.key) {
		case "ArrowLeft": {
			timeKeyDirection -= 1;
		} break;
		case "ArrowRight": {
			timeKeyDirection += 1;
		} break;
	}
	keyMap.set(e.key, true);
});
window.addEventListener('keyup', (e) => {
	keyMap.set(e.key, false);
	switch (e.key) {
		case "ArrowLeft": {
			timeKeyDirection += 1;
		} break;
		case "ArrowRight": {
			timeKeyDirection -= 1;
		} break;
	}
});
window.addEventListener('blur', (e) => {
	timeKeyDirection = 0;
});

const vertexDictionary = {
    presetBigNoiseA: {
        name: 'Wave Noise',
        description: 'Adds soft waves to the surface of the plane',
        vertex: /*glsl*/`
        offset.y += simplexNoise3D(vec3(
            vUv.x * detail.x * 1.0 + slowTime,
            vUv.y * detail.y * 5.0 + slowTime * 0.5,
            slowTime * 0.1
        )) * scale.y;
    `},
    presetBigNoiseB: {
        name: 'Bubbly noise',
        description: 'Adds soft bubbles to the surface of the plane',
        vertex: /*glsl*/`
        offset.y += simplexNoise3D(vec3(
            vUv.x * detail.x * 1.0 + slowTime * 0.5,
            vUv.y * detail.y * 5.0 + slowTime * 0.25,
            slowTime
        )) * scale.y;
    `},
    presetCuttingNoiseA: {
        name: 'Cutting Noise A',
        description: 'adds "cuts" along the depth axis to help give extra texture where colors meet',
        vertex: /*glsl*/`

        // extra wavyness
        offset.y += (sin(uv.y * detail.y * 250.0) + 1.0) * 0.5 * (
                pow(cos(vUv.y * detail.y * 40.0 + slowTime * 0.2) * 0.5 + 0.5, 3.0) *
                pow(cos(vUv.x * detail.z * 3.0 + vUv.y * detail.z * 2.0 + slowTime * 0.3) * 0.5 + 0.5, 3.0)) * scale.y;
    `},
    presetSmoothingNoiseA: {
        name: 'Zeroing Noise',
        description: 'somewhat smooths out the surface of the plane',
        vertex: /*glsl*/`
        float smoothness = simplexNoise3D(vec3(
            vUv.x * detail.x + slowTime,
            vUv.y * detail.y + slowTime * 0.5,
            slowTime * 0.1
        )) * 0.5 + 0.5;

        smoothness *= scale.y;

        offset.y = mix(offset.y, 0.0, clamp(smoothness, 0.0, 1.0));

        // vertexNoise.x = mix(vertexNoise.x, 5000.0, pow(helper, 7.0));
        // vertexNoise.y = mix(vertexNoise.y, 5000.0, pow(helper, 7.0));
    `},
};
window.vertexDictionary = vertexDictionary;


function trailZero(num) {
    if (isNaN(num)) return '1.0';
    if (num % 1 === 0) {
        return String(num) + '.0';
    }
    return String(num);
}

export function generateMaterial(vertexConfig, fragmentConfig) {

    const fragmentShader = /*glsl*/`
    precision highp float;
    varying vec2 vUv;
    varying vec2 originalUv;
    varying float vHeight;
    varying vec2 vertexNoise;
    uniform float uTime;

    ${GLSL_colorSpaces}

    void main() {
        float chroma = 0.75;
        gl_FragColor = lch_to_rgb(
            vec4(
                distance(vHeight, ${trailZero(fragmentConfig.brightnessHeightTarget)}) * ${trailZero(fragmentConfig.brightnessHeightMultiplier)},
                chroma,
                vertexNoise.x + uTime * 0.00001,
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
        // 			normalizedvHeight *0.5 + 0.5,
        // 			chroma,
        // 			normalizedvHeight * 2.0 - 1.0 + uTime * 0.00002,
        // 			1.0
        // 		) * 100.0,
        // 		vec4(
        // 			1.0 - (normalizedvHeight * 0.5),
        // 			chroma,
        // 			originalUv.y * 2.0 - 1.0 + uTime * 0.00001,
        // 			1.0
        // 		) * 100.0,
        // 		vertexNoise.x
        // 	)
        // );

        // float multiplier = 0.25;
        // float darken = (1.0 - vHeight) * multiplier + (1.0 - multiplier);
        // gl_FragColor = vec4(originalUv.x * darken, originalUv.y * darken, 1.0, 1.0);
        gl_FragColor.a = 1.0;
    }
    `;

    let vertexConfigOutput = '';
    const vertexNodes = vertexConfig.nodes || [];
    for (let i = 0; i < vertexNodes.length; i++) {
        const conf = vertexNodes[i];
        const preset = vertexDictionary[conf.name];

        if (typeof conf.scale === 'number') {
            conf.scale = { x: conf.scale, y: conf.scale, z: conf.scale };
        }
        vertexConfigOutput += '\n{\n';
        vertexConfigOutput += 'slowTime = uTime * ' + trailZero(conf.speed * 0.00001) + ';\n';
        vertexConfigOutput += 'scale = vec3(' + trailZero(conf.scale.x) + ',' + trailZero(conf.scale.y) + ',' + trailZero(conf.scale.z) + ');\n';
        vertexConfigOutput += 'detail = vec3(' + trailZero(conf.detail.x) + ',' + trailZero(conf.detail.y) + ',' + trailZero(conf.detail.z) + ');\n';
        vertexConfigOutput += preset.vertex;
        vertexConfigOutput += '\n}\n';
    }
    const vertexShader = /*glsl*/`
        varying vec2 vUv;
        varying vec2 originalUv;
        varying vec2 vertexNoise;
        varying float vHeight;
        uniform vec2 viewportSize;
        uniform float uTime;

        ${GLSL_simplexNoise3D}
        ${GLSL_easing}

        void main() {
            if (viewportSize.x < viewportSize.y) {
                vUv = vec2(uv.x, uv.y * (viewportSize.y/viewportSize.x));
            } else {
                vUv = vec2(uv.x * (viewportSize.x/viewportSize.y), uv.y);
            }
            originalUv = vec2(uv.x, uv.y);


            vertexNoise = vec2(
                simplexNoise3D(vec3(vUv.x * 0.2, vUv.y * 3.0, (uTime / 30000.0) * 0.3)),
                simplexNoise3D(vec3(vUv.x * 2.0, vUv.y * 2.0, (uTime / 30000.0) * 0.5))
            );

            vec3 offset = vec3(0.0);
            float speed = 1.0;
            vec3 scale = vec3(1.0);
            vec3 detail = vec3(1.0);
            float slowTime = uTime;
            ${vertexConfigOutput}
        
            vHeight = offset.y;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(position + offset.zxy, 1.0);
        }
    `;

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
        side: FrontSide,
        depthTest: true,
        depthWrite: true,
        transparent: true,
    });

    const tick = () => {
        uniforms.uTime.value = performance.now() + timeOffset;
    }

    return { material, uniforms, tick };
}

