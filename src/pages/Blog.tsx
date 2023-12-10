import { Layout, Flex, Divider } from "antd";
import { Link } from 'react-router-dom'
import "./Blog.css"

export default function Blog() {
	return (
		<div style={{ overflow: "auto", backgroundImage: "linear-gradient(to bottom right, CornflowerBlue, Pink)", backgroundAttachment: "fixed", zIndex: "-1" }}>
			{/* <div style={{width: '100vw', height: '100vh', backgroundImage: "linear-gradient(to bottom right, CornflowerBlue, Pink)", position: "sticky", top: "0px", zIndex: "-1"}}/> */}
			<Layout style={{ display: 'flex', height: '100vh', backgroundColor: 'transparent' }}>

				<Flex gap="small" className="header" align="center" style={{ color: "white", backgroundColor: 'rgba(0,0,0,0.3)', padding: '0.5em 1em', height: "46px", width: "100%", zIndex: "1" }}>
					<Link to="/" className='App-link' >WebAudio Node Editor</Link>
					<Divider type="vertical" style={{ top: "0px", height: "20px", borderLeft: "2px solid rgba(255,255,255,0.4)" }}></Divider>
					<Link to="/blog" className='App-header'>Blog</Link>
					<Divider type="vertical" style={{ top: "0px", height: "20px", borderLeft: "2px solid rgba(255,255,255,0.4)" }}></Divider>
					<Link to="/documentation" className='App-link'>Documentation</Link>
					<div style={{ flexGrow: 1 }} />
				</Flex>
				<Layout style={{ display: 'flex', width: '75%', overflow: "auto", margin: 'auto', backgroundColor: 'rgba(0,0,0,0.2)', padding: '0em 2em' }}>
					<div className="Blog-header">What is this?</div>
					<div className="Blog-content">This is a node-based editor for WebAudio
						created using <a className="Blog-link" href="https://retejs.org/" target="_blank" rel="noreferrer">Rete.js</a>,
						a Javascript framework for visual programming through node editors. Node editors are widely used
						in shader editors and even game programming (as in Unreal Engine's Blueprints). Having used
						node editors for Blender and other software, I wanted to
						take a stab at making my own node editor for WebAudio, since I found that I really missed having something
						like this while working on the homework for this class.</div>
					<div className="Blog-content">
						Note: this has only been fully tested in Google Chrome. I know some things don't work in Firefox, and I'm not sure about other browsers.
					</div>
					<div className="Blog-header">Implementation</div>
					<div className="Blog-content">
						The nice thing about this project is that WebAudio already naturally lends itself to a node-based
						approach. Since the underlying structure of WebAudio is already based on nodes and connections,
						all that needs to really be done is to link up the data connections of Rete's nodes with WebAudio
						nodes.
					</div>
					<div className="Blog-content">
						The basic structure of a Rete node contains a series of inputs, outputs, and controls.
						Inputs and outputs are fairly self-explanatory, and controls are the modifiable fields that
						let us control the node's parameters without explicitly attaching an input (such as the waveform
						field on an oscillator node). The frequency and time domain visualizers are implemented as custom
						versions of controls as well - Rete is highly customizable, and I had to write many custom components
						for this project. Generally speaking, I implemented most numerical parameters of AudioNodes as inputs,
						and nonnumerical inputs (e.g. waveform, filter type) as controls. This ensures that the data flow through
						connections is strictly limited to numerical data (which is actually AudioNodes under the hood, even for constants).
					</div>
					<div className="Blog-content">
						Finally, all nodes being used with Rete's Dataflow Engine (one way to process data in Rete)
						require a data() method. This is what transforms the inputs of a node into the output signal.
						Generally, most of my nodes simply create their corresponding AudioNode and connect() their
						inputs accordingly, and return the new node as the signal to be sent to the next node.
					</div>
					<div className="Blog-header">Design Choices</div>
					<div className="Blog-content">
						One early design decision was to have "base frequency/gain" and "additional frequency/gain"
						inputs on the oscillator and gain nodes. These fields are normally just one parameter on their
						WebAudio versions. However, I felt that the pattern of adding a signal to a constant base was
						common enough in WebAudio to add these controls.
					</div>
					<div className="Blog-content">
						I also chose to add some utilities I used often: transposition and note frequencies. When testing,
						I found that I was often hardcoding frequencies like A=440Hz and doubling/halving it to shift octaves.
						These nodes are natural extensions of those operations, and I've gotten a lot of mileage out of them!
					</div>
					<div className="Blog-content">
						Moving on, my end goal for this project was to create something that could be used to easily
						prototype keyboard-playable synths.
						This turned out to be much more difficult than the baseline of just having oscillators,
						noise nodes, and constant nodes as the only audio sources, because we need <i>25</i> oscillators
						to represent every playable note. To support this, I decided to add bundleable signals,
						inspired somewhat by the pack nodes of Max and Pure Data.
					</div>
					<div className="Blog-content">
						In short, a bundled signal allows many more nodes to be created from a single series of
						connections than usual. (See
						the <Link to="/documentation" className="Blog-link">documentation</Link> for
						how this works!) Bundling turned out
						to add a great deal of complexity to the project, since inputs turned from single-dimensional
						arrays into two-dimensional arrays, and Cartesian products got involved down the line, but
						they added a lot of capacity for compactness in the node graph, and I'm happy with
						how it turned out.
					</div>
					<div className="Blog-content">
						Keyboard-playable notes were the last feature I added, and I'm honestly not entirely satisfied
						with the final implementation. They're functional, but not as flexible as I would've wanted.
						Ideally, I would have the ADSR envelope as its own node, separate from the oscillators
						and their frequencies, but I just couldn't figure out a flexible enough way to have these
						elements link together properly, so instead I opted for a mega node. It... works I guess?
					</div>
					<div className="Blog-header">Limitations and Future Steps</div>
					<div className="Blog-content">
						- Some clipping prevention is included through a DynamicsCompressorNode, but it's not always enough
					</div>
					<div className="Blog-content">
						- Bundling is still somewhat hard to understand
					</div>
					<div className="Blog-content">
						- I haven't figured out how to get AudioWorkletNodes to play
						nice with React yet, but I hope I can get this soon (if I get this, then
						I could implement things like Karplus-Strong, and socketable transposition nodes!)
					</div>
					<div className="Blog-content">
						- Errors can force you to have to refresh before the app works again
					</div>
					<div className="Blog-content">
						- There's noticeable clicking artifacts when reevaluating the node graph
					</div>
					<div className="Blog-content">
						- I'm bad at web development and this is my first project that isn't
						just vanilla HTML/CSS/JS, so I'm sure there's bad code practices in here
					</div>
					<div className="Blog-header">Thanks for checking this out!</div>
					<div className="Blog-content">
						&nbsp;&nbsp;&nbsp;&nbsp; - Ryan
					</div>
				</Layout>
			</Layout></div>)
}