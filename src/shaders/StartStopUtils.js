import { BaseShader } from "./BASE";

export class StartShader extends BaseShader {
	type = "StartShader"
	connectIn = false;

	constructor(data = {}) {
		super(data);
	}
}
export class StopShader extends BaseShader {
	type = "StopShader"
	connectOut = false;

	constructor(data = {}) {
		super(data);
	}
}