import { Layout, Flex, Divider } from "antd";
import { Link } from 'react-router-dom'
import "./Blog.css"

export default function Documentation() {
	return (
		<div style={{ overflow: "auto", backgroundImage: "linear-gradient(to bottom right, CornflowerBlue, Pink)", backgroundAttachment: "fixed", zIndex: "-1" }}>
			{/* <div style={{width: '100vw', height: '100vh', backgroundImage: "linear-gradient(to bottom right, CornflowerBlue, Pink)", position: "sticky", top: "0px", zIndex: "-1"}}/> */}
			<Layout style={{ display: 'flex', height: '100vh', backgroundColor: 'transparent' }}>

				<Flex gap="small" className="header" align="center" style={{ color: "white", backgroundColor: 'rgba(0,0,0,0.3)', padding: '0.5em 1em', height: "46px", width: "100%", zIndex: "1" }}>
					<Link to="/" className='App-link' >WebAudio Node Editor</Link>
					<Divider type="vertical" style={{ top: "0px", height: "20px", borderLeft: "2px solid rgba(255,255,255,0.4)" }}></Divider>
					<Link to="/blog" className='App-link'>Blog</Link>
					<Divider type="vertical" style={{ top: "0px", height: "20px", borderLeft: "2px solid rgba(255,255,255,0.4)" }}></Divider>
					<Link to="/documentation" className='App-header'>Documentation</Link>
					<div style={{ flexGrow: 1 }} />
				</Flex>
				<Layout style={{ display: 'flex', width: '75%', overflow: "auto", margin: 'auto', backgroundColor: 'rgba(0,0,0,0.2)', padding: '0em 2em' }}>
					<div className="Blog-header">Basic Usage</div>
					<div className="Blog-content">
						Drag from socket to socket to create connections between nodes.<br />
						Right click on empty space to open the context menu, letting you create new nodes.<br />
						Right click on a node to open the context menu, letting you delete the node.<br />
						Use the auto-arrange button in the upper right to stay organized.
					</div>
					<div className="Blog-header">Basic Nodes</div>
					<div className="Blog-content">
						The most essential nodes fall into three categories:<br />
						- Audio Sources: These are your oscillators, noise nodes, and constants. They
						are the first source of signals within your graph. Without them, no signal will
						be present propagate through your nodes and connections.<br />
						- Processors: Filters, gain nodes, and the like. These nodes take in a signal,
						modify it somehow, and pass the modified signal through. They're typically
						just like their WebAudio versions.<br />
						- Outputs: The end points of your signals. Without being connected to an output
						(whether directly or indirectly), your signals won't have any perceivable effect.
						Visualizers let you see what the signal's like, and audio outputs let you hear it.
						The Universal Output node combines both visualizers, and audio output, and a gain node.
						In addition to their normal function, these nodes are also useful for debugging your signal.
					</div>
					<div className="Blog-header">Input behavior</div>
					<div className="Blog-content">
						When an input (with a socket) also has an editable field, such as the Base Frequency field
						of an oscillator node, adding a connection to the socket will <i>overwrite</i> the value in
						the editable field.
					</div>
					<div className="Blog-content">
						With basic, unbundled signals, when multiple signals are connected to a single socket, they
						add <i>additively</i>. That means if you pass two signals with values 300 and 500 into
						the Additional Frequency field of an oscillator node, the additional frequency will be
						300+500=800. See the Signal Bundling section for more advanced behavior with bundled signals.
					</div>
					<div className="Blog-header">Frequency Signals vs Audio Signals</div>
					<div className="Blog-content">
						Some inputs produce signals that are intended to be interpreted as frequencies;
						these signals should therefore find their way to the frequency field of an oscillator
						at some point. Of course, it is valid to not use them this way, but the results might not
						be useful!
					</div>
					<div className="Blog-content">
						Note that audio signals can also be interpreted as frequencies. However, because audio
						signals are typically in the [-1, 1] range, you will often have to pass them through a
						gain node to use them in this way. See the AM+FM synthesis example for an example of
						how this is done.
					</div>
					<div className="Blog-header">Advanced Nodes</div>
					<div className="Blog-subheader">Note Frequency</div>
					<div className="Blog-content">
						This node is a special case of a constant signal node. It outputs a constant signal
						with a value equal to the frequency of the specified note.
					</div>
					<div className="Blog-subheader">Transpose</div>
					<div className="Blog-content">
						This node takes in a <i>frequency</i> signal and outputs an appropriately scaled
						frequency signal corresponding to the specified transposition. Note that one octave
						is equal to twelve halfsteps.
					</div>
					<div className="Blog-content">
						The transpose node <i>will not</i> work properly on audio signals - it will scale
						the amplitude of the signal, not the frequency.
					</div>
					<div className="Blog-subheader">Console Debugger</div>
					<div className="Blog-content">
						This node outputs the input to your browser's console. Use this to get an extra fine
						look at what's going on. However, note that WebAudio nodes don't actually provide any
						way to look at the connected nodes of an AudioNode, so the Console Debugger Node should
						be attached as closely to the point of interest as possible.<br />
						For example, if you have an oscillator feeding into a gain node, if you attach
						this node to the gain node, you will not be able to see the oscillator in the console.
						This node should instead be attached to the oscillator directly.
					</div>
					<div className="Blog-header">Signal Bundling</div>
					<div className="Blog-content">
						Signal bundling is probably the most complicated feature to learn in this project.
						It allows you to create far more concise node graphs for the same result; however,
						it should be noted that there is <i>nothing</i> you can do with signal bundling that you
						can't do without it. It would just take more nodes to do so and be messier.
					</div>
					<div className="Blog-content">
						See the Chord example to see how signal bundling can be used. Note how with the use of
						5 frequencies and 4 gain values, we can produce 20 notes with a single oscillator node (in the
						node editor). I have found that this is the most commonly applicable use case of signal bundling.
					</div>
					<div className="Blog-subheader">So what does it do?</div>
					<div className="Blog-content">
						When a node receives a bundled signal of width <i>n</i>, it treats it as if <i>n</i> separate
						nodes each received one of the signals. For example, let our bundled signal
						of width 3 be the constant signals [100, 200, 300]. When we feed this bundled signal
						into an oscillator node's base frequency field, the output will be a 3-wide bundled signal of
						3 oscillators, with frequencies 100, 200, and 300.
					</div>
					<div className="Blog-content">
						Things are more complicated when a node receives multiple bundled signals.
						If a node receives bundled signals in different sockets, the output will be the Cartesian products.
						That is, if a gain node receives a 3-wide bundled signal of constants [1,5,7] in its signal field
						and a 2-wide bundled signal of constants [2, 3] in its gain field, the output will be a 6-wide
						bundled signal consisting of [1*2 = 2, 1*3 = 3, 5*2 = 10, 5*3 = 15, 7*2 = 14, 7*3 = 21].
					</div>
					<div className="Blog-content">
						If, for whatever reason, you decide to pass in multiple bundled signals to one socket, the socket's
						input is treated as the Cartesian product of the bundled signals. That is, the socket inputs
						[a, b], [c], and [d, e] become the bundled signal [[a,c,d], [a,c,e], [b,c,d], [b,c,e]], where
						[a, c, d] is then treated additively as the signal a+c+d.
						I have yet to find a real use case for this beyond combining a bundled signal with multiple unbundled signals.
						It is typically far more useful to have only one bundled signal per socket, possibly combined with some 
						unbundled signals.
					</div>
					<div className="Blog-content">
						Finally, note that all bundles are implictly flattened when connected to an output node (except the Console 
						Debugger node). See the Bundle Flattener node for details.
					</div>
					<div className="Blog-header">Bundler Nodes</div>
					<div className="Blog-subheader">Signal Bundler</div>
					<div className="Blog-content">
						This node takes in multiple signals and produces a bundle of those signals. This is one of the only nodes for which
						multiple inputs to the same socket are <i>not</i> treated additively. For example, feeding in the constants 100 and 200
						produces the bundle [100, 200].
					</div>
					<div className="Blog-content">
						This is the only non-output node for which passing in multiple bundled signals does not take the Cartesian product. Instead, the bundles are
						"flattened" and combined into a new bundle. For example, the inputs [[a,b],[c],[d,e]] will produce a single output bundle [a,b,c,d,e].
					</div>
					<div className="Blog-subheader">Bundle Flattener</div>
					<div className="Blog-content">
						This node takes in signals and combines them additively into a single output signal (by feeding all signals in the bundle into a 
						gain node of gain 1). For example, the inputs [[a,b],[c],[d,e]] will produce one single-width output [a+b+c+d+e].
					</div>
					<div className="Blog-subheader">Bundle Debugger</div>
					<div className="Blog-content">
						While the Signal Bundler node comes with an information field displaying the width of the output bundle, it can often be helpful
						to debug the width of a bundle at an intermediate step (such as after one node takes multiple bundles as input). The signal bundler node
						shows the width of a bundle at its connected point.
					</div>
					<div className="Blog-header">Signal Bundling Best Practices</div>
					<div className="Blog-content">
						Signal bundles should be used somewhat sparingly. Due to their multiplicative nature with the Cartesian products involved, bundles can quickly
						grow out of control to the point of crashing the browser if not used with care.<br/>However, it should be noted that multiplicative growth will
						only occur when multiple bundles are passed into the same node.<br/> Generally, the output width of a node is equal to the product of the 
						bundle widths of all inputs.
					</div>
					<div className="Blog-content">
						Bundles should be flattened as early as possible to reduce the number of nodes created. For example, if your entire setup consists of bundled frequencies 
						passed into an oscillator which is then passed into a gain node, you should flatten the bundle immediately after the oscillator and before the gain node.
						This is because <i>n</i> gain nodes with one input signal each is functionally identical to one gain node with <i>n</i> input signals.
					</div>
					<div className="Blog-content">See the chord example
						for a demonstration of this technique; the signal connected to the audio output is of bundle width 1, while the other signal is bundle width 20, but they
						produce identical outputs.
					</div>
					<div className="Blog-header">Keyboard Note</div>
					<div className="Blog-content">
						The Keyboard Note node allows you to play notes from your keyboard. By default, the notes range from C4 to C6, but they can be transposed as a whole 
						via the controls on the node. Note that the output of this node is a 25-width bundle of oscillators passed through gain nodes; therefore, the output 
						signal is an audio signal and transposition nodes will not work properly on the output of this node (so use its built-in controls!).
					</div>
					<div className="Blog-content">
						Each note's ADSR envelope's heights and interval lengths can be adjusted via the controls on the node. Amplitudes will ramp exponentially to each other
						over time (though this sounds linear to the human ear). Note that depending on your settings, clicking artifacts may occur.
					</div>
					<div className="Blog-content">
						Unless you have a specific use case in mind, it is often best to flatten the output of this node immediately.
					</div>
				</Layout>
			</Layout></div>)
}