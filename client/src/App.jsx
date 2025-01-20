import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:3000');

function App() {
  const [transcriptions, setTranscriptions] = useState([]);

  useEffect(() => {
    socket.on('newTranscription', (data) => {
      setTranscriptions(prev => [...prev, data]);
    });

    return () => {
      socket.off('newTranscription');
    };
  }, []);

  return (
    <div>
      <h1>Video Transcription Monitor</h1>
      {transcriptions.map((item, index) => (
        <div key={index}>
          <h3>{item.fileName}</h3>
          <pre>{item.transcription}</pre>
        </div>
      ))}
    </div>
  );
}

export default App; 