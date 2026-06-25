"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Upload, Sparkles } from "lucide-react"
import { AudioWaves } from "@/components/audio-waves"
import { AudioAnimation } from "@/components/audio-animation"
import { useState } from "react"
import { AudioUploader } from "@/components/audio-uploader"
import { AudioPlayer } from "@/components/audio-player"

export default function Hero() {
  const [processedAudio, setProcessedAudio] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleAudioProcessed = (audioUrl: string) => {
    setProcessedAudio(audioUrl)
    setIsProcessing(false)
  }

  return (
    <div className="relative min-h-[calc(100vh-76px)] flex items-center">
      {/* Floating audio waves background */}
      <div className="absolute inset-0 overflow-hidden">
        <AudioWaves count={6} />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
              Make Your Audio
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                {" "}
                Unlearnable
              </span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-gray-400 text-xl mb-8 max-w-2xl mx-auto"
          >
            Upload your audio files and our AI will add protective noise patterns that make them resistant to AI
            training while remaining clear to human ears.
          </motion.p>

          {!processedAudio ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col items-center justify-center gap-6"
            >
              <AudioUploader onUploadStart={() => setIsProcessing(true)} onProcessed={handleAudioProcessed} />

              {isProcessing && (
                <div className="text-purple-400 animate-pulse mt-4">
                  Processing your audio... Adding unlearnable patterns...
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8">
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Audio
                </Button>
                <Button size="lg" variant="outline" className="text-white border-purple-500 hover:bg-purple-500/20">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Hear Examples
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/5 backdrop-blur-md p-6 rounded-xl border border-purple-500/20"
            >
              <h3 className="text-xl text-white mb-4">Your Protected Audio</h3>
              <AudioPlayer audioUrl={processedAudio} />
              <p className="text-gray-400 mt-4 text-sm">
                Your audio now contains unlearnable patterns that help protect it from AI training models.
              </p>
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  className="text-white border-purple-500 hover:bg-purple-500/20"
                  onClick={() => setProcessedAudio(null)}
                >
                  Process Another File
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Animated audio visualization */}
      <div className="absolute bottom-0 right-0 w-96 h-96">
        <AudioAnimation />
      </div>
    </div>
  )
}

