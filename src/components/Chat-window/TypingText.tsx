import { useEffect, useState } from "react";

interface TypingTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

const TypingText = ({ text, speed = 30, onComplete }: TypingTextProps) => {
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    let index = 0;

    setDisplayText("");

    const interval = setInterval(() => {
      setDisplayText((prev) => prev + text[index]);

      index++;

      if (index >= text.length - 1) {
        clearInterval(interval);
         onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return <span>{displayText}</span>;
};

export default TypingText;
