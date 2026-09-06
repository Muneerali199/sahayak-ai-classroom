"use client";

import * as React from "react";

// Standalone demo-video page, designed to be embedded via iframe:
//   <iframe src="https://<deployed-url>/demo" width="600" height="400"
//           allow="autoplay; fullscreen" allowfullscreen></iframe>
// Autoplays muted (browser policy), with controls + loop.
export default function DemoPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 gap-4">
      <video
        className="w-full max-w-5xl aspect-video rounded-2xl border border-purple-400/20 shadow-2xl shadow-purple-500/20"
        src="/videos/sahayak-demo.mp4"
        controls
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      <p className="text-sm text-purple-200/60 text-center">
        Sahayak Live — the AI co-teacher that sits next to you in class
      </p>
    </div>
  );
}
