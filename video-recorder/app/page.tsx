"use client";

import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";

const Home: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  // Start recording
  const handleStartCaptureClick = useCallback(() => {
    if (webcamRef.current && webcamRef.current.stream) {
      setRecording(true);
      mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, {
        mimeType: "video/webm",
      });
      mediaRecorderRef.current.addEventListener(
        "dataavailable",
        handleDataAvailable
      );
      mediaRecorderRef.current.start();
    }
  }, []);

  // Save recorded data chunks
  const handleDataAvailable = useCallback(
    (event: BlobEvent) => {
      if (event.data.size > 0) {
        setRecordedChunks((prev) => prev.concat(event.data));
      }
    },
    []
  );

  // Stop recording
  const handleStopCaptureClick = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }, []);

  // Download the recorded video
  const handleDownload = useCallback(() => {
    if (recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      document.body.appendChild(a);
      a.style.display = "none";
      a.href = url;
      a.download = "recorded-video.webm";
      a.click();
      window.URL.revokeObjectURL(url);
      setRecordedChunks([]);
    }
  }, [recordedChunks]);

  const videoConstraints = {
    width: 500,
    height: 500,
    facingMode: "user",
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Video Recorder</h1>
      <Webcam
        audio={false}
        ref={webcamRef}
        videoConstraints={videoConstraints}
        style={{ marginBottom: "20px" }}
      />
      <div>
        {recording ? (
          <button onClick={handleStopCaptureClick}>Stop Recording</button>
        ) : (
          <button onClick={handleStartCaptureClick}>Start Recording</button>
        )}
        {recordedChunks.length > 0 && (
          <button onClick={handleDownload}>Download Video</button>
        )}
      </div>
    </div>
  );
};

export default Home;
