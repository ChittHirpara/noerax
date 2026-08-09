import { useEffect, useRef, useState, useCallback } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";

interface ScrambleTextProps {
  text: string;
  className?: string;
  trigger?: "hover" | "mount" | "inView";
  delay?: number;
  speed?: number;
  as?: any;
}

export function ScrambleText({
  text,
  className = "",
  trigger = "hover",
  delay = 0,
  speed = 40,
  as: Tag = "span",
}: ScrambleTextProps) {
  const [displayed, setDisplayed] = useState(trigger === "mount" || trigger === "inView" ? "" : text);
  const animRef = useRef<number | null>(null);
  const elRef = useRef<HTMLElement | null>(null);

  const scramble = useCallback(() => {
    let iteration = 0;
    const totalFrames = text.length * 3;

    if (animRef.current) cancelAnimationFrame(animRef.current);

    const step = () => {
      setDisplayed(
        text
          .split("")
          .map((char, i) => {
            if (char === " ") return " ";
            if (i < iteration / 3) return text[i];
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join("")
      );

      if (iteration < totalFrames) {
        iteration++;
        animRef.current = requestAnimationFrame(step);
      } else {
        setDisplayed(text);
      }
    };

    setTimeout(() => requestAnimationFrame(step), delay);
  }, [text, delay]);

  // Mount trigger
  useEffect(() => {
    if (trigger === "mount") {
      scramble();
    }
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [trigger, scramble]);

  // InView trigger
  useEffect(() => {
    if (trigger !== "inView" || !elRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          scramble();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(elRef.current);
    return () => observer.disconnect();
  }, [trigger, scramble]);

  const props =
    trigger === "hover"
      ? { onMouseEnter: scramble }
      : {};

  return (
    <Tag
      ref={elRef}
      className={`inline-block select-none font-mono tracking-tight ${className}`}
      {...props}
    >
      {displayed || "\u00A0"}
    </Tag>
  );
}
