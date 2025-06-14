import { useEffect, useState } from 'react';

export default function FeedbackDebug() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/feedback/all')
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
