import { trailZero } from "../utils";
import { BaseShader, StrengthSlider, useShaderData } from "./BASE";
import { XYZSliderWithGraph } from "../utils/xyzInput.jsx";


/** @typedef {import('../editor.jsx').Node} Node */


const maxDetail = 50;
const maxHeight = 10;


/**
 * 
 * @param {Node} node
 * @param {CheckerboardShader} shader 
 * @returns {JSX.Element} UI
 */
function UI({ node, shader }) {
    const sData = useShaderData(shader);
    return <div className="inset-0 absolute flex flex-col justify-center items-center text-center text-[#222]">
        <div className="flex h-full pl-2">
            <StrengthSlider shader={shader} />
            <div className="overflow-y-auto h-[calc(100%-2px)] p-2 box-border">
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
                    <label>detailFactor:</label>
                    <label>0</label>
                    <input
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        type="range"
                        min={0}
                        step={1}
                        max={maxDetail}
                        value={(sData.detailFactor * maxDetail) ?? 0}
                        onChange={e => {
                            shader.data = {
                                detailFactor: e.target.value / maxDetail
                            };
                        }}
                    />
                    <label>{maxDetail}</label>
                </div>

                <XYZSliderWithGraph label="detail" data={sData.detail} onChange={v => {
                    shader.data = {
                        detail: v,
                    };
                }} />
                <XYZSliderWithGraph label="speed" data={sData.speed} onChange={v => {
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
        detail: [0.5, 0.5, 0.5],
        detailFactor: 50,
    };

    constructor(data = {}) {
        super(data);

        this.data = {
            ...this.defaults,
            speed: [
                (Math.random() * 2 - 1) * 0.25,
                (Math.random() * 2 - 1) * 0.25,
                (Math.random() * 2 - 1) * 0.25,
            ],
            ...data,
        };
    }

    compile() {
        let { detail, detailFactor, height, speed: ogSpeed} = this.data;

        const speed = ogSpeed.map(v => v + 1);
        height = Math.pow(height, 2) * maxHeight;
        detailFactor = Math.pow(detailFactor, 2) * maxDetail;

        if (!height || !speed || !detail || !detailFactor) {
            return {};
        }

        return {
            vertex: /*glsl*/`
                vec3 speed = vec3(${trailZero(speed[0])}, ${trailZero(speed[1])}, ${trailZero(speed[2])});
                vec3 detail = vec3(${trailZero((detail[0] ?? 1.0) * detailFactor)}, ${trailZero((detail[1] ?? 1.0) * detailFactor)}, ${trailZero((detail[2] ?? 1.0) * detailFactor)});
                float slowTime = 0.0001;

                offset.y = (simplexNoise3D(vec3(
                    (vUv.x * detail.x) + ((time.x * slowTime) * speed.x),
                    (vUv.y * detail.y) + ((time.y * slowTime) * speed.y),
                    (time.z * slowTime) * speed.z
                )) - 1.0) * ${trailZero(height)};
            `}
    }
}