import { useEffect, useState } from "react";
import { trailZero } from "../utils.js";
import { BaseShader, useShaderData } from "./BASE.jsx";
import { XYInput } from "../utils/xyzInput.jsx";


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
		<div className="absolute inset-0 pointer-events-none -z-10  bg-black opacity-60" />
		<span className="relative z-10 font-thin text-3xl text-cyan-100">
			gradient
		</span>

	</div>;
};

const type = "SimpleGradient";
export class SimpleGradientShader extends BaseShader {
	static type = type;
	type = type;
	UI = UI;

	defaults = {
		blendMode: 'multiply',
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
		return {
			fragment: /*glsl*/`
				color = vec4(vUv.x, vUv.y, 1.0, 1.0);
			`
		}
	}
}