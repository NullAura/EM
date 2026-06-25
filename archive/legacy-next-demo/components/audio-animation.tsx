"use client"

import { motion } from "framer-motion"
import { Music2 } from "lucide-react"

export function AudioAnimation() {
  // Create an array of bars for the audio visualization
  const bars = Array.from({ length: 12 }).map((_, i) => ({
    height: 20 + Math.random() * 60,
    delay: i * 0.1,
  }))

  return (
    <div className="relative w-full h-full">
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          y: [0, -20, 0],
        }}
        transition={{
          duration: 4,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      >
        <div className="relative">
          <motion.div
            className="absolute -inset-4 bg-purple-500/20 rounded-full blur-xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          <div className="flex items-center justify-center flex-col">
            <Music2 className="w-24 h-24 text-purple-500 mb-4" />
            <div className="flex items-end space-x-1 h-16">
              {bars.map((bar, index) => (
                <motion.div
                  key={index}
                  className="w-2 bg-gradient-to-t from-purple-600 to-pink-500 rounded-t"
                  initial={{ height: 5 }}
                  animate={{ height: [5, bar.height, 5] }}
                  transition={{
                    duration: 1.5,
                    delay: bar.delay,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

