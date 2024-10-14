"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Home() {
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const promptInputRef = useRef(null);

  useEffect(() => {
    promptInputRef.current.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: e.target.prompt.value }),
    });
    let prediction = await response.json();
    if (response.status !== 201) {
      setError(prediction.detail);
      return;
    }
    setPrediction(prediction);

    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed"
    ) {
      await sleep(1000);
      const response = await fetch(`/api/predictions/${prediction.id}`);
      prediction = await response.json();
      if (response.status !== 200) {
        setError(prediction.detail);
        return;
      }
      console.log({ prediction });
      setPrediction(prediction);
    }
  };

  return (
    <div className="m-4">
      {" "}
      <form className="w-full flex font-mono" onSubmit={handleSubmit}>
        {" "}
        <input
          type="text"
          className="flex-grow"
          name="prompt"
          placeholder="Describe ur Braid"
          ref={promptInputRef}
        />{" "}
        <button className="text-sm" type="submit">
          {" "}
          GENERATE{" "}
        </button>{" "}
      </form>
      {error && <div>{error}</div>}
      {prediction && (
        <p className="py-3 text-sm opacity-50">status: {prediction.status}</p>
      )}
      {prediction && (
        <>
          {prediction.output && (
            <div className="image-wrapper">
              {prediction.output.map((imgSrc, index) => (
                <Image
                  key={index}
                  src={imgSrc}
                  alt={`output-${index}`}
                  height={400}
                  width={400}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
