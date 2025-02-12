"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";

const chunkIntervalInMilliseconds = 3000;

const Home: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  // Function to handle incoming recorded data
  const handleDataAvailable = useCallback(
    (event: BlobEvent) => {
      console.log("handleDataAvailable useCallback triggered", new Date(Date.now()).toLocaleString());
      if (event.data && event.data.size > 0) {
        // Create blob and download immediately
        const blob = new Blob([event.data], { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `recorded-video-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
      }
    },
    []
  );

  // Function to start recording
  const handleStartCaptureClick = useCallback(() => {
    console.log("handleStartCaptureClick useCallback triggered", new Date(Date.now()).toLocaleString());
    if (webcamRef.current && webcamRef.current.stream) {
      setRecording(true);
      const mediaRecorder = new MediaRecorder(webcamRef.current.stream, {
        mimeType: "video/webm",
      });
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.addEventListener("dataavailable", handleDataAvailable);
      mediaRecorder.start(chunkIntervalInMilliseconds);
    }
  }, [handleDataAvailable]);

  // Function to stop recording
  const handleStopCaptureClick = useCallback(() => {
    console.log("handleStopCaptureClick useCallback triggered", new Date(Date.now()).toLocaleString());
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }, []);

  // Video configuration settings
  const videoConstraints = {
    width: 500,
    height: 500,
    facingMode: "user",
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Video Recorder</h1>
      <Webcam
        audio={true}
        muted={true}
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
      </div>
    </div>
  );
};

export default Home;
