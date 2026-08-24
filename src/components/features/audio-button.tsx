"use client";

import { useState } from "react";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { speakJapanese } from "@/lib/tts";
import { cn } from "@/lib/utils";

interface AudioButtonProps {
  text: string;
  className?: string;
  size?: "sm" | "default" | "icon";
}

export function AudioButton({ text, className, size = "icon" }: AudioButtonProps) {
  const [playing, setPlaying] = useState(false);

  function handlePlay() {
    speakJapanese(text);
    setPlaying(true);
    window.setTimeout(() => setPlaying(false), 700);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={handlePlay}
      aria-label={`Play pronunciation of ${text}`}
      className={cn(playing && "text-accent border-accent", className)}
    >
      <Volume2 />
    </Button>
  );
}
