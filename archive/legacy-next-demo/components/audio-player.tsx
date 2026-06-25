"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

interface AudioPlayerProps {
  audioUrl: string
}

export function AudioPlayer({ audioUrl }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const setAudioData = () => {
      setDuration(audio.duration)
    }

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime)
    }

    // Events
    audio.addEventListener("loadeddata", setAudioData)
    audio.addEventListener("timeupdate", setAudioTime)
    audio.addEventListener("ended", () => setIsPlaying(false))

    // Cleanup
    return () => {
      audio.removeEventListener("loadeddata", setAudioData)
      audio.removeEventListener("timeupdate", setAudioTime)
      audio.removeEventListener("ended", () => setIsPlaying(false))
    }
  }, [])

  // Animation for the progress bar
  useEffect(() => {
    if (isPlaying) {
      audioRef.current!.play()
      animationRef.current = requestAnimationFrame(whilePlaying)
    } else {
      audioRef.current!.pause()
      cancelAnimationFrame(animationRef.current!)
    }
  }, [isPlaying])

  const whilePlaying = () => {
    setCurrentTime(audioRef.current!.currentTime)
    animationRef.current = requestAnimationFrame(whilePlaying)
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    audioRef.current!.muted = !isMuted
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    audioRef.current!.volume = newVolume
    if (newVolume === 0) {
      setIsMuted(true)
    } else if (isMuted) {
      setIsMuted(false)
    }
  }

  const handleTimeChange = (value: number[]) => {
    const newTime = value[0]
    setCurrentTime(newTime)
    audioRef.current!.currentTime = newTime
  }

  // Format time in MM:SS
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  // Visualizer bars
  const bars = Array.from({ length: 20 }).map(() => Math.random() * 100)

  return (
    <div className="bg-black/30 rounded-lg p-4 backdrop-blur-sm">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Waveform visualization */}
      <div className="flex items-end h-16 mb-4 space-x-1 overflow-hidden">
        {bars.map((height, index) => (
          <div
            key={index}
            className={`w-2 rounded-t ${
              (index / bars.length) * duration <= currentTime ? "bg-purple-500" : "bg-gray-600"
            }`}
            style={{
              height: `${height}%`,
              transition: "height 0.2s ease",
            }}
          />
        ))}
      </div>

      <div className="flex items-center mb-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:text-purple-400 hover:bg-purple-500/20"
          onClick={togglePlayPause}
        >
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
        </Button>

        <div className="flex-1 mx-4">
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={0.01}
            onValueChange={handleTimeChange}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:text-purple-400 hover:bg-purple-500/20"
            onClick={toggleMute}
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
          <div className="w-20">
            <Slider
              value={[isMuted ? 0 : volume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" size="sm" className="text-white border-purple-500/50 hover:bg-purple-500/20">
          Download Protected Audio
        </Button>
        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
          View Details
        </Button>
      </div>
    </div>
  )
}

