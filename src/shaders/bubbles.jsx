import { trailZero } from "../utils";
import { BaseShader, StrengthSlider, useShaderData } from "./BASE";
import { XYSliderWithGraph } from "../utils/xyzInput.jsx";


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

	return <div className="inset-0 absolute p-2 flex flex-col justify-center items-center text-center text-[#222]">
		<div className="flex justify-stretch w-full">
			<StrengthSlider shader={shader} />
			<div>
				<div className="field-row w-full">
					<label>size:</label>
					<label>1</label>
					<input
						className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
						type="range"
						min="1"
						max={maxSize}
						value={((1 - sData.size) * maxSize)}
						onChange={e => {
							shader.data = {
								size: (maxSize - Number(e.target.value)) / maxSize,
							}
						}}
					/>
					<label>{Number(maxSize).toLocaleString('en-US')}</label>
				</div>
				<div className="field-row w-full">
					<label>height:</label>
					<label>0</label>
					<input
						className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
						type="range"
						min={0}
						step={1}
						max={maxHeight}
						value={sData.height * maxHeight || 0}
						onChange={e => {
							shader.data = {
								height: e.target.value / maxHeight
							};
						}}
					/>
					<label>{maxHeight}</label>
				</div>

				<XYSliderWithGraph label="speed" data={sData.speed} onChange={v => {
					shader.data = {
						speed: v,
					};
				}} />
			</div>
		</div>
	</div>;
};

const type = "Bubble";
export class BubbleShader extends BaseShader {
	static type = type;
	type = type;
	UI = UI;

	defaults = {
		size: 0.65,
		height: 1,
		speed: [0, 0, 0],
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
		const { size, height, speed } = this.data;

		if (!size || !height || !speed) {
			return {};
		}
		return {
			vertex: /*glsl*/`
            vec3 speed = vec3(${trailZero(speed[0])}, ${trailZero(speed[1])}, 0.0);
            float slowTime = 0.001;


            float tileCount = ${trailZero(Math.pow(size, 4.0) * maxSize)};
            float tileSize = 1.0 / tileCount;

            float initialX = vUv.x * tileCount + (time.x * slowTime) * speed.x;
            float initialY = vUv.y * tileCount + (time.y * slowTime) * speed.y;

            float localX = (initialX - floor(initialX));
            float localY = (initialY - floor(initialY));

			if (mod(floor(initialY), 2.0) == 0.0) {
				if (localX < 0.5) {
					localX += 0.5;
				} else {
					localX -= 0.5;
				}
			}

            float distToCenterOfTile = 1.0 - min(0.5, distance(
                vec2(
                    localX,
                    localY
                ),
                vec2(0.5, 0.5)
            )) * 2.0;

            offset.y += -sin(distToCenterOfTile * 3.14159 * 0.5) * ${trailZero(height)} * tileSize * 10.0;
            `}
	}
}