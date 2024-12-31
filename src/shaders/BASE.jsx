import { DoubleSide, ShaderMaterial } from "three";
import { EventEmitter } from "../emitter";
import GLSL_colorSpaces from './colorSpaces.glsl?raw';
import GLSL_simplexNoise3D from './simplex.glsl?raw';
import { useEffect, useState } from "react";
import { trailZero } from "../utils";

export function StrengthSlider({ shader }) {
	const shaderData = useShaderData(shader);

	return <div className="field-row w-6" title="strength">
		<div className="is-vertical">
			<input
				className="has-box-indicator"
				type="range"
				min="0"
				max="255"
				step="1"
				value={shaderData.strength ?? 255}
				onChange={e => {
					shader.data = {
						strength: e.target.value,
					}
				}}
			/>
		</div>
	</div>
}

function UI({ node, shader }) {
	return <div className="absolute inset-0 flex justify-center items-center text-center">
		<span>
			base node
		</span>
	</div>;
};

export const useShaderData = (shader) => {
	const [data, setData] = useState(shader ? { ...shader.data } : false);
	useEffect(() => {
		const listener = () => {
			setData({ ...shader.data });
		};
		listener();
		shader.on('update', listener);
		shader.on('recompile', listener);
		return () => {
			shader.off('update', listener);
			shader.off('recompile', listener);
		};
	}, [shader]);
	return data;
}


export class BaseShader extends EventEmitter {
	_data = {};
	connectIn = true;
	connectOut = true;
	UI = UI

	recompileTimeout = null;

	get data() {
		return this._data;
	}
	set data(newData = {}) {
		Object.assign(this._data, newData);
		this.broadcast('update', this._data);

		if (this.recompileTimeout) {
			clearTimeout(this.recompileTimeout)
		}
		this.recompileTimeout = setTimeout(this.recompile.bind(this), 100);
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

export const blendModes = {
	'add': /*glsl*/`+`,
	'subtract': /*glsl*/`-`,
	'multiply': /*glsl*/`*`,
	'divide': /*glsl*/`/`,
	'set': /*glsl*/`=`,
}

/**
 * 
 * @param {Node} node 
 */
export function compileShaders(startNode) {
	const sharedStart = /* glsl */`
		precision highp float;

		varying vec2 vertexUv;
		varying vec2 originalUv;
		varying vec2 vertexNoise;

		varying vec3 vPos;

		uniform vec2 viewportSize;
		uniform float uTime;
		uniform float uScale;


		${GLSL_simplexNoise3D}
		${GLSL_colorSpaces}
	`;
	let compiledFrag = /* glsl */`
		${sharedStart}
		void main() {
			vec2 vUv = vertexUv;
			vec3 time = vec3(uTime);
			vec4 color = vec4(1.0);
			gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
	`;
	let compiledVert = /* glsl */`
		${sharedStart}
		void main() {
			float globalHeightScale = 1.0;
			vec3 time = vec3(uTime);
			vec2 vUv = vec2(uv.x, uv.y);
			if (viewportSize.x < viewportSize.y) {
				vUv = vec2(uv.x, uv.y * (viewportSize.y/viewportSize.x));
			} else {
				vUv = vec2(uv.x * (viewportSize.x/viewportSize.y), uv.y);
			}
			vUv *= vec2(uScale);
			originalUv = vec2(uv.x, uv.y);
			vec3 final_offset = vec3(0.0);
			vec3 offset = vec3(0.0);
			vertexNoise = vec2(
				simplexNoise3D(vec3(vUv.x * 0.25, vUv.y * 1.0, (uTime / 30000.0) * 0.3)),
				simplexNoise3D(vec3(vUv.x * 0.25, vUv.y * 0.25, (uTime / 30000.0) * 0.5))
			);
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

		const shader = node.shader;
		if (!shader) continue;
		try {
			const { fragment, vertex } = shader.compile();
			if (fragment) {
				compiledFrag += `{
				color.x = 0.0;
				color.y = 0.0;
				color.z = 0.0;
				color.w = 1.0;

				${fragment}\n`;

				if (shader.data.blendMode === 'set') {
					compiledFrag += `gl_FragColor = mix(gl_FragColor, color, ${trailZero((shader.data.strength ?? 255) / 255)});`;
				} else {
					compiledFrag += `gl_FragColor = mix(gl_FragColor, gl_FragColor ${blendModes[shader.data.blendMode ?? 'add']} color, ${trailZero((shader.data.strength ?? 255) / 255)});`;
				}
				compiledFrag += `}`;
			}
			if (vertex) {
				compiledVert += `{
				offset = vec3(0.0);
				${vertex}\n`;

				if (shader.data.blendMode === 'set') {
					compiledVert += `final_offset = mix(final_offset, offset, ${trailZero((shader.data.strength ?? 255) / 255)});`;
				} else {
					compiledVert += `final_offset = mix(final_offset, final_offset ${blendModes[shader.data.blendMode ?? 'add']} offset, ${trailZero((shader.data.strength ?? 255) / 255)});`;
				}

				compiledVert += '\n}';
			}
		} catch (e) {
			console.error(e);
			console.error('error compiling shader');
			console.log(node);
		}
	}

	compiledFrag += '\n}';
	compiledVert += /*glsl*/`
		vPos = final_offset;
		vertexUv = uv;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position + vec3(final_offset.x, final_offset.z, final_offset.y * globalHeightScale), 1.0);
	}
	`;

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