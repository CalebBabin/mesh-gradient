import { trailZero } from "../utils";
import { BaseShader } from "./BASE";

const type = "Checkerboard";
export class CheckerboardShader extends BaseShader {
	static type = type;
	type = type;

	defaults = {
		detail: { x: 1, y: 1 },
	};

	constructor(data = {}) {
		super(data);

		this.data = Object.assign(this.defaults, this.data);
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