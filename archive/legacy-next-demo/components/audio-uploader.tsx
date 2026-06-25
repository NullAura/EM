"use client"

import type React from "react"

import { useState } from "react"
import { Upload, AlertCircle } from "lucide-react"

interface AudioUploaderProps {
  onUploadStart: () => void
  onProcessed: (audioUrl: string) => void
}

export function AudioUploader({ onUploadStart, onProcessed }: AudioUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file: File) => {
    // Check if file is audio
    if (!file.type.startsWith("audio/")) {
      setError("Please upload an audio file")
      return
    }

    setError(null)
    onUploadStart()

    // Simulate processing with a delay
    setTimeout(() => {
      processAudio(file)
    }, 2000)
  }

  const processAudio = async (file: File) => {
    try {
      // In a real app, you would upload the file to your API
      // For this demo, we'll simulate by creating an object URL
      const formData = new FormData()
      formData.append("audio", file)

      // Simulate API call
      // In a real app: const response = await fetch("/api/process-audio", { method: "POST", body: formData })

      // For demo, we'll just return the original file with a simulated delay
      setTimeout(() => {
        const processedAudioUrl = URL.createObjectURL(file)
        onProcessed(processedAudioUrl)
      }, 3000)
    } catch (err) {
      console.error("Error processing audio:", err)
      setError("Error processing audio. Please try again.")
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          dragActive ? "border-purple-500 bg-purple-500/10" : "border-gray-600"
        } transition-colors`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input type="file" id="audio-upload" className="hidden" accept="audio/*" onChange={handleChange} />
        <label htmlFor="audio-upload" className="flex flex-col items-center justify-center cursor-pointer">
          <Upload className="w-12 h-12 text-purple-500 mb-2" />
          <p className="text-white text-lg mb-1">Drag and drop your audio file here</p>
          <p className="text-gray-400 text-sm">or click to browse</p>
          <p className="text-gray-500 text-xs mt-2">Supports MP3, WAV, OGG, FLAC</p>
        </label>
      </div>

      {error && (
        <div className="mt-4 text-red-500 flex items-center justify-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

