import { useEffect, useMemo, useState } from 'react'
import { EditorWithNodeContext } from './editor';
import { MeshAdder, MeshScene } from './MeshScene';
import { PlaneGeometry } from 'three';
import { useFrame } from '@react-three/fiber';


function FullscreenButton({ hide = false }) {
	const [isFullscreen, setIsFullscreen] = useState(false);

	useEffect(() => {
		const onFullscreenChange = () => {
			setIsFullscreen(!!document.fullscreenElement);
		};
		document.addEventListener('fullscreenchange', onFullscreenChange);
		return () => {
			document.removeEventListener('fullscreenchange', onFullscreenChange);
		};
	}, []);

	return <button
		style={{ opacity: hide ? 0 : 1 }}
		className='absolute top-2 right-2 p-2 hover:text-white text-black transition-opacity duration-500'
		onClick={() => {
			if (isFullscreen) {
				document.exitFullscreen();
			} else {
				document.documentElement.requestFullscreen();
			}
		}}>
		{isFullscreen ? 'exit fullscreen' : 'fullscreen'}
	</button>
}

function NumberInput({ value, onChange }) {
	return <input
		className='w-10'
		type='number'
		value={value}
		onChange={onChange}
	/>;
}
function NumberWrapper({ children }) {
	return <div
		className='pl-1 rounded border-black border-solid border overflow-hidden'
	>
		{children}
	</div>
}



function MaterialTicker({ shader }) {
	useFrame(() => {
		if (shader) shader.tick();
	});
	return null;
}

function App() {
	useEffect(() => {
		window.location.href = 'https://gradient.tapetools.io';
	}, []);
	return (
		<>
			Project has moved! check out <a href="https://gradient.tapetools.io">https://gradient.tapetools.io</a>
		</>
	)
}

export default App
