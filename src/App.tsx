import React from 'react';
import { useRete } from 'rete-react-plugin';
import './App.css';
import './rete.css';
import { initAudio, createEditor } from './rete';
import { Layout, Button, Space } from "antd";

function App() {
  const [ref, editor]: readonly [any, any] = useRete(createEditor)

  return (
    <Layout style={{ display: 'flex', height: '100vh', backgroundImage: "linear-gradient(to bottom right, CornflowerBlue, Pink)" }}>
      <Space className="header" align="start" style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '0.5em'}}>
        <Button onClick={() => editor?.importEditorFromFile()}>Import</Button>
        <Button onClick={() => editor?.exportEditorToFile()}>Export</Button>
        <Button onClick={() => editor?.clearEditor()}>Clear</Button>
        <Button onClick={initAudio}>Toggle Audio</Button>
        <Button onClick={() => editor?.layout(true)}>Auto-arrange nodes</Button>
      </Space>
        <div ref={ref} style={{ 
          height: "100vh", 
          width: "100vw", 
          color: 'white', 
          
          }} />
    </Layout>)
}

export default App
