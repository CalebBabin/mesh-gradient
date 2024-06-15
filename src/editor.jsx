import { useEffect, useMemo, useState } from "react"

let globalID = 0;
class Node {
	constructor(props = {
		type: "presetBigNoiseA",
	}) {
		this.id = globalID++;
		for (const key in props) {
			if (Object.hasOwnProperty.call(props, key)) {
				this[key] = props[key];
			}
		}
	}
}

function Connector({ node, nodeX, nodeY, side = 1 }) {
	const [targetX, setTargetX] = useState(Math.random() * 200 - 100);
	const [targetY, setTargetY] = useState(Math.random() * 200 - 100);

	const [targetMouseDown, setTargetMouseDown] = useState(false);
	const [targetMouseStart, setTargetMouseStart] = useState({ x: 0, y: 0 });

	useEffect(() => {
		if (!targetMouseDown) return;
		const moveListener = (e) => {
			e.preventDefault();
			setTargetX(targetX + (e.clientX - targetMouseStart.x));
			setTargetY(targetY + (e.clientY - targetMouseStart.y));
		}
		window.addEventListener('mousemove', moveListener);

		const dehookListener = () => { setTargetMouseDown(false) };
		window.addEventListener('mouseup', dehookListener);
		window.addEventListener('blur', dehookListener);

		return () => {
			window.removeEventListener('mousemove', moveListener);
			window.removeEventListener('mouseup', dehookListener);
			window.removeEventListener('blur', dehookListener);
		}
	}, [targetMouseDown, targetMouseStart]);

	useEffect(() => {
		if (!node) return;
		window.dispatchEvent(new CustomEvent('lineChange', {
			detail: {
				id: node.id,
				action: 'add',
				lineStart: { x: nodeX + 150, y: nodeY },
				lineEnd: { x: targetX, y: targetY },
			}
		}));

		return () => {
			window.dispatchEvent(new CustomEvent('lineChange', {
				detail: {
					id: node.id,
					action: 'delete',
				}
			}));
		}
	}, [node]);

	useEffect(() => {
		if (!node) return;
		window.dispatchEvent(new CustomEvent('lineChange', {
			detail: {
				id: node.id,
				action: 'update',
				lineStart: { x: nodeX + 125, y: nodeY },
				lineEnd: { x: targetX, y: targetY },
			}
		}));
	}, [node, targetX, targetY, nodeX, nodeY]);

	return <>
		<div className={(side > 0 ? "left-full" : "right-full") + " top-1/2 absolute -m-1 w-2 h-2 bg-blue-300 hover:-m-2 hover:w-4 hover:h-4 hover:bg-blue-600"} />
		<div
			onMouseDown={e => {
				e.preventDefault();
				e.stopPropagation()
				setTargetMouseDown(true);
				setTargetMouseStart({ x: e.clientX, y: e.clientY });
			}}
			draggable={true}
			style={{
				transform: 'translate(' + (targetX - nodeX) + 'px,' + (targetY - nodeY) + 'px)',
			}}
			className="absolute top-1/2 left-1/2 -m-1 w-2 h-2 bg-blue-300 hover:-m-2 hover:w-4 hover:h-4 hover:bg-blue-600"
		/>
	</>
}

