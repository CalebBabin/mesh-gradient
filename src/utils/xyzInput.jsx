import { useCallback, useEffect, useRef, useState } from "react";

export function XYZInput({ data = [0, 0, 0], onChange }) {
    const canvasRef = useRef();
    const [pos, setPos] = useState([0, 0, 0]);

    useEffect(() => {
        if (!Array.isArray(data)) {
            setPos([data.x, data.y, data.z]);
        } else {
            setPos(data);
        }
    }, [data]);


    const onClick = useCallback((e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        onChange([x, y, pos[2]]);
    }, [canvasRef]);

    return <div className='flex'>
        <div
            className='w-10 relative cursor-crosshair aspect-square rounded-sm border border-solid border-sky-500'
            ref={canvasRef}
            onClick={onClick}
        >
            <div
                className="absolute w-2 h-2 -m-1 rounded-full bg-sky-500"
                style={{
                    left: `${(pos[0] * 0.5 + 0.5) * 100}%`,
                    top: `${(pos[1] * 0.5 + 0.5) * 100}%`
                }}
            />
        </div>
    </div>
}