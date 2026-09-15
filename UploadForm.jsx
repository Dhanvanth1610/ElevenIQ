import React, { useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

export default function UploadForm({ onJobStarted }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API_BASE}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onJobStarted(res.data.job_id);
    } catch (err) {
      alert("Upload failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-card">
      <h3>⚽ Upload match or training footage</h3>
      <p className="subtitle">
        Fixed-camera clips work best (full-pitch or wide tactical angle). MP4/MOV,
        ideally under 5 minutes for a fast first pass through the pipeline.
      </p>
      <div className="upload-row">
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button onClick={handleUpload} disabled={!file || uploading}>
          {uploading ? "Uploading…" : "Kick off analysis"}
        </button>
        {file && !uploading && (
          <span className="subtitle" style={{ marginBottom: 0 }}>
            {file.name}
          </span>
        )}
      </div>
    </div>
  );
}
