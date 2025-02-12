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
      if (event.data.size > 0) {
        setRecordedChunks((prev) => prev.concat(event.data));
      }
    },
    []
  );

  // Function to start recording
  const handleStartCaptureClick = useCallback(() => {
    console.log("handleStartCaptureClick useCallback triggered", new Date(Date.now()).toLocaleString());
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
  }, [handleDataAvailable]);

  // Function to stop recording
  const handleStopCaptureClick = useCallback(() => {
    console.log("handleStopCaptureClick useCallback triggered", new Date(Date.now()).toLocaleString());
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }, []);

  // Function to download video chunks
  const downloadChunks = useCallback(() => {
    console.log("downloadChunks useCallback triggered", new Date(Date.now()).toLocaleString());
    if (recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      document.body.appendChild(a);
      a.style.display = "none";
      a.href = url;
      a.download = `recorded-video-${Date.now()}.webm`;
      a.click();
      window.URL.revokeObjectURL(url);
      setRecordedChunks([]); // Clear chunks after download
    }
  }, [recordedChunks]);

  // Automatically download chunks every X seconds while recording
  useEffect(() => {
    console.log("useEffect triggered", new Date(Date.now()).toLocaleString());
    let interval: NodeJS.Timeout | null = null;
    if (recording) {
      interval = setInterval(() => {
        downloadChunks();
      }, chunkIntervalInMilliseconds); // Trigger every 5 seconds
    } else if (!recording && interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recording, downloadChunks]);

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
        {recordedChunks.length > 0 && !recording && (
          <button onClick={downloadChunks}>Download Remaining Chunks</button>
        )}
      </div>
    </div>
  );
};

export default Home;
