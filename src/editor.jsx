import { Delete, DragIndicator } from "@mui/icons-material";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { EventEmitter } from "./emitter";

const nodeWidth = 300;
const nodeHeight = 150;

const SVGCanvasSize = 5000;
const SVGCanvasSizeHalf = SVGCanvasSize / 2;

const NodeContext = createContext({
	nodeMap: new Map(),
});

let globalID = 0;
class Node extends EventEmitter {
	id = globalID++;
	x = 0;
	y = 0;
	/**
	 * @type {Node | undefined}
	 */
	in = undefined;
	/**
	 * @type {Node | undefined}
	 */
	out = undefined;
	defaultProps = {
		type: "presetBigNoiseA",
		x: 0,
		y: 0
	}

	constructor(props, context) {
		super();
		this.context = context;
		context.nodeMap.set(this.id, this);
		const config = Object.assign({ ...this.defaultProps }, props);
		for (const key in config) {
			if (Object.hasOwnProperty.call(config, key)) {
				this[key] = config[key];
			}
		}
	}

	/**
	 * @param {number} x 
	 * @param {number} y 
	 */
	move(x, y) {
		this.x = x;
		this.y = y;
		this.broadcast('move', { x, y });
	}

	/**
	 * Connects one node to another
	 * @param {Node} connect_in 
	 * @param {Node} connect_out 
	 */
	connect(connect_in, connect_out, propagate = true) {
		if (connect_in === this) {
			if (this.out) {
				this.out.disconnect(this, false);
			}
			this.out = connect_out;
			if (propagate) connect_out.connect(this, connect_out, false);
		} else if (connect_out === this) {
			if (this.in) {
				this.in.disconnect(this, false);
			}
			this.in = connect_in;
			if (propagate) connect_in.connect(connect_in, this, false);
		} else {
			console.error('uh oh, I can\'t find myself here!');
		}

		this.broadcast('connection', this);
	}
	/**
	 * @param {Node} node 
	 */
	disconnect(node, propagate = true) {
		if (this.in === node) {
			this.in = undefined;
		}
		if (this.out === node) {
			this.out = undefined;
		}
		if (propagate) node.disconnect(this, false);
		this.broadcast('connection', this);
	}

	getData() {
		return {
			x: this.x,
			y: this.y,
			id: this.id,
			in: this.in,
			out: this.out,
		}
	}

	/**
	 * deletes this node
	 */
	delete() {
		if (this.deleting) return;
		this.context.nodeMap.delete(this.id);
		this.broadcast('delete', this);
		this.deleting = true;
	}
}

/**
 * @typedef {object} SerializedNode
 * @property {number} x
 * @property {number} y
 * @property {number} id
 */

/**
 * 
 * @param {Node} node 
 * @returns {SerializedNode} nodeData
 */
function useNodeData(node) {
	const [data, setData] = useState(node ? node.getData() : false);

	useEffect(() => {
		if (!node) return;
		function listener() {
			setData(node.getData());
		}
		listener();

		node.on('move', listener);
		node.on('connection', listener);

		const deleteListener = () => {
			setData(false);
		}
		node.on('delete', deleteListener);
		return () => {
			node.off('move', listener);
			node.off('connection', listener);
			node.off('delete', deleteListener);
		}
	}, [node]);

	return data;
}

function Line({ startX, startY, endX, endY }) {
	const yDist = endY - startY;
	let xDist = endX - startX;
	const ratio = Math.abs(xDist / yDist);
	xDist = xDist / ratio;
	if (Number.isNaN(xDist)) xDist = 2;

	return <svg
		width={5000}
		height={5000}
		style={{ margin: '-2500px 0 0 -2500px' }}
		className="absolute top-0 left-0 pointer-events-none"
	>
		<path
			d={`M ${SVGCanvasSizeHalf + (startX)} ${SVGCanvasSizeHalf + (startY)} C ${SVGCanvasSizeHalf + startX + Math.abs(xDist)} ${SVGCanvasSizeHalf + (startY)} ${SVGCanvasSizeHalf + endX - Math.abs(xDist)} ${SVGCanvasSizeHalf + (endY)} ${SVGCanvasSizeHalf + (endX)} ${SVGCanvasSizeHalf + (endY)}`}
			stroke="#ffffff"
			strokeWidth="4"
			strokeDasharray={10}
			fill="none"
		/>
	</svg>
}


function Connector({ nodeA, nodeB }) {
	const a_data = useNodeData(nodeA);
	const b_data = useNodeData(nodeB);

	return <>
		{(!b_data || !a_data) ? null : <Line
			startX={a_data.x + nodeWidth / 2}
			startY={a_data.y + nodeHeight / 2}
			endX={b_data.x - nodeWidth / 2}
			endY={b_data.y + nodeHeight / 2}
		/>}
		<div
			onDragStart={e => {
				e.dataTransfer.setData('text/plain', nodeA.id);
			}}
			draggable={true}
			style={{
				transform: 'translate(' + (a_data.x + nodeWidth / 2) + 'px,' + (a_data.y + nodeHeight / 2) + 'px)',
			}}
			data-connector={true}
			className="absolute z-20 top-1/2 left-1/2 -m-1 w-2 h-2 bg-blue-300 hover:-m-2 hover:w-4 hover:h-4 hover:bg-blue-600"
		/>
	</>;
}

const getUIXY = (e) => {
	if (e.targetTouches) {
		return {
			x: e.targetTouches[0].clientX,
			y: e.targetTouches[0].clientY,
		}
	} else {
		return {
			x: e.clientX,
			y: e.clientY,
		}
	}
}

