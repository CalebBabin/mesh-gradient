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

	const [bufferX, setBufferX] = useState(maxBuffer / 2);
	const [bufferY, setBufferY] = useState(maxBuffer / 2);
	const [bufferDouble, setBufferDouble] = useState(shaderData?.doubleChecker || 0);
	const [lockAspect, setLockAspect] = useState(true);

	useEffect(() => {
		shader.data = {
			detail: {
				x: Math.round(Math.pow(bufferX / maxBuffer, 2) * maxBuffer),
				y: Math.round(Math.pow(bufferY / maxBuffer, 2) * maxBuffer),
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
					const v = Number(e.target.value);
					setBufferX(v);
					if (lockAspect) {
						setBufferY(v);
					}
				}}
			/>
			<label>{maxBuffer}</label>
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
					const v = Number(e.target.value);
					setBufferY(v);
					if (lockAspect) {
						setBufferX(v);
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
				max={maxBuffer}
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

		const detailX = data.detail.x + 1;
		const detailY = data.detail.y + 1;
		return {
			fragment: /*glsl*/`
				vec3 speed = vec3(1.0, 1.0, 1.0);
				float slowTime = uTime * 0.00001;

				float x = (vUv.x + slowTime * speed.x) * ${trailZero(detailX)};
				float y = (vUv.y + slowTime * speed.y) * ${trailZero(detailY)};
				if (
					mod(
						floor(x) + floor(y),
						2.0
					) == 0.0
				) {
					if (
						mod(
							floor(
								x * ${trailZero(data.doubleChecker)}
							)
							+
							floor(
								y * ${trailZero(data.doubleChecker)}
							),
							2.0
						) == 0.0) {
						gl_FragColor *= vec4(0.5, 0.5, 0.5, 1.0);
					}
				}
			`}
	}
}