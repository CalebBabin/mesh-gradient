import { useCallback, useRef } from "react";


export function XYSliderWithGraph({ data = [0, 0], onChange, label }) {
	return <div className="flex gap-2 my-2 items-center">
		<div>
			<div>{label}</div>
			<XYInput data={data} onChange={onChange} />
		</div>
		<XYSlider data={data} onChange={onChange} />
	</div>
}

export function XYSlider({ data = [0, 0], onChange }) {
	return <div className='flex flex-col'>
		<div className="flex gap-2 items-center">
			<span>x</span>
			<input type="range" min={-1} max={1} step={0.001} value={data[0]} onChange={e => onChange([Number(e.target.value), data[1]])} />
			<input type="number" value={data[0]} onChange={e => onChange([Number(e.target.value), data[1]])} className="w-12 overflow-hidden text-left" />
		</div>
		<div className="flex gap-2 items-center">
			<span>y</span>
			<input type="range" min={-1} max={1} step={0.001} value={data[1]} onChange={e => onChange([data[0], Number(e.target.value)])} />
			<input type="number" value={data[1]} onChange={e => onChange([data[0], Number(e.target.value)])} className="w-12 overflow-hidden text-left" />
		</div>
	</div>
}

export function XYInput({ data = [0, 0], onChange }) {
	const canvasRef = useRef();

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
					left: `${(data[0] * 0.5 + 0.5) * 100}%`,
					top: `${(data[1] * 0.5 + 0.5) * 100}%`
				}}
			/>
		</div>
	</div>
}