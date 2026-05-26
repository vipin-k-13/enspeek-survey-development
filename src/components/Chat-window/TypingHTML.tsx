import {
  useEffect,
  useState,
} from "react";

interface Props {
  html: string;
  speed?: number;
  onComplete?: () => void;
}

const TypingHTML = ({
  html,
  speed = 20,
  onComplete
}: Props) => {
  const [content, setContent] =
    useState("");

  useEffect(() => {
    let index = 0;

    setContent("");

    const interval = setInterval(() => {
      setContent(html.slice(0, index));

      index++;

      if (index > html.length - 1) {
        clearInterval(interval);

        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [html, speed]);

  return (
    <div
      dangerouslySetInnerHTML={{
        __html: content,
      }}
    />
  );
};

export default TypingHTML;