import { FrontSide, ShaderMaterial } from 'three';
import GLSL_colorSpaces from './colorSpaces.glsl?raw';

import GLSL_simplexNoise3D from './noise/simplex.glsl?raw';

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

		vec3 pos = position;

		float offset = 0.0;
		float slowTime = uTime / 30000.0;
		offset += simplexNoise3D(vec3(
			vUv.x * 1.0,
			vUv.y * 5.0 + slowTime * 0.25,
			slowTime
		));
		//offset += simplexNoise3D(vec3(vUv.x * 1.0 * 0.75 + slowTime, vUv.y * 1.0 * 2.0, slowTime * 2.0)) * 0.05;

		swirlOffset = vec2(
			simplexNoise3D(vec3(vUv.x * 0.2, vUv.y * 3.0, slowTime * 0.3)),
			simplexNoise3D(vec3(vUv.x * 2.0, vUv.y * 2.0, slowTime * 0.5))
		);

		// extra wavyness
		offset -= (sin(uv.y * 250.0) + 1.0) * 0.5 * (pow(cos(vUv.y * 40.0 + slowTime * 0.2) * 0.5 + 0.5, 3.0) * pow(cos(vUv.x * 3.0 + vUv.y * 2.0 + slowTime * 0.3) * 0.5 + 0.5, 3.0));
	
		height = offset;
		pos.z -= offset * 0.5;

		gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
	}
`;





function generateMaterial(options = {}) {
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
        uniforms.uTime.value = performance.now();
    }

    return { material, uniforms, tick };
}


export { generateMaterial }