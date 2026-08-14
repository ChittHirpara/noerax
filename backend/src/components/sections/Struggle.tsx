import { motion } from "motion/react";
import React from "react";

export function Struggle() {
  return (
    <section
      id="philosophy"
      className="py-20 px-5 sm:px-8 bg-white text-[#0f172a] font-sans relative overflow-hidden"
    >
      <div className="max-w-[1100px] mx-auto text-center relative z-10">
        
        {/* Header Block */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8 }}
          className="mb-[50px]"
        >
          {/* Badge */}
          <span className="inline-block text-[0.75rem] font-semibold uppercase tracking-[1px] mb-4 bg-gradient-to-r from-[#F5C344] via-[#F28482] to-[#B567C2] bg-clip-text text-transparent select-none">
            THE SKILL GAP
          </span>

          {/* Title */}
          <h2 className="text-[2.25rem] sm:text-[2.75rem] font-medium text-[#0f172a] tracking-[-0.02em] mb-3 leading-tight">
            The Missing Syllabus for <span className="font-serif italic text-purple-600">Life</span>
          </h2>

          {/* Subtitle */}
          <p className="text-[1rem] sm:text-[1.125rem] text-[#64748b] max-w-2xl mx-auto leading-[1.5]">
            Nobody teaches you how to make a hard decision, handle conflict, or know what you want.<br className="hidden sm:inline" />
            School gives you degrees, but no one handed you a syllabus for life.
          </p>
        </motion.div>

        {/* 3-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* ====================================================================
              CARD 1: You Carry It All Alone (Smart Prompt Suggestions)
             ==================================================================== */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="group relative h-[340px] rounded-[20px] overflow-hidden text-left flex flex-col justify-between shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] bg-[#F4F8F9]"
            style={{
              background: 'radial-gradient(circle at 50% 0%, #FFB347 0%, #F9ED96 30%, #F4F8F9 60%, #F4F8F9 100%)'
            }}
          >
            {/* Upper Visual Area */}
            <div className="relative w-full h-[260px]">
              {/* White Prompt Box */}
              <div className="absolute top-[30px] left-[24px] right-[24px] bg-white rounded-[12px] p-4 text-[0.8rem] text-[#475569] leading-[1.6] shadow-[0_8px_20px_rgba(0,0,0,0.04)]">
                <span>Why do I </span>
                <span className="font-semibold bg-gradient-to-r from-[#FFB347] to-[#E5A1F5] bg-clip-text text-transparent">
                  overthink every small decision
                </span>
                <span> when I go </span>
                <span className="font-semibold bg-gradient-to-r from-[#FFB347] to-[#E5A1F5] bg-clip-text text-transparent">
                  quiet by myself
                </span>
                <span>?</span>
              </div>

              {/* "Add clarity" Pill Button */}
              <div className="absolute top-[180px] left-[40px] bg-white border border-black px-[14px] py-[5px] rounded-[20px] text-[0.75rem] font-semibold text-[#1e293b] shadow-[0_4px_15px_rgba(0,0,0,0.08)] flex items-center gap-[6px] cursor-pointer">
                <span className="text-[#a855f7] text-[1rem]">✦</span>
                <span>Add clarity</span>
              </div>

              {/* Cursor SVG Arrow */}
              <div className="absolute top-[205px] left-[110px] z-10 drop-shadow-[0_4px_6px_rgba(0,0,0,0.2)] pointer-events-none">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#0f172a" stroke="#ffffff" strokeWidth="1">
                  <path d="M4 2L20 11L11 13L9 22L4 2Z" />
                </svg>
              </div>
            </div>

            {/* Bottom Card Title */}
            <h3 className="text-[1.05rem] font-semibold text-[#1e293b] p-6 z-10">
              You Carry It All Alone
            </h3>
          </motion.div>

          {/* ====================================================================
              CARD 2: You Second-Guess Everything (API / Network Access)
             ==================================================================== */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="group relative h-[340px] rounded-[20px] overflow-hidden text-left flex flex-col justify-between shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] bg-[#F4F8F9]"
            style={{
              background: 'radial-gradient(circle at 50% 0%, #E5A1F5 0%, #F8ACA0 30%, #F4F8F9 60%, #F4F8F9 100%)'
            }}
          >
            {/* Upper Visual Area */}
            <div className="absolute top-0 left-0 right-0 bottom-[70px] flex items-center justify-center px-6">
              <img
                src="https://pub-f170a2592d2c4a1485466404c36807be.r2.dev/viktor/network.svg"
                alt="Decision Network Access"
                className="w-full h-[180px] object-contain mt-5"
              />
            </div>

            {/* Bottom Card Title */}
            <h3 className="text-[1.05rem] font-semibold text-[#1e293b] p-6 z-10">
              You Second-Guess Everything
            </h3>
          </motion.div>

          {/* ====================================================================
              CARD 3: You Fear Choosing Wrong (Project Library)
             ==================================================================== */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="group relative h-[340px] rounded-[20px] overflow-hidden text-left flex flex-col justify-between shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] bg-[#F4F8F9]"
            style={{
              background: 'radial-gradient(circle at 50% 0%, #F9ED96 0%, #E5A1F5 30%, #F4F8F9 60%, #F4F8F9 100%)'
            }}
          >
            {/* Mesh Overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
                backgroundSize: '16px 16px',
                WebkitMaskImage: 'radial-gradient(circle at center top, black 0%, transparent 80%)',
                maskImage: 'radial-gradient(circle at center top, black 0%, transparent 80%)'
              }}
            />

            {/* Folder Image */}
            <img
              src="https://pub-f170a2592d2c4a1485466404c36807be.r2.dev/viktor/library%20icon.svg"
              alt="Project Library Folder"
              className="absolute top-[50px] left-1/2 -translate-x-1/2 w-[170px] drop-shadow-[0_15px_25px_rgba(0,0,0,0.08)]"
            />

            {/* Search Pill */}
            <div className="absolute top-[220px] left-1/2 -translate-x-1/2 bg-white border border-black px-[18px] py-[6px] rounded-[20px] text-[0.75rem] font-medium text-[#1e293b] shadow-[0_8px_20px_rgba(0,0,0,0.06)] whitespace-nowrap flex items-center gap-[8px]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>Search in library</span>
            </div>

            {/* Bottom Card Title */}
            <h3 className="text-[1.05rem] font-semibold text-[#1e293b] p-6 z-10">
              You Fear Choosing Wrong
            </h3>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
