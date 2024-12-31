import { trailZero } from "../utils";
import { XYZSliderWithGraph } from "../utils/xyzInput";
import { BaseShader, useShaderData } from "./BASE";

export class StartShader extends BaseShader {
	type = "Start"
	connectIn = false;

	defaults = {
		timeOffset: (Math.random() - 1) * 100000,
		speed: [-0.5, -0.5, -0.5],
		detail: [0, 0, 0],
	};

	UI = () => {
		const data = useShaderData(this);
		return <div className="text-[#222] p-2 absolute inset-0 box-border overflow-y-auto">
			<div className="flex justify-between items-center">
				<button onClick={() => {
					this.data = {
						timeOffset: (Math.random() - 0.5) * 100000,
					};
				}}>random time</button>
				<div className="text-lg font-thin text-right">start node</div>
			</div>

			<XYZSliderWithGraph label="speed" data={data.speed} onChange={v => {
				this.data = {
					speed: v,
				};
			}} />
			<XYZSliderWithGraph label="detail" data={data.detail} onChange={v => {
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
		const shared = /*glsl*/`
			vUv.x *= ${trailZero(data.detail[0] + 1.0)};
			vUv.y *= ${trailZero(data.detail[1] + 1.0)};


			time.x = uTime * ${trailZero(Math.pow(data.speed[0] + 1.0, 2))};
			time.y = uTime * ${trailZero(Math.pow(data.speed[1] + 1.0, 2))};
			time.z = uTime * ${trailZero(Math.pow(data.speed[2] + 1.0, 2))};

			time.x += ${trailZero(data.timeOffset)};
			time.y += ${trailZero(data.timeOffset)};
			time.z += ${trailZero(data.timeOffset)};
		`;


		return {
			fragment: /*glsl*/`
				${shared}
			`,
			vertex: /*glsl*/`
				globalHeightScale = ${trailZero(data.detail[2] + 1.0)};
				${shared}
			`,
		}
	}
}
