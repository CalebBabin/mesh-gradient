import { useEffect, useMemo, useRef, useState } from 'react'
import { Editor } from './editor';
import { MeshScene } from './MeshScene';


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


function XYZInput({ data, setData }) {
	return <>
		<NumberWrapper>
			<label>X: <NumberInput value={data.x} onChange={e => {
				const new_data = { ...data };
				new_data.x = e.target.value;
				setData(new_data);
			}} /></label>
		</NumberWrapper>
		<NumberWrapper>
			<label>Y: <NumberInput value={data.y} onChange={e => {
				const new_data = { ...data };
				new_data.y = e.target.value;
				setData(new_data);
			}} /></label>
		</NumberWrapper>
		<NumberWrapper>
			<label>Z: <NumberInput value={data.z} onChange={e => {
				const new_data = { ...data };
				new_data.z = e.target.value;
				setData(new_data);
			}} /></label>
		</NumberWrapper>
	</>
}

function VertexConfig({ data, setData }) {
	return <div className='flex flex-wrap items-center gap-2 p-2 pt-1 border-[2px] rounded box-content'>
		<input type='text' value={nodeDictionary[data.name].name} readOnly />
		<label>
			scale:
			<input type='number' value={data.scale.y} onChange={e => {
				const new_data = { ...data };
				new_data.scale.y = e.target.value;
				setData(new_data);
			}} />
		</label>
		<div className='flex gap-2'>
			detail:
			<XYZInput data={data.detail} setData={detailData => {
				const new_data = { ...data };
				new_data.detail = detailData;
				setData(new_data);
			}} />
		</div>
		<label className='flex justify-between w-full'>
			speed: <input type='range'
				min={-20}
				max={20}
				step={0.01}
				value={data.speed} onChange={e => {
					const new_data = { ...data };
					new_data.speed = e.target.value;
					setData(new_data);
				}} />
			<input className='w-12' type='number' value={data.speed} onChange={e => {
				const new_data = { ...data };
				new_data.speed = e.target.value;
				setData(new_data);
			}} />
		</label>
	</div>
}

