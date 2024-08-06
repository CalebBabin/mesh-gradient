import { useEffect, useMemo, useRef, useState } from "react"

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

function Connector({ node, nodeX, nodeY, link = undefined }) {
	const [targetX, setTargetX] = useState(Math.random() * 200 - 100);
	const [targetY, setTargetY] = useState(Math.random() * 200 - 100);

	const [startX, setStartX] = useState(targetX);
	const [startY, setStartY] = useState(targetY);

	useEffect(() => {
		if (link === undefined) return;
		const listener = ({ detail }) => {
			if (detail.id === link) {
				setTargetX(detail.x);
				setTargetY(detail.y);
				setStartX(detail.x - 150);
				setStartY(detail.y);
			}
		}
		window.addEventListener('node-move', listener);
		return () => {
			window.removeEventListener('node-move', listener);
		}
	}, [link])

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
				lineEnd: { x: targetX + (link === undefined ? 0 : -150), y: targetY },
			}
		}));
	}, [node, targetX, targetY, nodeX, nodeY, link]);

	return <>
		{/* <div className={(side > 0 ? "left-full" : "right-full") + " top-1/2 absolute -m-1 w-2 h-2 bg-blue-300 hover:-m-2 hover:w-4 hover:h-4 hover:bg-blue-600"} /> */}
		<div
			// onMouseDown={e => {
			// 	e.preventDefault();
			// 	e.stopPropagation()
			// 	setTargetMouseDown(true);
			// 	setTargetMouseStart({ x: e.clientX, y: e.clientY });
			// }}
			onDrag={e => {
				if (e.clientX === 0 && e.clientY === 0) return;
				setTargetX(e.clientX - window.innerWidth / 2);
				setTargetY(e.clientY - window.innerHeight / 2);
			}}
			onDragStart={e => {
				setTargetX(e.clientX - window.innerWidth / 2);
				setTargetY(e.clientY - window.innerHeight / 2);
				e.dataTransfer.setData('text/plain', node.id);
				e.dataTransfer.dropEffect = 'move';
			}}
			onDragEnd={e => {
				setStartX(e.clientX - window.innerWidth / 2);
				setStartY(e.clientY - window.innerHeight / 2);
			}}
			draggable={true}
			style={{
				transform: 'translate(' + (startX) + 'px,' + (startY) + 'px)',
			}}
			data-connector={true}
			className="absolute z-20 top-1/2 left-1/2 -m-1 w-2 h-2 bg-blue-300 hover:-m-2 hover:w-4 hover:h-4 hover:bg-blue-600"
		/>
	</>
}

