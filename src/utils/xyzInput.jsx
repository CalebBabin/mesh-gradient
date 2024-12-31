import { useCallback, useRef } from "react";


export function XYSliderWithGraph({ data = [0, 0], onChange, label }) {
	return <fieldset className="text-left">
		<legend>{label}</legend>
		<div className="flex gap-1">
			<XYInput data={data} onChange={onChange} />
			<XYSlider data={data} onChange={onChange} />
		</div>
	</fieldset>
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
			className='w-10 aspect-square bg-black border-2 border-solid border-black relative cursor-crosshair rounded-sm'
		>
			<div
				ref={canvasRef}
				onClick={onClick}
				className="absolute inset-0 border-solid border-sky-500 rounded-sm">
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
	</div>
}