import { useCallback, useEffect, useRef, useState } from "react";

export function XYInput({ data = [0, 0], onChange }) {
    const canvasRef = useRef();
    const [pos, setPos] = useState([0, 0]);

    useEffect(() => {
        if (!Array.isArray(data)) {
            setPos([data.x, data.y]);
        } else {
            setPos(data);
        }
    }, [data]);


    const onClick = useCallback((e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        onChange([x, y]);
    }, [canvasRef]);

    return <div className='flex'>
        <div
            className='w-10 relative cursor-crosshair aspect-square rounded-sm border border-solid border-sky-500'
            ref={canvasRef}
            onClick={onClick}
        >
            <div className='absolute inset-0 left-1/2 right-auto w-[1px] bg-amber-400' />
            <div className='absolute inset-0 top-1/2 bottom-auto h-[1px] bg-amber-400' />
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