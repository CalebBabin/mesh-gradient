import { trailZero } from "../utils.js";
import { ColorPicker } from "../utils/colorPicker.jsx";
import { rgbToLch } from "../utils/colorSpaces.jsx";
import { BaseShader, StrengthSlider, useShaderData } from "./BASE.jsx";


/** @typedef {import('../editor.jsx').Node} Node */

/**
 * 
 * @param {Node} node
 * @param {CheckerboardShader} shader 
 * @returns {JSX.Element} UI
 */
function UI({ node, shader }) {
    const sData = useShaderData(shader);

    return <div className="absolute inset-0 p-2 flex flex-col justify-center items-center text-center">
        <div className="flex justify-stretch w-full pt-6 text-black">
            <StrengthSlider shader={shader} />
            <div>
                pin edges
            </div>
        </div>
    </div>;
};

const type = "PinEdges";
export class PinEdgesShader extends BaseShader {
    static type = type;
    type = type;
    UI = UI;

    defaults = {
        blendMode: 'multiply',
    };

    constructor(data = {}) {
        super(data);
        this.data = {
            ...this.defaults,
            ...data,
        };
    }

    compile() {
        return {
            vertex: /*glsl*/`
            
            offset.y = min(
                1.0 - pow(originalUv.y, 4.0),
                1.0 - pow(abs(originalUv.x - 0.5) * 2.0, 3.0)
            );
        `}
    }
}