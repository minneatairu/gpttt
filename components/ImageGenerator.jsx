"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function ImageGenerator() {
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const promptInputRef = useRef(null);

  useEffect(() => {
    if (promptInputRef.current) {
      promptInputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const prompt = promptInputRef.current?.value || "";
    const response = await fetch("/api/predictionsecond", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
      }),
    });

    let prediction = await response.json();
    if (response.status !== 201) {
      setError(prediction.detail || "An error occurred");
      setLoading(false);
      return;
    }
    setPrediction(prediction);

    // Polling the status of the prediction
    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed"
    ) {
      await sleep(1000);
      const statusResponse = await fetch(
        `/api/predictionsecond/${prediction.id}`
      );
      prediction = await statusResponse.json();
      if (statusResponse.status !== 200) {
        setError(prediction.detail || "An error occurred");
        setLoading(false);
        return;
      }
      setPrediction(prediction);
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <form className="image-submit" onSubmit={handleSubmit}>
        <input
          type="text"
          className="gpt-input"
          name="prompt"
          placeholder="✿ Type your description ✿"
          ref={promptInputRef}
          disabled={loading}
        />
        <button className="genebtt expanded" type="submit" disabled={loading}>
          {loading ? "Generating..." : "GENERATE"}
        </button>
      </form>

      {error && <div className="text-red-500 mt-3">{error}</div>}

      {loading && (
        <p className="loading-img">
          Hol&apos; up. Da braidr is generating ur braid.
        </p>
      )}

      {prediction && (
        <>
          {prediction.output && (
            <div className="image-wrapper">
              <Image
                fill
                src={prediction.output[prediction.output.length - 1]}
                alt="output"
              />
            </div>
          )}
          <p className="py-3 text-sm opacity-50">status: {prediction.status}</p>
        </>
      )}
    </div>
  );
}
