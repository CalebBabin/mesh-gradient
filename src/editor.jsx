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

function Connector({node, nodeX, nodeY, side = 1}) {
	const [targetX, setTargetX] = useState(100);
	const [targetY, setTargetY] = useState(-100);

	return <div className={(side > 0 ? "left-full" : "right-full") + " top-1/2 absolute"}>
		<div className="-m-1 w-2 h-2 bg-blue-300 hover:-m-2 hover:w-4 hover:h-4 hover:bg-blue-600" />
		<div style={{
			transform: 'translate(' + (targetX - nodeX) + 'px,'+(targetY - nodeY)+'px)',
		}} className="-m-1 w-2 h-2 bg-blue-300 hover:-m-2 hover:w-4 hover:h-4 hover:bg-blue-600" />
	</div>
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
		style={{
			transform: 'translate(' + x + 'px, ' + y + 'px)',
		}}
		className={"absolute bg-black border-white border text-white p-2" + NODE_SIZE_CLASS}
	>
		Node!
		<Connector side={1} nodeX={x} nodeY={y} />
	</div>
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
		{renderedNodes}
	</div>
}