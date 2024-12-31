import { trailZero } from "../utils";
import { XYSliderWithGraph } from "../utils/xyzInput";
import { BaseShader, useShaderData } from "./BASE";

export class StartShader extends BaseShader {
	type = "StartShader"
	connectIn = false;

	defaults = {
		speed: [0, 0],
		detail: [0, 0],
	};

	UI = () => {
		const data = useShaderData(this);
		return <div className="text-[#222] p-2 pt-6 absolute inset-0">
			<div className="text-lg font-thin text-right">start node</div>
			<XYSliderWithGraph label="speed" data={data.speed} onChange={v => {
				this.data = {
					speed: v,
				};
			}} />
			<XYSliderWithGraph label="detail" data={data.detail} onChange={v => {
				this.data = {
					detail: v,
				};
			}} />
		</div>
	}

	constructor(data = {}) {
		super(data);

		this.data = {
			...this.defaults,
			...data,
		};
	}


		compile() {
			const data = this.data;
			return {
				vertex: /*glsl*/`
					vUv.x *= ${trailZero(data.detail[0] + 1.0)};
					vUv.y *= ${trailZero(data.detail[1] + 1.0)};

					time *= ${trailZero(Math.pow(data.speed[0] + 1.0, 2))};
				`
			}
		}
}
