import { useEffect, useState } from "react";
import { trailZero } from "../utils";
import { BaseShader, useShaderData } from "./BASE";
import { XYInput } from "../utils/xyzInput.jsx";
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

	const [tilesX, setTilesX] = useState(shader.data.x);
	const [tilesY, setTilesY] = useState(shader.data.y);
	const [bufferDouble, setBufferDouble] = useState(shader.data.doubleChecker);
	const [lockAspect, setLockAspect] = useState(true);
	const [speed, setSpeed] = useState(shader.data?.speed ? [shader.data.speed.x, shader.data.speed.y] : [-0.5, 0.5]);

	useEffect(() => {
		shader.data = {
			x: Math.round(Math.pow(tilesX / maxBuffer, 2) * maxBuffer),
			y: Math.round(Math.pow(tilesY / maxBuffer, 2) * maxBuffer),
			speed: { x: speed[0], y: speed[1] },
			doubleChecker: Math.round(bufferDouble),
		};
		node.recompile();
	}, [tilesX, tilesY, bufferDouble, speed]);


	return <div className="absolute inset-0 bg-red flex flex-col justify-center items-center text-center">
		<div style={{
			backgroundImage: 'url(/checkerboard.svg)',
			backgroundSize: ((node.id + 2) % 3 === 0 ? '512px' : '1024px'),
		}} className={"absolute inset-0 pointer-events-none -z-20 " + (node.id % 2 === 0 ? "rotate-180" : "")} />
		<div className="absolute inset-0 pointer-events-none -z-10  bg-black opacity-60" />
		<span className="relative z-10 font-thin text-3xl text-cyan-100">
			checkerboard
		</span>
		<button onClick={() => {
			setTilesX(Math.floor(Math.random() * maxBuffer));
			setTilesY(Math.floor(Math.random() * maxBuffer));
			setSpeed([Math.random() * 2 - 1, Math.random() * 2 - 1])
			setBufferDouble(Math.floor(Math.random() * maxBuffer));
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
				value={tilesX}
				onChange={e => {
					const v = Number(e.target.value);
					setTilesX(v);
					if (lockAspect) {
						setTilesY(v);
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
				value={tilesY}
				onChange={e => {
					const v = Number(e.target.value);
					setTilesY(v);
					if (lockAspect) {
						setTilesX(v);
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

		<XYInput data={speed} onChange={setSpeed} />
	</div>;
};

const type = "Checkerboard";
export class CheckerboardShader extends BaseShader {
	static type = type;
	type = type;
	UI = UI;

	defaults = {
		x: 50,
		y: 50,
		doubleChecker: 1,
		speed: { x: -0.5, y: 0.5, z: 1 },
	};

	constructor(data = {}) {
		super(data);
		this.data = Object.assign({ ...this.defaults }, this.data);
	}


	compile() {
		const data = this.data;

		const detailX = data.x + 1;
		const detailY = data.y + 1;
		return {
			fragment: /*glsl*/`
				vec3 speed = vec3(${trailZero(data.speed.x)}, ${trailZero(data.speed.y)}, ${trailZero(data.speed.z)});
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