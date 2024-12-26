import { useNodeData } from "../editor";
import { trailZero } from "../utils";
import { BaseShader } from "./BASE";
/** @typedef {import('../editor.jsx').Node} Node */
/**
 * 
 * @param {Node} node
 * @param {CheckerboardShader} shader 
 * @returns 
 */
function UI({ node, shader }) {
	return <div className="absolute border-[silver+1rem+solid] inset-0 bg-red flex flex-col justify-center items-center text-center">
		<div style={{
			backgroundImage: 'url(/checkerboard.svg)',
			backgroundSize: ((node.id + 2) % 3 === 0 ? '512px' : '1024px'),
		}} className={"absolute inset-0 " + (node.id % 2 === 0 ? "rotate-180" : "")} />
		<div className="absolute inset-0 bottom-[70%] bg-black opacity-20" />
		<span className="relative z-10 font-thin text-3xl text-cyan-100">
			checkerboard
		</span>
		<button onClick={() => {
			shader.randomize();
			node.recompile();
		}} className="relative z-10 font-thin">
			checkerboard
		</button>
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

		this.data = Object.assign(this.defaults, this.data);
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
								(vUv.x + slowTime * speed.x) * ${trailZero(data.detail.x)} * 10.0 * 10.0
							) + floor(
								(vUv.y + slowTime * speed.y) * ${trailZero(data.detail.y)} * 10.0 * 10.0
							),
							2.0
						) == 0.0) {
						gl_FragColor *= vec4(0.5);
					}
				}
			`}
	}
}