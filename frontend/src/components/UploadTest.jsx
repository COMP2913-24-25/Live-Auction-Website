import { useState } from "react";

export default function UploadTest() {
  const [itemID, setItemID] = useState("");
  const [imageURL, setImageURL] = useState("");
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResponse(null);
    setError(null);

    try {
      const res = await fetch("http://localhost:5000/api/upload-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ item_id: itemID, image_url: imageURL }),
      });

      const data = await res.json();
      if (res.ok) {
        setResponse(data);
      } else {
        setError(data.error || "Failed to upload image");
      }
    } catch (err) {
      setError("Network error or server unreachable");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", textAlign: "center" }}>
      <h2>Test Image Upload</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Item ID"
          value={itemID}
          onChange={(e) => setItemID(e.target.value)}
          required
          style={{ display: "block", width: "100%", marginBottom: 10 }}
        />
        <input
          type="text"
          placeholder="Image URL"
          value={imageURL}
          onChange={(e) => setImageURL(e.target.value)}
          required
          style={{ display: "block", width: "100%", marginBottom: 10 }}
        />
        <button type="submit" style={{ width: "100%", padding: 10 }}>Upload</button>
      </form>

      {response && <p style={{ color: "green" }}>Success: {JSON.stringify(response)}</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
    </div>
  );
}
