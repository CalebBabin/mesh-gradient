import { trailZero } from "../utils";
import { BaseShader } from "./BASE";

export class Checkerboard extends BaseShader {
	type = "Checkerboard";

	defaults = {
		detail: { x: 1, y: 1 },
	};

	constructor(data = {}) {
		super(data);
	}

	compile() {
		const data = this.data;

		return {
			fragment: /*glsl*/`
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
						gl_FragColor *= vec4(0.96);
					}
				}
			`}
	}
}