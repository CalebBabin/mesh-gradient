import { Canvas, useFrame, useThree } from '@react-three/fiber';

import './style.css';
import {
	Mesh,
	OrthographicCamera,
	PerspectiveCamera,
} from 'three';
import { useEffect, useMemo, useState } from 'react';

export function MeshAdder({ geometry, material, scale, rotation }) {
	const { scene } = useThree();

	const mesh = useMemo(() => {
		const mesh = new Mesh(geometry, material);
		return mesh;
	}, [geometry, material]);

	useEffect(() => {
		scene.add(mesh);
		return () => {
			scene.remove(mesh);
		}
	}, [mesh]);

	useEffect(() => {
		mesh.scale.set(scale[0], scale[1], scale[2]);
		mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
	}, [mesh, scale, rotation]);

	return null;
}

export function MeshScene({
	cameraConfig = {},
	children,
}) {


	const camera = useMemo(() => {
		if (cameraConfig.type === 'orthographic') {
			return new OrthographicCamera(
				cameraConfig.left || -1,
				cameraConfig.right || 1,
				cameraConfig.top || -1,
				cameraConfig.bottom || 1,
				cameraConfig.near || 0.1,
				cameraConfig.far || 1000
			);
		}
		return new PerspectiveCamera(
			cameraConfig.fov ?? 35,
			cameraConfig.aspect ?? (window.innerWidth / window.innerHeight),
			cameraConfig.near ?? 0.1,
			cameraConfig.far ?? 1000
		);
	}, [cameraConfig]);

	useEffect(() => {
		camera.position.set(0, 5, 10).normalize().multiplyScalar(22);
		camera.lookAt(0, 0, 6);
	}, [camera]);

	return <div className='w-full h-full inset-0 absolute'>
		<Canvas
			gl={{
				preserveDrawingBuffer: true,
				antialias: true,
			}}
			ref={(canvas) => {
				window.canvas = canvas;
				window.dispatchEvent(new Event('canvas-ready'));
			}}
			camera={camera}
		>
			{children}
		</Canvas>
	</div>
}

export function ExportCanvasButton() {
	const [visible, setVisible] = useState(false);
	useEffect(() => {
		const listener = () => {
			setVisible(true);
		}
		if (window.canvas) {
			setVisible(true);
		} else {
			window.addEventListener('canvas-ready', listener);
		}

		return () => {
			window.removeEventListener('canvas-ready', listener);
		}
	}, []);

	if (!visible) return null;
	return <button
		className='absolute -ml-[50%] p-2 text-black'
		onClick={() => {
			const link = document.createElement('a');
			const date = new Date();
			link.download = `gradient.tapetools.io-${date.toISOString()}.png`;
			window.canvas.toBlob((blob) => {
				link.href = URL.createObjectURL(blob);
				link.click();
			});
		}}>
		export.png
	</button>
}