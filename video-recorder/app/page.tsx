"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import FileSaver from "file-saver"

export default function VideoRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [chunkCount, setChunkCount] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const lastSaveTimeRef = useRef<number>(0)

  const saveChunk = useCallback(() => {
    const now = Date.now()
    if (now - lastSaveTimeRef.current < 2900) return // Prevent saving too frequently

    if (chunksRef.current.length > 0) {
      const blob = new Blob(chunksRef.current, { type: "video/webm" })
      FileSaver.saveAs(blob, `video-chunk-${chunkCount + 1}.webm`)
      setChunkCount((prev) => prev + 1)
      chunksRef.current = []
      lastSaveTimeRef.current = now
    }
  }, [chunkCount])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9,opus" })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.start(3000) // Collect data every 3 seconds
      setIsRecording(true)
      lastSaveTimeRef.current = Date.now()

      // Set up interval to save chunks every 3 seconds
      const interval = setInterval(saveChunk, 3000)

      return () => clearInterval(interval)
    } catch (error) {
      console.error("Error starting recording:", error)
    }
  }, [saveChunk])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }
    saveChunk() // Save any remaining data
    setIsRecording(false)
    setChunkCount(0)
  }, [saveChunk])

  useEffect(() => {
    let cleanup: (() => void) | undefined

    if (isRecording) {
      startRecording().then((cleanupFn) => {
        cleanup = cleanupFn
      })
    } else {
      stopRecording()
    }

    return () => {
      if (cleanup) cleanup()
    }
  }, [isRecording, startRecording, stopRecording])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Video Recorder</h1>
        <video ref={videoRef} className="w-full h-64 bg-black mb-4" autoPlay muted />
        <div className="flex justify-center space-x-4">
          {!isRecording ? (
            <button
              onClick={() => setIsRecording(true)}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Start Recording
            </button>
          ) : (
            <button
              onClick={() => setIsRecording(false)}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Stop Recording
            </button>
          )}
        </div>
        {isRecording && <p className="mt-4 text-center">Recording... Chunks saved: {chunkCount}</p>}
      </div>
    </div>
  )
}

