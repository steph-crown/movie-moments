"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Quote() {
  const [currentEmoji, setCurrentEmoji] = useState("🎬");
  const [showCat, setShowCat] = useState(false);
  const [paperclipHover, setPaperclipHover] = useState(false);

  const movieEmojis = ["🎬", "🍿", "🎭", "🎪", "🎨", "📽️", "🎞️"];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentEmoji((prev) => {
        const currentIndex = movieEmojis.indexOf(prev);
        return movieEmojis[(currentIndex + 1) % movieEmojis.length];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleQuoteClick = () => {
    setShowCat(!showCat);
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      // transition={{ duration: 0.6 }}
      className="relative max-w-[45rem] mx-auto bg-white border-[2.94px] border-[#000000] rounded-[10px] pt-8 pb-6 px-5 sm:px-7 cursor-pointer"
      style={{
        boxShadow: "5.88px 5.88px 0px #000",
      }}
      onClick={handleQuoteClick}
      whileHover={{
        boxShadow: "8px 8px 0px #000",
        y: -2,
      }}
      transition={{ duration: 0.2 }}
    >
      {/* Purple top bar with floating emoji */}
      <div className="absolute left-0 top-0 w-full h-[28px] bg-[#C9B8F9] rounded-t-[8px] border-b-[2.94px] border-black overflow-hidden">
        <motion.div
          key={currentEmoji}
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 10, opacity: 1 }}
          exit={{ x: 50, opacity: 0 }}
          className="absolute top-1 text-lg"
        >
          {currentEmoji}
        </motion.div>

        {/* Animated dots */}
        <div className="absolute right-4 top-2 flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 bg-purple-600 rounded-full"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Cat avatar - appears on click */}
      <AnimatePresence>
        {showCat && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            className="absolute -top-6 left-6 text-3xl"
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            😸
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Paperclip */}
      <motion.div
        className="absolute -top-3 right-6 cursor-pointer"
        onHoverStart={() => setPaperclipHover(true)}
        onHoverEnd={() => setPaperclipHover(false)}
        animate={{
          rotate: paperclipHover ? 15 : 0,
          scale: paperclipHover ? 1.1 : 1,
        }}
        whileTap={{ scale: 0.9, rotate: -15 }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <motion.path
            d="M17 7L7 17C5.89543 18.1046 4.10457 18.1046 3 17C1.89543 15.8954 1.89543 14.1046 3 13L13 3C14.1046 1.89543 15.8954 1.89543 17 3C18.1046 4.10457 18.1046 5.89543 17 7L7 17"
            stroke={paperclipHover ? "#6366f1" : "#7C6B9C"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Tooltip on hover */}
        <AnimatePresence>
          {paperclipHover && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -bottom-8 -left-8 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap"
            >
              Pin this story! 📌
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Content with subtle animations */}
      <div className="mt-2">
        <motion.h2
          className="font-bold text-md mb-4 flex items-center gap-2"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          THE INSPIRATION
        </motion.h2>

        {/* Animated paragraphs */}
        {[
          "You know that moment when something incredible happens in a movie and you just need to tell someone RIGHT NOW? It happens to me constantly. A plot twist that blows my mind 🤯, a detail I finally caught on my third watch, or just a scene that suddenly hits different.",
          "But here's what always bugged me. My friends watched it weeks ago. Or they're asleep. Or they haven't seen it yet. I'm sitting there with this amazing moment and nobody to share it with 😭.",
          "Last week I was watching this series and something clicked that connected back to episode 2. I literally paused the show and just stared at the screen 😳. I wanted so badly to text someone about it, but how do you explain which exact moment without spoiling everything?",
          "Then I thought about YouTube. You can drop a comment at any timestamp and people instantly know what you're talking about. Someone watching the same video months later sees your comment pop up at the perfect moment.",
          "Why don't we have something like that for movies and shows? 🤔",
          "So I stopped wishing and started building 😤. Now every time something amazing happens in a show, I don't have to keep it to myself. I can share it at the exact timestamp so my friends will discover it when they reach that same moment.",
        ].map((text, index) => (
          <motion.p
            key={index}
            className="font-medium text-sm sm:text-base mb-4 relative"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            whileHover={{ x: 5 }}
          >
            {text}
          </motion.p>
        ))}
      </div>

      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-12 left-8 text-6xl opacity-20">🎬</div>
        <div className="absolute bottom-12 right-8 text-4xl opacity-20">💬</div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-8xl opacity-10">
          ⏰
        </div>
      </div>
    </motion.div>
  );
}
