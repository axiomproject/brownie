import { useEffect, useState } from 'react';
import { API_URL } from '@/config';

export default function FeedbackDebug() {
  const [, setData] = useState<any>(null);
  const [, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/feedback/all`)
      .then(res => res.json())
      .then(data => {
        setData(data);
        document.getElementById('json')!.textContent = 
          JSON.stringify(data, null, 2);
      })
      .catch(err => {
        setError(err.message);
        document.getElementById('json')!.textContent = 
          `Error loading data: ${err.message}`;
      });
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Feedback Debug View</h1>
      <pre id="json" className="bg-muted p-4 rounded-lg overflow-auto max-h-[80vh]">
        Loading...
      </pre>
    </div>
  );
}
