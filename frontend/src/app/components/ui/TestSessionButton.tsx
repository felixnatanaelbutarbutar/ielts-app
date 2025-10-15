// frontend/src/app/components/ui/TestSessionButton.tsx
import { useState } from "react";

export function TestSessionButton() {
  const [result, setResult] = useState<string>("");

  const handleTest = async () => {
    try {
      const res = await fetch("/api/proxy/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: "hello from frontend" }),
      });

      const data = await res.json();
      console.log("Response:", data);
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(err);
      setResult("Error: " + err);
    }
  };

  return (
    <div className="p-4">
      <button
        onClick={handleTest}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        🔄 Test /api/proxy/sessions
      </button>

      {result && (
        <pre className="bg-gray-100 p-2 mt-4 rounded text-sm">{result}</pre>
      )}
    </div>
  );
}