import { trailZero } from "../utils";
import { BaseShader, blendModes, StrengthSlider, useShaderData } from "./BASE";
import { XYInput, XYSlider, XYSliderWithGraph } from "../utils/xyzInput.jsx";


/** @typedef {import('../editor.jsx').Node} Node */


const maxScale = 50;
const maxHeight = 10;


/**
 * 
 * @param {Node} node
 * @param {CheckerboardShader} shader 
 * @returns {JSX.Element} UI
 */
function UI({ node, shader }) {
    const sData = useShaderData(shader);

    return <div className="absolute inset-0 p-2 bg-red flex flex-col justify-center items-center text-center">
        <div className="absolute pointer-events-none -z-10 inset-[3px] bg-black opacity-60" />
        <div className="flex justify-stretch w-full pt-6">
            <StrengthSlider shader={shader} />
            <div>
                <div className="field-row w-full">
                    <label>height:</label>
                    <label>0</label>
                    <input
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        type="range"
                        min={0}
                        step={0.001}
                        max={maxHeight}
                        value={(sData.height * maxHeight) ?? 0}
                        onChange={e => {
                            shader.data = {
                                height: e.target.value / maxHeight
                            };
                        }}
                    />
                    <label>{maxHeight}</label>
                </div>
                <div className="field-row w-full">
                    <label>scaleFactor:</label>
                    <label>0</label>
                    <input
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        type="range"
                        min={0}
                        step={1}
                        max={maxScale}
                        value={(sData.scaleFactor * maxScale) ?? 0}
                        onChange={e => {
                            shader.data = {
                                scaleFactor: e.target.value / maxScale
                            };
                        }}
                    />
                    <label>{maxScale}</label>
                </div>

                <XYSliderWithGraph label="scale" data={sData.scale} onChange={v => {
                    shader.data = {
                        scale: v,
                    };
                }} />
                <XYSliderWithGraph label="speed" data={sData.speed} onChange={v => {
                    shader.data = {
                        speed: v,
                    };
                }} />
            </div>
        </div>
    </div>;
};

const type = "Wave";
export class WaveShader extends BaseShader {
    static type = type;
    type = type;
    UI = UI;

    defaults = {
        blendMode: 'add',
        height: 0.5,
        speed: [0, 0, 0],
        scale: [0.5, 0.5, 0.5],
        scaleFactor: 50,
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
        let { scale, scaleFactor, height, speed } = this.data;
        height = Math.pow(height, 2) * maxHeight;
        scaleFactor = Math.pow(scaleFactor, 2) * maxScale;

        if (!height || !speed || !scale || !scaleFactor) {
            return {};
        }

        return {
            vertex: /*glsl*/`
                vec3 speed = vec3(${trailZero(speed[0])}, ${trailZero(speed[1])}, 1.0);
                vec3 scale = vec3(${trailZero((scale[0] ?? 1.0) * scaleFactor)}, ${trailZero((scale[1] ?? 1.0) * scaleFactor)}, ${trailZero((scale[2] ?? 1.0) * scaleFactor)});
                float slowTime = uTime * 0.0001;

                offset.y += simplexNoise3D(vec3(
                    vUv.x * scale.x + slowTime * speed.x,
                    vUv.y * scale.y + slowTime * speed.y,
                    slowTime
                )) * ${trailZero(height)};
            `}
    }
}