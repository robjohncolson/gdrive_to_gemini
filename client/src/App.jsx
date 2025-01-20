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
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Socket connection status
    socket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    // Load initial transcriptions
    async function loadTranscriptions() {
      try {
        const { data, error: supabaseError } = await supabase
          .from('video_transcriptions')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (supabaseError) throw supabaseError;
        setTranscriptions(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadTranscriptions();

    // Socket event listeners
    socket.on('newPendingTranscription', (record) => {
      setTranscriptions(prev => [record, ...prev]);
    });

    socket.on('transcriptionComplete', (updatedRecord) => {
      setTranscriptions(prev => 
        prev.map(item => 
          item.id === updatedRecord.id ? updatedRecord : item
        )
      );
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('newPendingTranscription');
      socket.off('transcriptionComplete');
    };
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Video Transcription Monitor
          </h1>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
              {connected ? 'Connected to server' : 'Disconnected'}
            </span>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : (
          <div className="space-y-4">
            {transcriptions.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-lg shadow">
                <p className="text-gray-500">No transcriptions yet</p>
              </div>
            ) : (
              transcriptions.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {item.file_name}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      item.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  
                  {item.transcription ? (
                    <pre className="mt-4 p-4 bg-gray-50 rounded-md text-sm whitespace-pre-wrap">
                      {item.transcription}
                    </pre>
                  ) : (
                    <div className="mt-4 text-gray-500 text-center py-4">
                      <p>Transcription in progress...</p>
                      <div className="mt-2 animate-pulse flex justify-center">
                        <div className="h-2 w-24 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 text-xs text-gray-500">
                    Created: {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App; 