const NODE_SIZE_CLASS = ` w-64 -ml-32 h-32 -mt-16`;
function NodeRenderer({ node, deleteNode }) {
	const [x, setX] = useState(0);
	const [y, setY] = useState(0);
	const [outlined, setOutlined] = useState(false); // used for drag&drop hover effects
	const [mouseDown, setMouseDown] = useState(false);
	const [mouseStart, setMouseStart] = useState({ x: y, y: 0 });
	const [link, setLink] = useState(undefined);

	useEffect(() => {
		const listener = ({ detail }) => {
			if (detail.id === node.id) {
				setLink(detail.targetId);
			} else if (detail.targetId === link) {
				setLink(undefined);
			}
		}
		window.addEventListener('node-link', listener);
		return () => {
			window.removeEventListener('node-link', listener);
		}
	}, [link, node?.id]);

	useEffect(() => {
		console.log(node.id, 'linked to', link);
	}, [link, node]);

	useEffect(() => {
		if (!mouseDown) return;
		const moveListener = (e) => {
			e.preventDefault();
			const newX = x + (e.clientX - mouseStart.x);
			const newY = y + (e.clientY - mouseStart.y);
			setX(newX);
			setY(newY);

			window.dispatchEvent(new CustomEvent('node-move', {
				detail: {
					id: node.id,
					x: newX,
					y: newY,
				}
			}))
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

	return <>
		<div
			onMouseDown={e => {
				setMouseDown(true);
				setMouseStart({ x: e.clientX, y: e.clientY });
				e.preventDefault();
			}}
			onDrop={e => {
				const data = parseInt(e.dataTransfer.getData("text/plain"), 10);
				if (data !== node.id) {
					window.dispatchEvent(new CustomEvent('node-link', {
						detail: {
							id: data,
							targetId: node.id,
						}
					}))
				} else {
					console.log('cannot link node to self!', node.id);
				}
			}}
			onDragEnter={e => {
				e.preventDefault();
			}}
			onDragOver={e => {
				e.preventDefault();
			}}
			onDragExit={e => {
				setOutlined(false);
			}}
			style={{
				transform: 'translate(' + x + 'px, ' + y + 'px)',
				outline: outlined ? '2px dashed blue' : 'none',
			}}
			className={"absolute z-10 box-border bg-black rounded-lg border-white/80 border-2 text-white p-2" + NODE_SIZE_CLASS}
		>
			<div className="cursor-move">
				move
			</div>
			Node!
		</div>
		<Connector node={node} link={link} nodeX={x} nodeY={y} />
	</>
}

function Line(props) {
	const [startX, setStartX] = useState(props.startX ?? 0);
	const [startY, setStartY] = useState(props.startY ?? 0);
	const [endX, setEndX] = useState(props.endX ?? 0);
	const [endY, setEndY] = useState(props.endY ?? 0);

	useEffect(() => {
		console.log('adding line', props.id);
		const lineChangeListener = (e) => {
			const { id, action, lineStart, lineEnd } = e.detail;
			if (id !== props.id || action !== 'update') return;
			setStartX(lineStart.x ?? startX);
			setStartY(lineStart.y ?? startY);
			setEndX(lineEnd.x ?? endX);
			setEndY(lineEnd.y ?? endY);
		}

		window.addEventListener('lineChange', lineChangeListener);
		return () => {
			console.log('removing line', props.id);
			window.removeEventListener('lineChange', lineChangeListener);
		}
	}, [props.id]);

	const yDist = endY - startY;
	let xDist = endX - startX;
	const ratio = Math.abs(xDist / yDist);
	xDist = xDist / ratio;
	if (Number.isNaN(xDist)) xDist = 2;

	return <path
		d={`M ${2500 + (startX)} ${2500 + (startY)} C ${2500 + startX + Math.abs(xDist)} ${2500 + (startY)} ${2500 + endX - Math.abs(xDist)} ${2500 + (endY)} ${2500 + (endX)} ${2500 + (endY)}`}
		stroke="#ffffff"
		strokeWidth="4"
		strokeDasharray={10}
		fill="none"
	/>
}

function LineComposer() {
	const [lines, setLines] = useState(new Array());

	useEffect(() => {
		const lineMap = new Map();
		lines.forEach(line => {
			lineMap.set(line.id, true);
		})

		let newLines = Array.from(lines);

		const lineChangeListener = (e) => {
			const { id, action, lineStart, lineEnd } = e.detail;
			const lineId = Number(id);

			switch (action) {
				case 'delete': {
					for (let i = 0; i < newLines.length; i++) {
						if (newLines[i].id === lineId) {
							newLines.splice(i, 1);
							break;
						}
					}
					lineMap.delete(lineId);
					setLines(newLines);
				} break;
				default:
					if (!lineMap.has(lineId)) {
						lineMap.set(lineId, true);
						newLines.push({
							id: lineId,
							start: lineStart,
							end: lineEnd,
						})
						setLines(newLines);
					}
					break;
			}
		}

		window.addEventListener('lineChange', lineChangeListener);
		return () => {
			window.removeEventListener('lineChange', lineChangeListener);
		}
	}, [lines]);

	return <svg width={5000} height={5000} style={{ margin: '-2500px 0 0 -2500px' }} className="absolute top-0 left-0 pointer-events-none">
		{lines.map((line) => <Line
			key={line.id}
			id={line.id}
			startX={line.start.x}
			startY={line.start.y}
			endX={line.end.x}
			endY={line.end.y}
		/>)}
	</svg>
}

export function Editor({ className }) {
	const [nodes, setNodes] = useState([]);

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
		<LineComposer />
		{renderedNodes}
	</div>
}