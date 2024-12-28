import { useEffect, useState } from "react";
import { useNodeData } from "../editor";
import { trailZero } from "../utils";
import { BaseShader, useShaderData } from "./BASE";
/** @typedef {import('../editor.jsx').Node} Node */


/**
 * 
 * @param {Node} node
 * @param {CheckerboardShader} shader 
 * @returns 
 */
function UI({ node, shader }) {
	const shaderData = useShaderData(shader);

	const maxBuffer = 100;

	const [bufferX, setBufferX] = useState(shaderData?.detail?.x || maxBuffer / 2);
	const [bufferY, setBufferY] = useState(shaderData?.detail?.y || maxBuffer / 2);
	const [bufferDouble, setBufferDouble] = useState(shaderData?.doubleChecker || 0);
	const [lockAspect, setLockAspect] = useState(true);

	useEffect(() => {
		shader.data = {
			detail: {
				x: Math.pow(bufferX / maxBuffer, 8) * 100,
				y: Math.pow(bufferY / maxBuffer, 8) * 100
			},
			doubleChecker: Math.round(bufferDouble),
		};
		node.recompile();
	}, [bufferX, bufferY, bufferDouble]);


	return <div className="absolute border-[silver+1rem+solid] inset-0 bg-red flex flex-col justify-center items-center text-center">
		<div style={{
			backgroundImage: 'url(/checkerboard.svg)',
			backgroundSize: ((node.id + 2) % 3 === 0 ? '512px' : '1024px'),
		}} className={"absolute inset-0 pointer-events-none -z-20 " + (node.id % 2 === 0 ? "rotate-180" : "")} />
		<div className="absolute inset-0 pointer-events-none -z-10  bg-black opacity-60" />
		<span className="relative z-10 font-thin text-3xl text-cyan-100">
			checkerboard
		</span>
		<button onClick={() => {
			shader.randomize();
			node.recompile();
		}} className="relative z-10 font-thin">
			random
		</button>
		<label>
			lock aspect ratio: <input
				type="checkbox"
				checked={lockAspect}
				onChange={e => {
					setLockAspect(!!e.target.checked);
				}}
			/>
		</label>
		<div className="field-row w-full">
			<label>x:</label>
			<label>0.1</label>
			<input
				className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
				type="range"
				min="0"
				max={maxBuffer}
				value={bufferX}
				onChange={e => {
					setBufferX(e.target.value);
					if (lockAspect) {
						setBufferY(e.target.value);
					}
				}}
			/>
			<label>maxBuffer</label>
		</div>
		<div className="field-row w-full">
			<label>y:</label>
			<label>0.1</label>
			<input
				className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
				type="range"
				min={0}
				step={1}
				max={maxBuffer}
				value={bufferY}
				onChange={e => {
					setBufferY(e.target.value);
					if (lockAspect) {
						setBufferX(e.target.value);
					}
				}}
			/>
			<label>{maxBuffer}</label>
		</div>
		<div className="field-row w-full">
			<label>double:</label>
			<label>0</label>
			<input
				className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
				type="range"
				min={0}
				step={1}
				max={100}
				value={bufferDouble}
				onChange={e => {
					setBufferDouble(e.target.value);
				}}
			/>
			<label>20</label>
		</div>
	</div>;
};

const type = "Checkerboard";
export class CheckerboardShader extends BaseShader {
	static type = type;
	type = type;
	UI = UI;

	defaults = {
		detail: { x: 1, y: 1 },
	};

	constructor(data = {}) {
		super(data);

		this.data = Object.assign({ ...this.defaults }, this.data);
	}

	randomize() {
		this.data = {
			detail: {
				x: Math.floor(Math.random() * 5) + 0.1,
				y: Math.floor(Math.random() * 5) + 0.1,
			},
		};
		this.recompile();
	}

	compile() {
		const data = this.data;

		return {
			fragment: /*glsl*/`
				vec3 speed = vec3(1.0, 1.0, 1.0);
				float slowTime = uTime * 0.00001;

				if (
					mod(
						floor(
							(vUv.x + slowTime * speed.x) * ${trailZero(data.detail.x)} * 10.0
						) + floor(
							(vUv.y + slowTime * speed.y) * ${trailZero(data.detail.y)} * 10.0
						),
						2.0
					) == 0.0
				) {
					if (
						mod(
							floor(
								(vUv.x + slowTime * speed.x) * ${trailZero(data.detail.x)} * ${trailZero(data.doubleChecker)} * 10.0
							) + floor(
								(vUv.y + slowTime * speed.y) * ${trailZero(data.detail.y)} * ${trailZero(data.doubleChecker)} * 10.0
							),
							2.0
						) == 0.0) {
						gl_FragColor *= vec4(0.5);
					}
				}
			`}
	}
}