/**
 * @param {Node} node
 */
function NodeRenderer({ node }) {
	const data = useNodeData(node);
	const { nodeMap } = useContext(NodeContext);
	const [outlined, setOutlined] = useState(false); // used for drag&drop hover effects
	const handleRef = useRef();

	useEffect(() => {
		if (!handleRef.current) return;
		const handle = handleRef.current;

		const nodeStart = { x: 0, y: 0 }
		const mouseStart = { x: 0, y: 0 };
		let mouseDown = false;

		const onMouseDown = (e) => {
			console.log(e);
			mouseDown = true;
			const { x, y } = getUIXY(e);
			mouseStart.x = x;
			mouseStart.y = y;
			nodeStart.x = node.x;
			nodeStart.y = node.y;
			e.preventDefault();
		};

		handle.addEventListener('mousedown', onMouseDown);
		handle.addEventListener('touchstart', onMouseDown);

		const moveListener = (e) => {
			if (!mouseDown) return;
			const { x, y } = getUIXY(e);
			e.preventDefault();
			const newX = nodeStart.x + (x - mouseStart.x);
			const newY = nodeStart.y + (y - mouseStart.y);
			node.move(newX, newY);
		}
		window.addEventListener('mousemove', moveListener);
		handle.addEventListener('touchmove', moveListener);

		const dehookListener = () => { mouseDown = false };

		handle.addEventListener('touchend', dehookListener);
		window.addEventListener('mouseup', dehookListener);
		window.addEventListener('blur', dehookListener);

		return () => {
			window.removeEventListener('mousemove', moveListener);
			window.removeEventListener('mouseup', dehookListener);
			window.removeEventListener('blur', dehookListener);

			if (!handleRef.current) return;
			handle.removeEventListener('mousedown', onMouseDown);
			handle.removeEventListener('touchstart', onMouseDown);
			handle.removeEventListener('touchend', dehookListener);
			handle.removeEventListener('touchmove', moveListener);
		}
	}, [handleRef]);

	return <>
		<Connector nodeA={node} nodeB={data.out} />
		<div
			onDrop={e => {
				const id = parseInt(e.dataTransfer.getData("text/plain"), 10);
				if (id !== node.id) {
					if (nodeMap.has(id)) {
						node.connect(nodeMap.get(id), node);
					} else {
						console.log('invalid target', id, nodeMap);
					}

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
			className={"absolute select-none z-10 box-border bg-black rounded-lg border-white/80 border-2 text-white p-2"}
			style={{
				transform: 'translate(' + data.x + 'px, ' + data.y + 'px)',
				outline: outlined ? '2px dashed blue' : 'none',
				width: nodeWidth + 'px',
				marginLeft: -nodeWidth / 2 + 'px',
				height: nodeHeight + 'px',
				marginHeight: -nodeHeight / 2 + 'px',
			}}
		>
			<div className="flex justify-between items-center">
				<button onClick={() => {
					node.delete();
				}}>
					<Delete />
				</button>
				<span className="text-white/50 font-black">{node.id}</span>
				<button
					className="cursor-move"
					ref={handleRef}
				>
					<DragIndicator />
				</button>
			</div>
			<div className="text-center my-4">
				Node!
			</div>
		</div>
	</>
}

export function EditorWithNodeContext() {
	const map = useMemo(() => new Map(), []);
	return <NodeContext.Provider value={{
		nodeMap: map,
	}}>
		<Editor />
	</NodeContext.Provider>
}

function Editor() {
	const [nodes, setNodes] = useState([]);
	const context = useContext(NodeContext);

	const addNode = useCallback((...args) => {
		const newNodes = [];
		for (let i = 0; i < args.length; i++) {
			newNodes.push(args[i]);
		}
		if (args.length === 0) {
			newNodes.push(new Node({}, context));
		}
		setNodes([...nodes, ...newNodes]);
	}, [nodes]);

	const deleteNode = useCallback((node) => {
		const newNodes = new Array();
		for (let i = 0; i < nodes.length; i++) {
			if (nodes[i].id !== node.id) newNodes.push(nodes[i]);
			else nodes[i].delete();
		}
		setNodes(newNodes);
	}, [nodes]);

	const renderedNodes = useMemo(() => {
		const renderedNodes = new Array(nodes.length);
		for (let i = 0; i < nodes.length; i++) {
			renderedNodes.push(<NodeRenderer
				key={nodes[i].id}
				addNode={addNode}
				node={nodes[i]}
			/>)
		}
		return renderedNodes;
	}, [nodes, addNode]);

	useEffect(() => {
		const timeout = setTimeout(() => {
			if (nodes.length > 0) return;
			addNode(new Node({}, context), new Node({}, context), new Node({}, context));
		}, 1000);
		return () => {
			clearTimeout(timeout);
		}
	}, [addNode]);

	useEffect(() => {
		const listenNodes = [];
		function listener(node) {
			deleteNode(node);
		}
		for (let i = 0; i < nodes.length; i++) {
			listenNodes.push(nodes[i]);
			nodes[i].on('delete', listener);
		}
		return () => {
			for (let i = 0; i < listenNodes.length; i++) {
				listenNodes[i].off('delete', listener);
			}
		}
	}, [nodes, deleteNode]);

	return <div className={"absolute top-1/2 left-1/2"}>
		{renderedNodes}
	</div>
};