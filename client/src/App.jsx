import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { createClient } from '@supabase/supabase-js';

const socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:3000');
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function App() {
  const [transcriptions, setTranscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial transcriptions
    async function loadTranscriptions() {
      const { data } = await supabase
        .from('video_transcriptions')
        .select('*')
        .order('created_at', { ascending: false });
      
      setTranscriptions(data || []);
      setLoading(false);
    }

    loadTranscriptions();

    // Listen for new pending transcriptions
    socket.on('newPendingTranscription', (record) => {
      setTranscriptions(prev => [record, ...prev]);
    });

    // Listen for completed transcriptions
    socket.on('transcriptionComplete', (updatedRecord) => {
      setTranscriptions(prev => 
        prev.map(item => 
          item.id === updatedRecord.id ? updatedRecord : item
        )
      );
    });

    return () => {
      socket.off('newPendingTranscription');
      socket.off('transcriptionComplete');
    };
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Video Transcription Monitor</h1>
      {transcriptions.map((item) => (
        <div key={item.id} className="mb-4 p-4 border rounded">
          <h3 className="font-bold">{item.file_name}</h3>
          <p className="text-sm text-gray-500">
            Status: {item.status}
          </p>
          {item.transcription ? (
            <pre className="mt-2 whitespace-pre-wrap">{item.transcription}</pre>
          ) : (
            <p className="mt-2 text-gray-400">Transcription pending...</p>
          )}
        </div>
      ))}
    </div>
  );
}

export default App; 