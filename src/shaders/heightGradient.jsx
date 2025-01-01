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

	return <div className="p-2 flex flex-col justify-center items-center text-center">
		<div className="flex justify-stretch w-full text-black">
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
						invert
					</label>
				</div>

				<div>
					<label>
						min:
						<input
							type="range"
							min="0"
							max={sliderResolution}
							step="1"
							value={sData.minHeight * sliderResolution}
							onChange={e => {
								const value = Number(e.target.value) / sliderResolution;
								shader.data = {
									minHeight: value,
									maxHeight: Math.max(sData.maxHeight,  value + 0.001),
								}
							}}
						/>
					</label>
					<label>
						max:
						<input
							type="range"
							min="0"
							max={sliderResolution}
							step="1"
							value={sData.maxHeight * sliderResolution}
							onChange={e => {
								const value = Number(e.target.value) / sliderResolution;
								shader.data = {
									minHeight: Math.min(sData.minHeight, value - 0.001),
									maxHeight: value,
								}
							}}
						/>
					</label>


					<label>
						scale:
						<input
							type="range"
							min="0.1"
							max={20}
							step="0.1"
							value={sData.scale}
							onChange={e => {
								shader.data = {
									scale: Number(e.target.value),
								}
							}}
						/>
					</label>
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

		scale: 3,

		minHeight: 0.45,
		maxHeight: 0.95,
	};

	constructor(data = {}) {
		super(data);

		this.data = {
			...this.defaults,
			...data,
		};
	}

	compile() {
		const data = this.data;
		const colorA = rgbToLch(data.colorA);
		const colorB = rgbToLch(data.colorB);
		const scale = data.scale ?? 2;
		const minHeight = -(data.minHeight - 0.5) * scale;
		const maxHeight = -(data.maxHeight - 0.5) * scale;
		return {
			fragment: /*glsl*/`
				vec4 colorA = vec4(${trailZero(colorA.l)}, ${trailZero(colorA.c)}, ${trailZero(colorA.h)}, ${trailZero(data.colorA.a)});
				vec4 colorB = vec4(${trailZero(colorB.l)}, ${trailZero(colorB.c)}, ${trailZero(colorB.h)}, ${trailZero(data.colorB.a)});

				float minHeight = ${trailZero(minHeight)};
				float maxHeight = ${trailZero(maxHeight)};

				color = lch_to_rgb(
					mix(
						colorA, 
						colorB, 
						${data.yAxis ? '1.0 - ': ''} min(
							1.0, 
							max(
								0.0, 
								(vPos.y - minHeight) / (maxHeight - minHeight)
							)
						)
					)
				);
			`
		}
	}
}