// Enable client-side rendering
"use client"

// Import necessary React hooks and FileSaver library
import { useState, useRef, useCallback, useEffect } from "react"
import FileSaver from "file-saver"

// Define the main VideoRecorder component
export default function VideoRecorder() {
  // State to track recording status
  const [isRecording, setIsRecording] = useState(false)
  // State to track number of video chunks saved
  const [chunkCount, setChunkCount] = useState(0)
  // Ref to store reference to video element
  const videoRef = useRef<HTMLVideoElement>(null)
  // Ref to store media stream
  const streamRef = useRef<MediaStream | null>(null)
  // Ref to store MediaRecorder instance
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  // Ref to store video chunks before saving
  const chunksRef = useRef<Blob[]>([])

  // Function to save recorded video chunks
  const saveChunk = useCallback(() => {
    // Skip if no chunks are available
    if (chunksRef.current.length === 0) return

    // Create a blob from collected chunks
    const blob = new Blob(chunksRef.current, { type: "video/webm" })
    // Save the blob as a webm file
    FileSaver.saveAs(blob, `video-chunk-${chunkCount + 1}.webm`)
    // Increment chunk counter
    setChunkCount((prev) => prev + 1)
    // Clear chunks array for next recording
    chunksRef.current = []
  }, [])

  // Function to start recording
  const startRecording = useCallback(async () => {
    try {
      // Request access to user's camera and microphone
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      // Store stream reference
      streamRef.current = stream
      // Set video element's source to stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      // Create new MediaRecorder instance with specified codec
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9,opus",
      })
      // Store MediaRecorder reference
      mediaRecorderRef.current = mediaRecorder
      // Initialize chunks array
      chunksRef.current = []

      // Handle data available event
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      // Save chunk when recording stops
      mediaRecorder.onstop = saveChunk

      // Start recording with 3-second intervals
      mediaRecorder.start(3000)
      setIsRecording(true)

      // Set up interval to save chunks every 3 seconds
      const interval = setInterval(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop()
          mediaRecorder.start(3000)
        }
      }, 3000)

      // Return cleanup function
      return () => {
        clearInterval(interval)
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop()
        }
      }
    } catch (error) {
      console.error("Error starting recording:", error)
    }
  }, [saveChunk])

  // Function to stop recording
  const stopRecording = useCallback(() => {
    // Stop MediaRecorder if it's recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
    }
    // Stop all tracks in the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }
    // Update recording state
    setIsRecording(false)
  }, [])

  // Effect to handle recording state changes
  useEffect(() => {
    let cleanup: (() => void) | undefined

    if (isRecording) {
      // Start recording and store cleanup function
      startRecording().then((cleanupFn) => {
        cleanup = cleanupFn
      })
    } else {
      // Stop recording when isRecording becomes false
      stopRecording()
    }

    // Cleanup function for useEffect
    return () => {
      if (cleanup) cleanup()
    }
  }, [isRecording, startRecording, stopRecording])

  // Render UI
  return (
    // Main container with flexbox layout
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      // White container with padding and shadow
      <div className="bg-white p-8 rounded-lg shadow-md">
        // Title
        <h1 className="text-2xl font-bold mb-4">Video Recorder</h1>
        // Video preview element
        <video ref={videoRef} className="w-full h-64 bg-black mb-4" autoPlay muted />
        // Button container
        <div className="flex justify-center space-x-4">
          {!isRecording ? (
            // Start recording button
            <button
              onClick={() => setIsRecording(true)}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Start Recording
            </button>
          ) : (
            // Stop recording button
            <button
              onClick={() => setIsRecording(false)}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Stop Recording
            </button>
          )}
        </div>
        // Recording status message
        {isRecording && <p className="mt-4 text-center">Recording... Chunks saved: {chunkCount}</p>}
      </div>
    </div>
  )
}

