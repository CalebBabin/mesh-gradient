import { BaseShader } from "./BASE";

export class StartShader extends BaseShader {
	type = "StartShader"
	connectIn = false;

	UI = () => <div className="absolute inset-0 bg-[silver] flex justify-center items-center text-center">
		<span className="text-white font-thin text-5xl">
			start node
		</span>
	</div>

	constructor(data = {}) {
		super(data);
	}
}
export class StopShader extends BaseShader {
	type = "StopShader"
	connectOut = false;

	UI = () => <div className="absolute inset-0 bg-[silver] flex justify-center items-center text-center">
		<span className="text-white font-thin text-5xl">
			stop node
		</span>
	</div>

	constructor(data = {}) {
		super(data);
	}
}