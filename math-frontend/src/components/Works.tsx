"use client";

import { useState } from "react";
import { CSSProperties } from "react";

interface FuzzyMatch {
  gpt_line: string;
  matched_ocr_line: string;
  bounds: [[number, number], [number, number], [number, number], [number, number]];
}

interface ApiResponse {
  answer: string;
  fuzzy_matches?: FuzzyMatch[];
}

const UploadQuestion = () => {
  const [file, setFile] = useState<File | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [markingScheme, setMarkingScheme] = useState("");
  const [fuzzyMatches, setFuzzyMatches] = useState<FuzzyMatch[]>([]);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFuzzyMatches([]); 
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
  };


    const handleSubmit = async () => {
    if (!file && !markingScheme.trim()) return;
    
    setLoading(true);
    setAnswer(null);
    setFuzzyMatches([]);
    
    const formData = new FormData();
    
    if (file) {
      formData.append("file", file);
    }
    
    if (markingScheme.trim()) {
      formData.append("marking_scheme", markingScheme); 
    }

    try {
      const res = await fetch("http://localhost:8000/solve/", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to solve question.");
      const data: ApiResponse = await res.json();
      setAnswer(data.answer || "No answer returned.");
      if (data.fuzzy_matches) {
        setFuzzyMatches(data.fuzzy_matches);
      }
    } catch (error) {
      console.error(error);
      setAnswer("There was an error solving the question.");
    } finally {
      setLoading(false);
    }
  };

const getHighlightStyle = (bounds: FuzzyMatch['bounds']): CSSProperties => {
  if (!imageSize) return {};
  
  const [topLeft, topRight, bottomRight, bottomLeft] = bounds;
  
  if (!topLeft || !topRight || !bottomRight || !bottomLeft) return {};

  const left = (topLeft[0] / imageSize.width) * 100;
  const top = (topLeft[1] / imageSize.height) * 100;
  const width = ((topRight[0] - topLeft[0]) / imageSize.width) * 100 + 3;
  const height = ((bottomLeft[1] - topLeft[1]) / imageSize.height) * 100;

  return {
    position: 'absolute',
    left: `${left}%`,
    top: `${top}%`,
    width: `${width}%`,
    height: `${height}%`,
    border: '2px solid rgba(146, 255, 106, 0.7)',
    pointerEvents: 'none' as const,
  };
};

  return (
    <section
      className={`py-20 container-padding text-center transition-all duration-300 ${
        !file && !markingScheme ? "min-h-screen flex flex-col items-center justify-center" : ""
      }`}
    >
      <h2 className="text-section-title mb-8">Upload Student Work</h2>

      <div className="max-w-3xl mx-auto space-y-8">
        {/* Marking Scheme Section - Now at the top */}
        <div className="border-2 border-gray-200 rounded-xl p-6 bg-white shadow-sm">
          <h3 className="text-lg font-semibold mb-3">Marking Scheme</h3>
          <textarea
            value={markingScheme}
            onChange={(e) => setMarkingScheme(e.target.value)}
            placeholder="Paste the marking scheme or rubric here..."
            className="w-full h-40 p-3 border border-gray-300 rounded-lg mb-2"
          />
          <p className="text-sm text-gray-500">
            Provide the method mark equations and answer marks.
          </p>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-4 border-dashed border-gray-300 rounded-xl p-6 bg-white hover:bg-gray-50 transition"
        >
          <h3 className="text-lg font-semibold mb-3">Student Work Submission</h3>
          <p className="text-gray-600 mb-3">
            Drag and drop student's answer file here or click to browse
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block mx-auto mb-3"
          />
          {file && (
            <div className="mt-4 relative">
              <p className="text-green-600 mb-2">Selected: {file.name}</p>
              {file.type.startsWith("image/") && (
                <div className="relative inline-block">
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Student work preview"
                    className="max-h-80 mx-auto rounded-lg shadow"
                    onLoad={handleImageLoad}
                  />
                  {fuzzyMatches.length > 0 && imageSize && (
                    <div className="absolute inset-0">
                      {fuzzyMatches.map((match, index) => (
                        <div 
                          key={index}
                          style={getHighlightStyle(match.bounds)}
                          title={`Matched: ${match.matched_ocr_line}\nGPT: ${match.gpt_line}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={(!file && !markingScheme.trim()) || loading}
        className={`px-6 py-3 rounded-lg font-semibold text-white transition mt-6 ${
          (file || markingScheme.trim()) && !loading
            ? "bg-blue-600 hover:bg-blue-700"
            : "bg-gray-400 cursor-not-allowed"
        }`}
      >
        {loading ? "Grading..." : "Grade Submission"}
      </button>

      {answer && (
        <div className="mt-8 p-6 bg-green-100 rounded-xl text-left max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold mb-2">Grading Result:</h3>
          <p className="text-gray-800 whitespace-pre-wrap">{answer}</p>
          {fuzzyMatches.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Matched Equations:</h4>
              <ul className="list-disc pl-5">
                {fuzzyMatches.map((match, index) => (
                  <li key={index} className="mb-1">
                    <span className="font-medium">Student Answer: </span>{match.matched_ocr_line} <br />
                    <span className="font-medium">Expected Answer: </span>{match.gpt_line}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
export default UploadQuestion;