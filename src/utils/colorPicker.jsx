import { useEffect, useRef, useState } from 'react';
import { SketchPicker } from 'react-color';


export function ColorPicker({ color, onChange }) {
	const [active, setActive] = useState(false);
	const ref = useRef();

	useEffect(() => {
		const listener = e => {
			if (!ref.current) return;

			if (active && !ref.current.contains(e.target)) {
				setActive(false)
			};
		}
		window.addEventListener('click', listener);

		return () => window.removeEventListener('click', listener);
	}, [ref, active]);

	return <button ref={ref} className='relative' onClick={() => setActive(!active)}>
		<div className='absolute inset-1' style={{
			background: color ? `rgb(${color.r},${color.g},${color.b})` : '#000',
		}} />
		{active ? <div onClick={e => {
			e.preventDefault()
			e.stopPropagation();
		}} className='top-full left-0 absolute z-[100]'><SketchPicker color={color} onChange={onChange} /></div> : null}
	</button>
}