import { useEffect, useState } from "react";
import { trailZero } from "../utils";
import { BaseShader, StrengthSlider, useShaderData } from "./BASE";
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
	const [lockAspect, setLockAspect] = useState(true);

	return <div className="absolute inset-0 p-2 bg-red flex flex-col justify-center items-center text-center">
		<div style={{
			backgroundImage: 'url(/checkerboard.svg)',
			backgroundSize: ((node.id + 2) % 3 === 0 ? '512px' : '1024px'),
		}} className={"absolute inset-[3px] pointer-events-none -z-20 " + (node.id % 2 === 0 ? "rotate-180" : "")} />
		<div className="absolute inset-[3px] pointer-events-none -z-10 bg-black opacity-60" />
		<div className="flex justify-stretch w-full pt-6">
			<StrengthSlider shader={shader} />
			<div className="flex flex-col justify-center items-center">
				<div className="flex items-center justify-between">
					<div className="w-[75%]">
						<div className="flex gap-2 mb-2 items-center">
							<button onClick={() => {
								shader.data = {
									x: Math.floor(Math.random() * maxBuffer),
									y: Math.floor(Math.random() * maxBuffer),
									speed: [Math.random() * 2 - 1, Math.random() * 2 - 1],
									doubleChecker: Math.floor(Math.random() * maxBuffer),
								};
							}} className="relative z-10 font-thin">
								random
							</button>
							<div>
								<input
									type="checkbox"
									id={"lockAspect" + node.id}
									checked={!!lockAspect}
									onChange={e => {
										setLockAspect(e.target.checked);
									}}
								/>
								<label htmlFor={"lockAspect" + node.id}>
									lock ratio?
								</label>
							</div>
						</div>
						<div className="field-row w-full">
							<label>x:</label>
							<label>0.1</label>
							<input
								className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
								type="range"
								min="0"
								max={maxBuffer}
								value={shaderData.x}
								onChange={e => {
									const v = Number(e.target.value);
									shader.data = {
										x: v,
										y: lockAspect ? v : shaderData.y
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
								value={shaderData.y}
								onChange={e => {
									const v = Number(e.target.value);
									shader.data = {
										x: lockAspect ? v : shaderData.x,
										y: v,
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
								value={shader.doubleChecker}
								onChange={e => {
									shader.data = {
										doubleChecker: Number(e.target.value),
									}
								}}
							/>
							<label>20</label>
						</div>

					</div>
					<div>
						<XYInput data={shaderData.speed} onChange={v => {
							shader.data = {
								speed: v,
							}
						}} />
					</div>
				</div>
			</div>
		</div>
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
		doubleChecker: 5,
		speed: [-0.5, 0.5, 1],
		blendMode: 'multiply',
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
		vec3 speed = vec3(${trailZero(data.speed[0])}, ${trailZero(data.speed[1])}, ${trailZero(data.speed[2])});
		float slowTime = uTime * 0.00001;

		float x = (vUv.x + slowTime * speed.x) * ${trailZero(detailX)};
		float y = (vUv.y + slowTime * speed.y) * ${trailZero(detailY)};
		if (mod(floor(x) + floor(y), 2.0) == 0.0) {
			if (mod(
				floor(x * ${trailZero(data.doubleChecker)}) +
				floor(y * ${trailZero(data.doubleChecker)}),
				2.0
			) == 0.0) {
				color *= vec4(0.5, 0.5, 0.5, 1.0);
			}
		}`}
	}
}