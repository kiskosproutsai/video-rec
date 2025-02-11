"use client"; // Marks this as a client-side component in Next.js

// Importing necessary React hooks and webcam component
import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";

// Main component definition with TypeScript FC (FunctionComponent) type
const Home: React.FC = () => {
  // Reference to store the webcam instance
  const webcamRef = useRef<Webcam>(null);
  // Reference to store the media recorder instance
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  // State to track if recording is active
  const [recording, setRecording] = useState(false);
  // State to store video chunks
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  // Function to start recording
  // useCallback, which is a React hook that memoizes (caches) the function. 
  // This means the function reference stays the same between renders unless its dependencies change. 
  // The empty array [] means it has no dependencies and will never need to be recreated.
  const handleStartCaptureClick = useCallback(() => {
    if (webcamRef.current && webcamRef.current.stream) { // Check if webcam is available // If the webcam isn't initialized yet, webcamRef.current would be null.
      setRecording(true); // Set recording state to true
      // Check for supported MIME types with audio
      const mimeType = 'video/webm;codecs=vp9,opus';

      mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, {
        mimeType: mimeType,
      });
      // Add event listener for when data is available
      mediaRecorderRef.current.addEventListener(
        "dataavailable",
        handleDataAvailable
      );
      mediaRecorderRef.current.start(); // Start recording
    }
  }, []);

  // Function to handle incoming recorded data
  const handleDataAvailable = useCallback(
    (event: BlobEvent) => {
      if (event.data.size > 0) { // If there's data
        setRecordedChunks((prev) => prev.concat(event.data)); // Add it to our chunks array
      }
    },
    []
  );

  // Function to stop recording
  const handleStopCaptureClick = useCallback(() => {
    if (mediaRecorderRef.current) { // If we have an active recorder
      mediaRecorderRef.current.stop(); // Stop recording
      setRecording(false); // Update recording state
    }
  }, []);

  // Function to download the recorded video
  const handleDownload = useCallback(() => {
    // This creates a memoized version of the function that only changes when recordedChunks changes
    // useCallback is used for performance optimization

    if (recordedChunks.length > 0) {
      // Check if we have any recorded video data to process

      const blob = new Blob(recordedChunks, { type: "video/webm" });
      // Creates a new Blob object from the array of recorded chunks
      // A Blob represents raw data, in this case video data in webm format

      const url = URL.createObjectURL(blob);
      // Creates a temporary URL that points to the blob
      // This URL can be used to reference the video data in the browser

      const a = document.createElement("a");
      // Creates a new <a> (anchor) element programmatically

      document.body.appendChild(a);
      // Adds the anchor element to the document body

      a.style.display = "none";
      // Hides the anchor element from view (we don't need to see it)

      a.href = url;
      // Sets the href (URL) of the anchor to point to our blob URL

      a.download = "recorded-video.webm";
      // Sets the filename for the download
      // When clicked, it will save with this name

      a.click();
      // Programmatically clicks the hidden anchor element
      // This triggers the browser's download behavior

      window.URL.revokeObjectURL(url);
      // Cleans up by releasing the blob URL from memory
      // This is important to prevent memory leaks

      setRecordedChunks([]);
      // Resets the recordedChunks array to empty
      // This clears the stored video data after download
    }
  }, [recordedChunks]);
  // The dependency array contains recordedChunks because the function
  // needs to be recreated if recordedChunks changes

  // Video configuration settings
  const videoConstraints = {
    width: 500,
    height: 500,
    facingMode: "user", // Use front-facing camera
  };

  // Render component
  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Video Recorder</h1>
      <Webcam
        audio={true} // Disable audio
        muted={true} // Mute real-time audio playback
        ref={webcamRef} // Attach webcam reference
        videoConstraints={videoConstraints}
        style={{ marginBottom: "20px" }}
      />
      <div>
        {recording ? ( // Conditional rendering based on recording state
          <button onClick={handleStopCaptureClick}>Stop Recording</button>
        ) : (
          <button onClick={handleStartCaptureClick}>Start Recording</button>
        )}
        {recordedChunks.length > 0 && ( // Show download button only if we have recorded data
          <button onClick={handleDownload}>Download Video</button>
        )}
      </div>
    </div>
  );
};

export default Home;