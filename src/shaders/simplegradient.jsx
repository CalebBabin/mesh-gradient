import { trailZero } from "../utils.js";
import { ColorPicker } from "../utils/colorPicker.jsx";
import { rgbToLch } from "../utils/colorSpaces.jsx";
import { BaseShader, StrengthSlider, useShaderData } from "./BASE.jsx";


/** @typedef {import('../editor.jsx').Node} Node */


const maxSize = 500;
const maxHeight = 5000;


/**
 * 
 * @param {Node} node
 * @param {CheckerboardShader} shader 
 * @returns {JSX.Element} UI
 */
function UI({ node, shader }) {
	const sData = useShaderData(shader);

	return <div className="absolute inset-0 p-2 bg-red flex flex-col justify-center items-center text-center">
		<div className="flex justify-stretch w-full pt-6 text-black">
			<StrengthSlider shader={shader} />
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
		</div>
	</div>;
};

const type = "SimpleGradient";
export class SimpleGradientShader extends BaseShader {
	static type = type;
	type = type;
	UI = UI;

	defaults = {
		blendMode: 'multiply',
		colorA: { r: 74, g: 236, b: 255, a: 1 },
		colorB: { r: 255, g: 0, b: 142, a: 1 },
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
		const colorA = rgbToLch(this.data.colorA);
		const colorB = rgbToLch(this.data.colorB);

		return {
			fragment: /*glsl*/`
				vec4 colorA = vec4(${trailZero(colorA.l)}, ${trailZero(colorA.c)}, ${trailZero(colorA.h)}, ${trailZero(colorA.a)});
				vec4 colorB = vec4(${trailZero(colorB.l)}, ${trailZero(colorB.c)}, ${trailZero(colorB.h)}, ${trailZero(colorB.a)});

				color = lch_to_rgb(mix(colorA, colorB, vUv.x));
			`
		}
	}
}