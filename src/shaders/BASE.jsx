import { DoubleSide, ShaderMaterial } from "three";
import { EventEmitter } from "../emitter";
import GLSL_colorSpaces from './colorSpaces.glsl?raw';
import GLSL_simplexNoise3D from './simplex.glsl?raw';

function UI({ node, shader }) {
	return <div className="absolute inset-0 bg-red flex justify-center items-center text-center">
		<span>
			base node
		</span>
	</div>;
};

export class BaseShader extends EventEmitter {
	_data = {};
	connectIn = true;
	connectOut = true;
	UI = UI

	get data() {
		return this._data;
	}
	set data(newData = {}) {
		Object.assign(this._data, newData);
		this.broadcast('update', this._data);
	}

	constructor(data) {
		super();
		this.data = data;
	}

	recompile() {
		this.broadcast('recompile');
	}
	compile() {
		return { fragment: '', vertex: '' };
	}
}

/**
 * 
 * @param {Node} node 
 */
export function compileShaders(startNode) {
	const sharedStart = /* glsl */`
		precision highp float;

		varying vec2 vUv;
		varying vec2 originalUv;
		varying vec2 vertexNoise;

		uniform vec2 viewportSize;
		uniform float uTime;
		uniform float uScale;

		${GLSL_simplexNoise3D}
		${GLSL_colorSpaces}
	`;
	let compiledFrag = /* glsl */`
		${sharedStart}
		void main() {
			gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
	`;
	let compiledVert = /* glsl */`
		${sharedStart}
		void main() {
			if (viewportSize.x < viewportSize.y) {
				vUv = vec2(uv.x, uv.y * (viewportSize.y/viewportSize.x));
			} else {
				vUv = vec2(uv.x * (viewportSize.x/viewportSize.y), uv.y);
			}

			vUv *= vec2(uScale);
			originalUv = vec2(uv.x, uv.y);


			vertexNoise = vec2(
				simplexNoise3D(vec3(vUv.x * 0.25, vUv.y * 1.0, (uTime / 30000.0) * 0.3)),
				simplexNoise3D(vec3(vUv.x * 0.25, vUv.y * 0.25, (uTime / 30000.0) * 0.5))
			);


			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	`;


	const uniforms = {
		viewportSize: {
			value: [1.0, 1.0]
		},
		uTime: {
			value: performance.now(),
		},
		uScale: {
			value: 1,
		}
	};

	let currentNode = startNode;
	const recordedNodes = [];
	while (currentNode) {
		const node = currentNode;
		currentNode = node.out;

		if (recordedNodes.includes(node)) {
			console.error('Cyclic dependency detected');
			break;
		}
		recordedNodes.push(node);

		if (!node.shader) continue;
		try {
			const { fragment, vertex } = node.shader.compile();

			if (fragment) compiledFrag += '\n{\n' + fragment + '\n}\n';
			if (vertex) compiledVert += '\n{\n' + vertex + '\n}\n';
		} catch (e) {
			console.error(e);
			console.error('error compiling shader');
			console.log(node);
		}
	}

	compiledFrag += '\n}';
	compiledVert += '\n}';

	return {
		material: new ShaderMaterial({
			fragmentShader: compiledFrag,
			vertexShader: compiledVert,
			uniforms: uniforms,
			side: DoubleSide,
			depthTest: true,
			depthWrite: true,
			transparent: true,
		}),
		uniforms,
		tick: () => {
			uniforms.uTime.value = performance.now();
		}
	}
}