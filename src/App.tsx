import React from 'react';
import { useRete } from 'rete-react-plugin';
import './App.css';
import './rete.css';
import { initAudio, createEditor } from './rete';
import { Button, Space } from "antd";

function App() {
  const [ref, editor]: readonly [any, any] = useRete(createEditor)

  return (
    <div className="App">
      <header className="App-header">
        <Space>
          <Button onClick={() => editor?.importEditorFromFile()}>Import</Button>
          <Button onClick={() => editor?.exportEditorToFile()}>Export</Button>
          <Button onClick={() => editor?.clearEditor()}>Clear</Button>
          <Button onClick={initAudio}>Toggle Audio</Button>
          <Button onClick={() => editor?.layout(true)}>Auto-arrange nodes</Button>
        </Space>
        <div ref={ref} className="rete">
        </div>
      </header>
    </div>
  );
}

export default App