const NODE_SIZE_CLASS = ` w-64 -ml-32 h-32 -mt-16`;
function NodeRenderer({ node, deleteNode }) {
	const [x, setX] = useState(0);
	const [y, setY] = useState(0);
	const [mouseDown, setMouseDown] = useState(false);
	const [mouseStart, setMouseStart] = useState({ x: y, y: 0 });

	useEffect(() => {
		if (!mouseDown) return;
		const moveListener = (e) => {
			e.preventDefault();
			setX(x + (e.clientX - mouseStart.x));
			setY(y + (e.clientY - mouseStart.y));
		}
		window.addEventListener('mousemove', moveListener);

		const dehookListener = () => { setMouseDown(false) };
		window.addEventListener('mouseup', dehookListener);
		window.addEventListener('blur', dehookListener);

		return () => {
			window.removeEventListener('mousemove', moveListener);
			window.removeEventListener('mouseup', dehookListener);
			window.removeEventListener('blur', dehookListener);

		}
	}, [mouseDown, mouseStart]);

	return <div
		onMouseDown={e => {
			setMouseDown(true);
			setMouseStart({ x: e.clientX, y: e.clientY });
			e.preventDefault();
		}}
		onDropCapture={e => {
			console.log('drop', e);
		}}
		style={{
			transform: 'translate(' + x + 'px, ' + y + 'px)',
		}}
		className={"absolute box-border bg-black rounded-lg border-white/80 border-2 text-white p-2" + NODE_SIZE_CLASS}
	>
		<div className="cursor-move">
			move
		</div>
		Node!
		<Connector node={node} side={1} nodeX={x} nodeY={y} />
	</div>
}

function LineDrawer() {
	const [lines, setLines] = useState({});
	useEffect(() => {
		const lineChangeListener = (e) => {
			const { id, action, lineStart, lineEnd } = e.detail;

			switch (action) {
				case 'add':
					setLines({
						...lines,
						[id]: {
							start: lineStart,
							end: lineEnd,
						}
					});
					break;
				case 'delete':
					const newLines = { ...lines };
					delete newLines[id];
					setLines(newLines);
					break;
				case 'update':
					setLines({
						...lines,
						[id]: {
							start: lineStart,
							end: lineEnd,
						}
					});
					break;
				default:
					break;
			}
		}

		window.addEventListener('lineChange', lineChangeListener);
		return () => {
			window.removeEventListener('lineChange', lineChangeListener);
		}
	}, [lines]);

	return <svg width={5000} height={5000} style={{ margin: '-2500px 0 0 -2500px' }} className="absolute top-0 left-0 pointer-events-none">
		{Object.keys(lines).map((key) => {
			const line = lines[key];
			let yDist = line.end.y - line.start.y;
			let xDist = line.end.x - line.start.x;
			const ratio = Math.abs(xDist / yDist);
			// if (ratio > 1) {
			xDist = xDist / ratio;
			// }

			return <path
				key={key}
				d={`M ${2500 + (line.start.x)} ${2500 + (line.start.y)} C ${2500 + line.start.x + Math.abs(xDist)} ${2500 + (line.start.y)} ${2500 + line.end.x - Math.abs(xDist)} ${2500 + (line.end.y)} ${2500 + (line.end.x)} ${2500 + (line.end.y)}`}
				stroke="#ffffff"
				strokeWidth="4"
				strokeDasharray={10}
				fill="none"
			/>
		})}

		<circle cx={5000} cy={5000} r={10} fill="red" />
	</svg>
}

export function Editor({ className }) {
	const [nodes, setNodes] = useState([new Node(), new Node(), new Node()]);

	const addNode = useMemo(() => (node) => {
		setNodes([...nodes, new Node(node)]);
	}, [nodes]);

	const deleteNode = useMemo(() => (node) => {
		const newNodes = new Array(nodes.length - 1);
		for (let i = 0; i < nodes.length; i++) {
			if (nodes[i].id !== node.id) newNodes.push(node);
		}
		setNodes(newNodes);
	}, [nodes]);

	const renderedNodes = useMemo(() => {
		const renderedNodes = new Array(nodes.length);
		for (let i = 0; i < nodes.length; i++) {
			renderedNodes.push(<NodeRenderer
				key={nodes[i].id}
				addNode={addNode}
				deleteNode={deleteNode}
				node={nodes[i]}
			/>)
		}
		return renderedNodes;
	}, [nodes]);

	return <div className={"absolute top-1/2 left-1/2" + ' ' + className}>
		<LineDrawer />
		{renderedNodes}
	</div>
}