function Controls({ hide = false, locked = false, setLockUI }) {
	const [config, setConfig] = useState(undefined);
	const [nodeDictionary, setNodeDictionary] = useState(null);

	const ref = useRef(null);
	useMemo(() => {
		if (ref.current) {
			const focusListener = () => {
				setLockUI(true);
			}
			ref.current.addEventListener('focusin', focusListener);
			ref.current.addEventListener('click', focusListener);
			return () => {
				ref.current.removeEventListener('focusin', focusListener);
				ref.current.removeEventListener('click', focusListener);
			}
		}
	}, [ref.current]);

	useMemo(() => {
		if (window.config !== undefined) {
			setConfig(window.config);
			setNodeDictionary(window.nodeDictionary);
		} else {
			const listener = () => {
				setConfig(window.config);
				setNodeDictionary(window.nodeDictionary);
			}
			window.addEventListener('vertexConfigLoaded', listener);

			return () => {
				window.removeEventListener('vertexConfigLoaded', listener);
			}
		}
	}, []);

	useMemo(() => {
		window.dispatchEvent(new CustomEvent('rebuildTheShader', {
			detail: {
				config,
			}
		}));
	}, [config])

	const vertexElements = [];
	if (config) {
		for (let i = 0; i < config.vertex.nodes.length || 0; i++) {
			const conf = config.vertex.nodes[i];
			vertexElements.push(
				<VertexConfig
					key={i}
					data={conf}
					setData={(new_data) => {
						const new_config = { ...config };
						new_config.vertex.nodes[i] = new_data;
						setConfig(new_config);
					}}
				/>
			);
		}
	}

	return <div
		ref={ref}
		className='absolute bottom-2 left-2 w-[calc(100vw-1em)] max-w-xs'
	>
		<div
			style={{ opacity: hide ? 0 : 1 }}
			className='transition-opacity duration-500 w-full flex justify-between'>
			<button
				className='hover:text-blue-800 px-2 mb-2 bg-white/50 text-black border-2 rounded-md'
				onClick={() => {
					const output = [];
					const count = Math.floor(Math.random() * 7) + 4;

					const r = () => Math.pow(Math.random(), 2) * 2 - 1;
					let smoothCount = 0;
					for (let i = 0; i < count; i++) {
						const scaleFactor = Math.random();
						const item = {
							name: Object.keys(nodeDictionary)[Math.floor(Math.random() * Object.keys(nodeDictionary).length)],
							scale: {
								x: Math.pow(scaleFactor, 3) * 2,
								y: Math.pow(scaleFactor * (Math.random() * 0.5 + 0.6), 3) * 2,
								z: r()
							},
							detail: {
								x: Math.pow(Math.random(), 2) * 10,
								y: Math.pow(Math.random(), 2) * 5 + 0.2,
								z: r() * 2
							},
							speed: r(),
						}
						item.detail.x *= scaleFactor;
						item.detail.y *= scaleFactor;
						item.detail.z *= scaleFactor;

						if (item.name === 'presetSmoothingNoiseA') {
							if (smoothCount > 1) continue;
							smoothCount++;
						}
						output.push(item);
					}
					setConfig({
						vertex: {
							nodes: output,
						},
						fragment: config.fragment,
					});
				}}>
				randomize
			</button>
			{locked ?
				<button
					className='hover:text-blue-800 px-2 mb-2 bg-white/50 text-black border-2 rounded-md'
					onClick={() => setLockUI(!locked)}>
					close controls
				</button> : null}
		</div>
		<div
			style={{ opacity: hide ? 0 : locked ? 1 : 0.5 }}
			className='transition-opacity duration-500 p-2 overflow-y-scroll bg-white text-black rounded-md h-[50vh] flex gap-2 flex-col'>
			<h2 className='text-xl'>Controls</h2>
			<div className='flex flex-col gap-2 p-2 pt-1 border-[2px] rounded box-content'>
				<h2 className='text-xl'>Color:</h2>
				<label>
					height target:
					<input className='inline-block w-12' type='number' value={config?.fragment.brightnessHeightTarget} onChange={e => {
						const new_config = { ...config };
						new_config.fragment.brightnessHeightTarget = e.target.value;
						setConfig(new_config);
					}} />
					<input className='w-full' type="range" min={-2} max={2} step={0.01} value={config?.fragment.brightnessHeightTarget} onChange={e => {
						const new_config = { ...config };
						new_config.fragment.brightnessHeightTarget = e.target.value;
						setConfig(new_config);
					}} />
				</label>
				<label>
					height multiplier:
					<input className='inline-block w-12' type='number' value={config?.fragment.brightnessHeightMultiplier} onChange={e => {
						const new_config = { ...config };
						new_config.fragment.brightnessHeightMultiplier = e.target.value;
						setConfig(new_config);
					}} />
					<input className='w-full' type="range" min={0} max={2} step={0.01} value={config?.fragment.brightnessHeightMultiplier} onChange={e => {
						const new_config = { ...config };
						new_config.fragment.brightnessHeightMultiplier = e.target.value;
						setConfig(new_config);
					}} />
				</label>
			</div>
			<hr />
			<h2 className='text-xl'>Position:</h2>
			{vertexElements}
		</div>
	</div>;
}

const presetNodes = [
	{
		name: 'fragmentCheckersAlt',
		scale: { x: 1, y: 0.5, z: 1 },
		detail: { x: 1 * 0.75, y: 2 * 0.75, z: 1 * 0.75 },
		speed: { x: 1, y: 1, z: 1 },
	},
	{
		name: 'presetBigNoiseA',
		scale: { x: 1, y: 2, z: 1 },
		detail: { x: 1, y: 0.5, z: 1 },
		speed: { x: 1, y: 1, z: 1 },
	},
	{
		name: 'presetBigNoiseA',
		scale: { x: 6, y: 6, z: 6 },
		detail: { x: 0.1, y: 0.05, z: 0.1 },
		speed: { x: 1, y: 1, z: 1 },
	},
	{
		name: 'presetBigNoiseB',
		scale: { x: 1, y: 4, z: 1 },
		detail: { x: 1, y: 0.1, z: 1 },
		speed: { x: 1, y: 1, z: 1 },
	},
];

function App() {
	const [hideUI, setHideUI] = useState(true);
	const [lockUI, setLockUI] = useState(false);

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
			<MeshScene materialNodes={presetNodes} />
			<Editor />
			<FullscreenButton hide={!visible} locked={lockUI} />
			<Controls hide={true} locked={lockUI} setLockUI={setLockUI} />
		</>
	)
}

export default App
