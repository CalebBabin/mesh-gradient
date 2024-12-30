import { trailZero } from "../utils.js";
import { ColorPicker } from "../utils/colorPicker.jsx";
import { rgbToLch } from "../utils/colorSpaces.jsx";
import { BaseShader, StrengthSlider, useShaderData } from "./BASE.jsx";


/** @typedef {import('../editor.jsx').Node} Node */

/**
 * 
 * @param {Node} node
 * @param {CheckerboardShader} shader 
 * @returns {JSX.Element} UI
 */
function UI({ node, shader }) {
	const sData = useShaderData(shader);

	const sliderResolution = 1000;

	return <div className="absolute inset-0 p-2 bg-red flex flex-col justify-center items-center text-center">
		<div className="flex justify-stretch w-full pt-6 text-black">
			<StrengthSlider shader={shader} />
			<div>
				<span className="relative z-10 font-thin text-3xl">
					<ColorPicker color={sData.colorA} onChange={color => {
						shader.data = {
							colorA: color.rgb,
						}
					}} />
					<ColorPicker color={sData.colorB} onChange={color => {
						shader.data = {
							colorB: color.rgb,
						}
					}} />
				</span>

				<div>
					<input
						type="checkbox"
						id={"yAxis" + node.id}
						checked={sData.yAxis}
						onChange={e => {
							shader.data = { yAxis: e.target.checked }
						}}
					/>
					<label htmlFor={"yAxis" + node.id}>
						y axis
					</label>
				</div>

				<div>
					<input
						className="has-box-indicator"
						type="range"
						min="0"
						max={sliderResolution}
						step="1"
						value={Math.min(sData.minHeight, sData.maxHeight) * sliderResolution}
						onChange={e => {
							shader.data = {
								minHeight: e.target.value / sliderResolution,
							}
						}}
					/>
					<input
						className="has-box-indicator"
						type="range"
						min="0"
						max={sliderResolution}
						step="1"
						value={Math.max(sData.minHeight, sData.maxHeight) * sliderResolution}
						onChange={e => {
							shader.data = {
								maxHeight: e.target.value / sliderResolution,
							}
						}}
					/>
				</div>
			</div>
		</div>
	</div>;
};

const type = "HeightGradient";
export class HeightGradientShader extends BaseShader {
	static type = type;
	type = type;
	UI = UI;

	defaults = {
		blendMode: 'multiply',
		colorA: { r: 74, g: 236, b: 255, a: 1 },
		colorB: { r: 255, g: 0, b: 142, a: 1 },

		minHeight: -0.1,
		maxHeight: 1,
	};

	constructor(data = {}) {
		super(data);

		this.data = {
			...this.defaults,
			speed: [
				(Math.random() * 2 - 1) * 0.25,
				(Math.random() * 2 - 1) * 0.25,
			],
			...data,
		};
	}

	compile() {
		const data = this.data;
		const colorA = rgbToLch(data.colorA);
		const colorB = rgbToLch(data.colorB);

		const minHeight = (Math.min(data.minHeight, data.maxHeight) - 0.5) * 30.0;
		const maxHeight = (Math.max(data.minHeight, data.maxHeight) - 0.5) * 30.0;
		return {
			fragment: /*glsl*/`
				vec4 colorA = vec4(${trailZero(colorA.l)}, ${trailZero(colorA.c)}, ${trailZero(colorA.h)}, ${trailZero(colorA.a)});
				vec4 colorB = vec4(${trailZero(colorB.l)}, ${trailZero(colorB.c)}, ${trailZero(colorB.h)}, ${trailZero(colorB.a)});

				float minHeight = ${trailZero(minHeight)};
				float maxHeight = ${trailZero(maxHeight)};

				color = lch_to_rgb(
					mix(
						colorA, 
						colorB, 
						min(1.0, 
							max(0.0, 
								(vPos.y - minHeight) / (maxHeight - minHeight)
							)
						)
					)
				);
			`
		}
	}
}