import { useState } from 'react';
import { SketchPicker } from 'react-color';


export function ColorPicker({ color, onChange }) {
	const [active, setActive] = useState(false);

	return <button className='relative' onClick={() => setActive(!active)}>
		<div className='absolute inset-1' style={{
			background: color ? `rgb(${color.r},${color.g},${color.b})` : '#000',
		}} />
		{active ? <div onClick={e => {
			e.preventDefault()
			e.stopPropagation();
		}} className='top-full left-0 absolute z-[100]'><SketchPicker color={color} onChange={onChange} /></div> : null}
	</button>
}