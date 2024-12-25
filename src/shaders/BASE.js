import { DoubleSide, ShaderMaterial } from "three";
import { EventEmitter } from "../emitter";
import GLSL_colorSpaces from './colorSpaces.glsl?raw';

export class BaseShader extends EventEmitter {
	_data = {};
	get data() {
		return _data;
	}
	set data(newData = {}) {
		Object.assign(this._data, newData);
		this.broadcast('update', this._data);
	}

	constructor(data) {
		super();
		this.data = data;
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

		uniform vec2 viewportSize;
		uniform float uTime;
		uniform float uScale;

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
	while (currentNode) {
		const node = currentNode;
		currentNode = node.out;

		if (!node.shader) continue;
		const { fragment, vertex } = node.shader.compile();

		if (fragment) compiledFrag += '\n{\n' + fragment + '\n}\n';
		if (vertex) compiledVert += '\n{\n' + vertex + '\n}\n';
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