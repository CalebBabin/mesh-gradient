import { useEffect, useState } from "react";
import { trailZero } from "../utils";
import { BaseShader, useShaderData } from "./BASE";
import { XYInput } from "../utils/xyzInput.jsx";


/** @typedef {import('../editor.jsx').Node} Node */


const maxSize = 500;
const maxHeight = 5000;


/**
 * 
 * @param {Node} node
 * @param {CheckerboardShader} shader 
 * @returns 
 */
function UI({ node, shader }) {
    const [size, setSize] = useState(shader.data.size ?? 0.5);
    const [height, setHeight] = useState(shader.data.height ?? 0.5);
    const [speed, setSpeed] = useState(shader.data.speed ? [shader.data.speed.x, shader.data.speed.y] : [-0.5, 0.5]);

    useEffect(() => {
        shader.data = {
            size: size,
            height: height,
            speed: { x: speed[0], y: speed[1] },
        };
        node.recompile();
        console.log(shader.data);
    }, [size, height, speed]);


    return <div className="absolute inset-0 bg-red flex flex-col justify-center items-center text-center">
        <div className="absolute inset-0 pointer-events-none -z-10  bg-black opacity-60" />
        <span className="relative z-10 font-thin text-3xl text-cyan-100">
            bubbles
        </span>
        <div className="field-row w-full">
            <label>size:</label>
            <label>1</label>
            <input
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                type="range"
                min="1"
                max={maxSize}
                value={((1 - size) * maxSize)}
                onChange={e => {
                    setSize((maxSize - Number(e.target.value)) / maxSize);
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
                value={height * maxHeight || 0}
                onChange={e => {
                    setHeight(e.target.value / maxHeight);
                }}
            />
            <label>{maxHeight}</label>
        </div>

        <XYInput data={speed} onChange={setSpeed} />
    </div>;
};

const type = "Bubble";
export class BubbleShader extends BaseShader {
    static type = type;
    type = type;
    UI = UI;

    defaults = {
        size: 0.5,
        height: 0.5,
        speed: { x: 1, y: 1, z: 1 },
    };

    constructor(data = {}) {
        super(data);

        this.data = {
            ...this.defaults,
            speed: {
                x: Math.random() * 2 - 1,
                y: Math.random() * 2 - 1,
                z: Math.random() * 2 - 1,
            },
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
            vec3 speed = vec3(${trailZero(speed.x)}, ${trailZero(speed.y)}, 0.0);
            float slowTime = uTime * 0.001;


            float tileCount = ${trailZero(Math.pow(size, 4.0) * maxSize)};
            float tileSize = 1.0 / tileCount;

            float initialX = vUv.x * tileCount + slowTime * speed.x;
            float initialY = vUv.y * tileCount + slowTime * speed.y;

            float localX = (initialX - floor(initialX));
            float localY = (initialY - floor(initialY));

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