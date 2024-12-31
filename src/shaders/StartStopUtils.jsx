import { BaseShader } from "./BASE";

export class StartShader extends BaseShader {
	type = "StartShader"
	connectIn = false;

	UI = () => <div className="w-full h-full text-[#222] absolute inset-0 text-center flex justify-center items-center text-lg">
			start node
	</div>

	constructor(data = {}) {
		super(data);
	}
}
export class StopShader extends BaseShader {
	type = "StopShader"
	connectOut = false;

	UI = () => <div className="w-full h-full text-center flex justify-center items-center">
		<span className="text-white font-thin text-5xl">
			stop node
		</span>
	</div>

	constructor(data = {}) {
		super(data);
	}
}