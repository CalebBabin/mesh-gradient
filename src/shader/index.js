import { FrontSide, ShaderMaterial } from 'three';
import GLSL_colorSpaces from './colorSpaces.glsl?raw';

import GLSL_simplexNoise3D from './noise/simplex.glsl?raw';
const timeOffset = Math.random() * -10000000;

const fragmentShader = /*glsl*/`
	precision highp float;
	varying vec2 vUv;
	varying vec2 originalUv;
	varying float height;
	varying vec2 swirlOffset;
	uniform float uTime;

	${GLSL_colorSpaces}

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
        name: 'Smoothing Noise',
        description: 'Smooths out the surface of the plane',
        vertex: /*glsl*/`
        offset.y = mix(
            offset.y,
            pow(offset.y * simplexNoise3D(vec3(
                vUv.x * detail.x * 1.0 + slowTime,
                vUv.y * detail.y * 5.0 + slowTime * 0.5,
                slowTime * 0.1
            )), 2.0),
            clamp(0.0, abs(scale.y), 1.0)
        );`},
};
window.vertexDictionary = vertexDictionary;


function trailZero(num) {
    if (isNaN(num)) return '1.0';
    if (num % 1 === 0) {
        return String(num) + '.0';
    }
    return String(num);
}

export function generateMaterial(options = {}) {

    let vertexConfigOutput = '';
    for (let i = 0; i < options.vertexConfig.length; i++) {
        const conf = options.vertexConfig[i];
        const preset = vertexDictionary[conf.name];

        if (typeof conf.scale === 'number') {
            conf.scale = { x: conf.scale, y: conf.scale, z: conf.scale };
        }
        vertexConfigOutput += 'slowTime = uTime * ' + trailZero(conf.speed * 0.00001) + ';\n';
        vertexConfigOutput += 'scale.x = ' + trailZero(conf.scale.x) + ';\n';
        vertexConfigOutput += 'scale.y = ' + trailZero(conf.scale.y) + ';\n';
        vertexConfigOutput += 'scale.z = ' + trailZero(conf.scale.z) + ';\n';
        vertexConfigOutput += 'detail.x = ' + trailZero(conf.detail.x) + ';\n';
        vertexConfigOutput += 'detail.y = ' + trailZero(conf.detail.y) + ';\n';
        vertexConfigOutput += 'detail.z = ' + trailZero(conf.detail.z) + ';\n';
        vertexConfigOutput += preset.vertex;
    }
    const vertexShader = /*glsl*/`
        varying vec2 vUv;
        varying vec2 originalUv;
        varying vec2 swirlOffset;
        varying float height;
        uniform vec2 viewportSize;
        uniform float uTime;

        ${GLSL_simplexNoise3D}

        void main() {
            if (viewportSize.x < viewportSize.y) {
                vUv = vec2(uv.x, uv.y * (viewportSize.y/viewportSize.x));
            } else {
                vUv = vec2(uv.x * (viewportSize.x/viewportSize.y), uv.y);
            }
            originalUv = vec2(uv.x, uv.y);

            vec3 offset = vec3(0.0);

            float speed = 1.0;
            vec3 scale = vec3(1.0);
            vec3 detail = vec3(1.0);
            float slowTime = uTime;
            ${vertexConfigOutput}
        
            height = offset.y;

            swirlOffset = vec2(
                simplexNoise3D(vec3(vUv.x * 0.2, vUv.y * 3.0, (uTime / 30000.0) * 0.3)),
                simplexNoise3D(vec3(vUv.x * 2.0, vUv.y * 2.0, (uTime / 30000.0) * 0.5))
            );

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

