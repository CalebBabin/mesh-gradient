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
		className='absolute top-2 right-4 z-[200] p-2 hover:text-white text-black transition-opacity duration-500'
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
	const [hideUI, setHideUI] = useState(true);
	const [lockUI, setLockUI] = useState(false);

	const [shader, setShader] = useState();
	const geometry = useMemo(() => new PlaneGeometry(1, 1, 1024, 1024), []);

	const [meshScale, setMeshScale] = useState([50, 30, 1]);
	const [meshRotation, setMeshRotation] = useState([Math.PI * 0.5, 0, 0]);


	useMemo(() => {
		if (hideUI) document.body.style.cursor = 'none';
		else document.body.style.cursor = '';
	}, [hideUI]);

	useEffect(() => {
		const onInteraction = () => {
			setHideUI(false);
			clearTimeout(window.hideUI);
			window.hideUI = setTimeout(() => {
				setHideUI(true);
			}, 1000);
		};
		document.addEventListener('pointermove', onInteraction);

		const blurListener = () => {
			setLockUI(false);
			setHideUI(true);
		}
		window.addEventListener('blur', blurListener);
		return () => {
			document.removeEventListener('pointermove', onInteraction);
			window.removeEventListener('blur', blurListener);
		};
	}, []);

	const visible = lockUI || !hideUI;
	return (
		<>
			<MeshScene>
				<MeshAdder
					geometry={geometry}
					material={shader?.material}
					scale={meshScale}
					rotation={meshRotation}
				/>
				<MaterialTicker shader={shader} />
			</MeshScene>
			<EditorWithNodeContext onChange={shader => {
				setShader(shader);
			}} />
			<FullscreenButton hide={!visible} locked={lockUI} />
		</>
	)
}

export default App
