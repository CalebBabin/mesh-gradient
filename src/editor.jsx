import { Delete, DragIndicator } from "@mui/icons-material";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { EventEmitter } from "./emitter";
import { StartShader } from "./shaders/start";
import { blendModes, compileShaders, useShaderData } from "./shaders/BASE";
import { CheckerboardShader } from "./shaders/checkerboard";
import { BubbleShader } from "./shaders/bubbles";
import { SimpleGradientShader } from "./shaders/simplegradient";
import { HeightGradientShader } from "./shaders/heightGradient";
import { PinEdgesShader } from "./shaders/pinEdges";
import { WaveShader } from "./shaders/waves";

const nodeWidth = 300;
const nodeHeight = 225;

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
	_in = undefined;
	/**
	 * @type {Node | undefined}
	 */
	_out = undefined;
	deletable = true;

	get in() {
		return this._in;
	}

	get out() {
		return this._out;
	}

	set in(node) {
		let retro = false;
		if (this._in !== undefined) {
			retro = this._in;
		}
		this._in = node;
		this.broadcast('connection', this);
		if (retro) {
			retro.broadcast('connection', retro);
		}
	}

	set out(node) {
		let retro = false;
		if (this._out !== undefined) {
			retro = this._out;
		}
		this._out = node;
		this.broadcast('connection', this);
		if (retro) {
			retro.broadcast('connection', retro);
		}
	}

	static defaults = {
		x: 0,
		y: 0,
		deletable: true,
	}

	constructor(props, context) {
		super();
		this.context = context;
		context.nodeMap.set(this.id, this);
		const config = Object.assign({ ...Node.defaults }, props);

		this.x = config.x;
		this.y = config.y;
		this.deletable = config.deletable;
		this.shader = config.shader;
		this.in = config.in;
		this.out = config.out;

		config.shader.on('recompile', () => {
			this.recompile();
		})
		this.on('connection', () => {
			this.recompile();
		});
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
				this.out.disconnect(this, true);
			}
			this.out = connect_out;
			if (propagate) connect_out.connect(this, connect_out, false);
		} else if (connect_out === this) {
			if (this.in) {
				this.in.disconnect(this, true);
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
		if (this.out) {
			this.out.disconnect(this, false);
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
		if (!node) {
			setData(false);
			return;
		}
		function moveListener() {
			setData(node.getData());
		}
		moveListener();

		function connectionListener() {
			setData(node.getData());
			node.recompile();
		}

		node.on('move', moveListener);
		node.on('connection', connectionListener);

		const deleteListener = () => {
			setData(false);
		}
		node.on('delete', deleteListener);
		return () => {
			node.off('move', moveListener);
			node.off('connection', connectionListener);
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
		{(!b_data || !a_data || (b_data.in === a_data) || (a_data.out === b_data)) ? null : <><Line
			startX={a_data.x + nodeWidth / 2}
			startY={a_data.y + nodeHeight / 2}
			endX={b_data.x - nodeWidth / 2}
			endY={b_data.y + nodeHeight / 2}
		/>
			<div
				onDragStart={e => {
					e.dataTransfer.setData('text/plain', nodeA.id);
				}}
				draggable={true}
				style={{
					transform: 'translate(' + (b_data.x + 10 - nodeWidth / 2 + 4) + 'px,' + (b_data.y + nodeHeight / 2) + 'px)',
					boxShadow: ' inset 1px 1px #fff, inset 0px -2px grey, inset 2px 2px #dfdfdf',
				}}
				data-connector={true}
				className="absolute z-10 top-1/2 left-1/2 -my-2 -mx-[calc(1.75rem-2.5px)] w-4 h-4 bg-[silver] hover:w-5 hover:h-5 rounded-l-full hover:bg-blue-600 cursor-grab"

			/>
		</>}
		<div
			onDragStart={e => {
				e.dataTransfer.setData('text/plain', nodeA.id);
			}}
			draggable={true}
			style={{
				transform: 'translate(' + (a_data.x + 10 + nodeWidth / 2 - 4) + 'px,' + (a_data.y + nodeHeight / 2) + 'px)',
				boxShadow: 'inset -1px -1px #0a0a0a, inset 0px 1px #dfdfdf, inset -2px -2px grey',
			}}
			data-connector={true}
			className="absolute z-10 top-1/2 left-1/2 -my-2 -mx-[calc(0.5rem-1px)] w-4 h-4 bg-[silver] hover:w-5 hover:h-5 rounded-r-full hover:bg-blue-600 cursor-grab"
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

function BlendModeSelector({ shader }) {
	const data = useShaderData(shader);
	const blendMode = data.blendMode ?? 'add';

	return <select className="pointer-events-auto" value={blendMode} onChange={e => {
		shader.data = {
			blendMode: e.target.value,
		}
	}}>
		${Object.keys(blendModes).map(mode => <option key={mode}>{mode}</option>)}
	</select>
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
			className={"absolute text-white box-border z-30"}
			style={{
				transform: 'translate(' + data.x + 'px, ' + data.y + 'px)',
				outline: outlined ? '2px dashed blue' : '',
				width: nodeWidth + 'px',
				marginLeft: -nodeWidth / 2 + 'px',
				height: nodeHeight + 'px',
				marginHeight: -nodeHeight / 2 + 'px',
			}}
		>
			<div className="absolute inset-0 window -z-50">
				<div className="window-body absolute inset-0" />
			</div>

			<div className="title-bar py-[0!important] relative z-50 gap-4 absolute top-0 left-0 right-0 m-[3px]">
				<div className="title-bar-text cursor-move w-full px-2 py-0.5" ref={handleRef}>
					{node.shader.type}
				</div>
				{node.shader.type !== 'StartShader' ? <BlendModeSelector shader={data.shader} /> : null}
				<div className="title-bar-controls" style={{
					display: data.deletable === false ? 'none' : '',
				}}>
					<button aria-label="Minimize" />
					<button aria-label="Maximize" />
					<button aria-label="Close"
						onClick={() => {
							node.delete();
						}}
					/>
				</div>
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
			const tempNodeWidth = nodeWidth + 50;
			const startX = (-maxNodeCount / 2) * tempNodeWidth + tempNodeWidth / 2;

			let nodeCount = 0;
			const new_nodes = [
				new Node({ deletable: false, shader: new StartShader(), x: startX + (nodeCount++) * tempNodeWidth }, context),
				new Node({
					x: startX + (nodeCount++) * tempNodeWidth,
					shader: new WaveShader({
						size: 0.4,
						height: 0.35,
						scaleFactor: 0.5,
					}),
				}, context),
				new Node({
					x: startX + (nodeCount++) * tempNodeWidth,
					shader: new WaveShader({
						size: 0.4,
						height: 0.35,
						scaleFactor: 0.5,
					}),
				}, context),
				new Node({
					x: startX + (nodeCount++) * tempNodeWidth,
					shader: new WaveShader({
						blendMode: 'subtract',
						size: 0.4,
						height: 0.5,
						scaleFactor: 0.5,
					}),
				}, context),
				new Node({
					x: startX + (nodeCount++) * tempNodeWidth,
					shader: new HeightGradientShader({
						minHeight: 0.35,
						maxHeight: 0.9,
						scale: 10
					}),
				}, context),
			];

			for (let i = 1; i < new_nodes.length; i++) {
				new_nodes[i].connect(new_nodes[i - 1], new_nodes[i]);
			}

			addNode(...new_nodes);
		}, 1000);
		return () => {
			clearTimeout(timeout);
		}
	}, [nodes, addNode]);

	useEffect(() => {
		const listenNodes = [];
		function listener(node) {
			console.log('deleting node', node)
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
		<AddNodePopup addNode={addNode} />
	</div>
};

const availableShaders = [
	CheckerboardShader,
	BubbleShader,
	SimpleGradientShader,
	HeightGradientShader,
	PinEdgesShader,
];
function AddNodePopup({ addNode }) {
	const context = useContext(NodeContext);
	const [active, setActive] = useState(false);
	return <>
		<button onClick={() => {
			setActive(!active);
		}} className="absolute top-[calc(-50vh+0.5rem)] left-[calc(-50vw+0.5rem)] z-[99]">
			{active ? 'close' : '+add'}
		</button>

		{active ? <div className="absolute top-[-50vh] left-[-50vw] p-4 gap-2 pt-16 w-32 max-w-[90vw] h-screen flex flex-col items-center bg-black/50 backdrop-blur-sm z-[98] overflow-auto">

			{availableShaders.map((Shader, i) => {
				return <button
					key={i}
					onClick={() => {
						console.log('adding', Shader.type);
						if (!context) {
							alert('no context!');
							return;
						}
						addNode(new Node({
							x: (Math.random() * 100 - 50) + 100,
							y: (Math.random() * 100 - 50),
							shader: new Shader({}, context),
						}, context));
						setActive(false);
					}}
				>
					{Shader.type}
				</button>
			})}
		</div> : null}
	</>
}