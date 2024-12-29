import { Delete, DragIndicator } from "@mui/icons-material";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { EventEmitter } from "./emitter";
import { StartShader, StopShader } from "./shaders/StartStopUtils";
import { compileShaders } from "./shaders/BASE";
import { CheckerboardShader } from "./shaders/Checkerboard";
import { BubbleShader } from "./shaders/bubbles";

const nodeWidth = 300;
const nodeHeight = 200;

const SVGCanvasSize = 5000;
const SVGCanvasSizeHalf = SVGCanvasSize / 2;

const NodeContext = createContext({
	nodeMap: new Map(),
});

let globalID = 0;
export class Node extends EventEmitter {
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
	deletable = true;

	static defaultProps = {
		x: 0,
		y: 0,
		deletable: true,
	}

	constructor(props, context) {
		super();
		this.context = context;
		context.nodeMap.set(this.id, this);
		const config = Object.assign({ ...Node.defaultProps }, props);


		this.x = config.x;
		this.y = config.y;
		this.deletable = config.deletable;
		this.shader = config.shader;
		this.in = config.in;
		this.out = config.out;

		config.shader.on('recompile', () => {
			this.recompile();
		})
	}

	recompile() {
		this.broadcast('recompile');
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
			shader: this.shader,
			deletable: this.deletable,
		}
	}

	/**
	 * deletes this node
	 */
	delete() {
		if (this.deleting || this.deletable === false) return;
		this.context.nodeMap.delete(this.id);
		if (this.in) {
			this.in.disconnect(this, false);
		}
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
export function useNodeData(node) {
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
			stroke="#222222"
			strokeWidth="5"
			fill="none"
		/>
		<path
			d={`M ${SVGCanvasSizeHalf + (startX)} ${SVGCanvasSizeHalf + (startY)} C ${SVGCanvasSizeHalf + startX + Math.abs(xDist)} ${SVGCanvasSizeHalf + (startY)} ${SVGCanvasSizeHalf + endX - Math.abs(xDist)} ${SVGCanvasSizeHalf + (endY)} ${SVGCanvasSizeHalf + (endX)} ${SVGCanvasSizeHalf + (endY)}`}
			stroke="#ffffff"
			strokeWidth="2"
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
				transform: 'translate(' + (a_data.x + 10 + nodeWidth / 2 - 1) + 'px,' + (a_data.y + nodeHeight / 2) + 'px)',
			}}
			data-connector={true}
			className="absolute z-20 top-1/2 left-1/2 -my-2 w-4 h-4 bg-blue-300 hover:w-5 hover:h-5 rounded-r-full hover:bg-blue-600"
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
		{data?.shader?.connectOut ? <Connector
			nodeA={node}
			nodeB={data.out}
		/> : null}
		<div
			onDrop={e => {
				if (!data?.shader?.connectIn) return;
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
				if (!data?.shader?.connectIn) {
					e.dataTransfer.dropEffect = 'none';
				}
			}}
			onDragOver={e => {
				e.preventDefault();
			}}
			onDragExit={e => {
				setOutlined(false);
			}}
			className={"absolute z-10 text-white box-border"}
			style={{
				transform: 'translate(' + data.x + 'px, ' + data.y + 'px)',
				outline: outlined ? '2px dashed blue' : '',
				width: nodeWidth + 'px',
				marginLeft: -nodeWidth / 2 + 'px',
				height: nodeHeight + 'px',
				marginHeight: -nodeHeight / 2 + 'px',
			}}
		>
			<div className="absolute inset-0 -m-2 window -z-50">
				<div className="window-body absolute inset-0" />
			</div>
			<div className="flex justify-between items-center relative z-10 p-1 pointer-events-none">
				<button
					className="pointer-events-none"
					style={{
						display: data.deletable === false ? 'none' : 'block',
					}} onClick={() => {
						node.delete();
					}}
				>
					<Delete />
				</button>
				<span />
				<button
					className="cursor-move pointer-events-auto"
					ref={handleRef}
				>
					<DragIndicator />
				</button>
			</div>
			{node?.shader?.UI ? <node.shader.UI node={node} shader={node.shader} /> : null}
		</div>
	</>
}

export function EditorWithNodeContext({ onChange }) {
	const map = useMemo(() => new Map(), []);
	return <NodeContext.Provider
		value={{
			nodeMap: map,
		}}
	>
		<Editor
			onChange={onChange}
		/>
	</NodeContext.Provider>
}

function Editor({ onChange }) {
	const [nodes, setNodes] = useState([]);
	const context = useContext(NodeContext);

	useEffect(() => {
		if (nodes.length === 0) return;

		const timeout = setTimeout(() => {
			const startNode = nodes.find(node => node?.shader?.type === 'StartShader');
			if (!startNode) {
				console.error('error finding start node!');
				console.log(nodes);
			} else {
				onChange(compileShaders(startNode));

				const finalNodes = [];
				let node = startNode;
				while (node.out) {
					finalNodes.push(node.out);
					node = node.out;
				}
			}
		}, 100);
		return () => {
			clearTimeout(timeout);
		}
	}, [nodes]);

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
			if (nodes[i] !== node) newNodes.push(nodes[i]);
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

			const maxNodeCount = 5;
			const tempNodeWidth = nodeWidth + 50
			const startX = (-maxNodeCount / 2) * tempNodeWidth + tempNodeWidth / 2;

			let nodeCount = 0;
			const new_nodes = [];
			const startNode = new Node({ deletable: false, shader: new StartShader(), x: startX + (nodeCount++) * tempNodeWidth }, context);
			new_nodes.push(startNode);

			const checkerNode = new Node({
				x: startX + (nodeCount++) * tempNodeWidth,
				shader: new CheckerboardShader()
			}, context);
			checkerNode.connect(startNode, checkerNode);
			new_nodes.push(checkerNode);


			const bubbleNode = new Node({
				x: startX + (nodeCount++) * tempNodeWidth,
				shader: new BubbleShader({
					size: 0.3,
					height: 0.5,
				}),
			}, context);
			bubbleNode.connect(checkerNode, bubbleNode);
			new_nodes.push(bubbleNode);

			const bubbleNode2 = new Node({
				x: startX + (nodeCount++) * tempNodeWidth,
				shader: new BubbleShader({
					size: 0.7,
					height: 0.5,
				}),
			}, context);
			bubbleNode2.connect(bubbleNode, bubbleNode2);
			new_nodes.push(bubbleNode2);

			const endNode = new Node({ deletable: false, shader: new StopShader(), x: startX + (nodeCount++) * tempNodeWidth }, context);
			endNode.connect(bubbleNode2, endNode);

			new_nodes.push(endNode);

			addNode(...new_nodes);
		}, 1000);
		return () => {
			clearTimeout(timeout);
		}
	}, [nodes, addNode]);

	useEffect(() => {
		const listenNodes = [];
		function listener(node) {
			deleteNode(node);
		}
		function recompileListener() {
			setNodes([...nodes]);
		}
		for (let i = 0; i < nodes.length; i++) {
			listenNodes.push(nodes[i]);
			nodes[i].on('delete', listener);
			nodes[i].on('recompile', recompileListener);
		}
		return () => {
			for (let i = 0; i < listenNodes.length; i++) {
				listenNodes[i].off('delete', listener);
				nodes[i].off('recompile', recompileListener);
			}
		}
	}, [nodes, deleteNode]);

	return <div className={"absolute top-1/2 left-1/2"}>
		{renderedNodes}
	</div>
};