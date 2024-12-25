import { BaseShader } from "./BASE";

export class StartShader extends BaseShader {
	type = "StartShader"

	constructor(data = {}) {
		super(data);
	}
}
export class StopShader extends BaseShader {
	type = "StopShader"

	constructor(data = {}) {
		super(data);
	}
}