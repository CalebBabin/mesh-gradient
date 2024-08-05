import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { generateMaterial } from './shader';
import './style.css';
import {
	Mesh,
	OrthographicCamera,
	PlaneGeometry,
	PerspectiveCamera,
} from 'three';
import { useEffect, useMemo } from 'react';

function MaterialTicker({ shader }) {
	useFrame(() => {
		if (shader) shader.tick();
	});
	return null;
}

function MeshAdder({ geometry, material, scale, rotation }) {
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
	widthSegments = 512,
	heightSegments = 512,
	scale = [5, 5, 1],
	rotation = [Math.PI * 0.5, 0, 0],
	cameraConfig = {},
	materialNodes = [],
}) {
	const shader = useMemo(() => {
		console.log("generating material");
		return generateMaterial(materialNodes);
	}, [materialNodes]);

	const geometry = useMemo(() => {
		return new PlaneGeometry(1, 1, widthSegments, heightSegments);
	}, [widthSegments, heightSegments]);


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
			cameraConfig.fov || 75,
			cameraConfig.aspect || window.innerWidth / window.innerHeight,
			cameraConfig.near || 0.1,
			cameraConfig.far || 1000
		);
	}, [cameraConfig]);

	useEffect(() => {
		camera.position.set(0, 2, 3);
		camera.lookAt(0, 0, 0.5);
	}, [camera]);

	return <div className='w-full h-full inset-0 absolute'>
		<Canvas
			camera={camera}
		>
			<MeshAdder
				rotation={rotation}
				scale={scale}
				geometry={geometry}
				material={shader.material}
			/>
			<MaterialTicker shader={shader} />
		</Canvas>
	</div>
}