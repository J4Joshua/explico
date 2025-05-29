"use client";

import { useState } from "react";

const UploadQuestion = () => {
  const [file, setFile] = useState<File | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) setFile(selectedFile);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setAnswer(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/solve/", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to solve question.");
      const data = await res.json();
      setAnswer(data.answer || "No answer returned.");
    } catch (error) {
      console.error(error);
      setAnswer("There was an error solving the question.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
  className={`py-20 container-padding text-center transition-all duration-300 ${
    !file ? "min-h-screen flex flex-col items-center justify-center" : ""
  }`}
>
      <h2 className="text-section-title mb-8">Upload Question</h2>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-4 border-dashed border-gray-300 rounded-xl p-10 mb-6 bg-white hover:bg-gray-50 transition"
      >
        <p className="text-lg text-gray-600 mb-3">
          Drag and drop your math question file here
        </p>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block mx-auto"
        />
        {file && (
          <div className="mt-4">
            <p className="text-green-600 mb-2">Selected: {file.name}</p>
            {file.type.startsWith("image/") && (
              <img
                src={URL.createObjectURL(file)}
                alt="Preview"
                className="max-h-80 mx-auto rounded-lg shadow"
              />
            )}
          </div>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!file || loading}
        className={`px-6 py-3 rounded-lg font-semibold text-white transition ${
          file && !loading
            ? "bg-blue-600 hover:bg-blue-700"
            : "bg-gray-400 cursor-not-allowed"
        }`}
      >
        {loading ? "Solving..." : "Submit"}
      </button>

      {answer && (
        <div className="mt-8 p-6 bg-green-100 rounded-xl text-left max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold mb-2">Answer:</h3>
          <p className="text-gray-800 whitespace-pre-wrap">{answer}</p>
        </div>
      )}
    </section>
  );
};

export default UploadQuestion;
