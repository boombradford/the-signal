import { useState, useRef, useCallback, useEffect } from 'react';

// Clean text for speech synthesis
function cleanTextForSpeech(text) {
  return text
    .replace(/[•\-*]/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/\n+/g, '. ')
    .trim();
}

// Text-to-speech hook using serverless TTS API with browser fallback
export function useTextToSpeech() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);
  const utteranceRef = useRef(null);

  // Serverless TTS via /api/tts
  const speakWithServerless = useCallback(async (text) => {
    if (!text) return;

    setIsLoading(true);

    try {
      const cleanText = cleanTextForSpeech(text);

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: cleanText })
      });

      if (!response.ok) {
        throw new Error('TTS API error');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create audio element
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsPlaying(true);
        setIsPaused(false);
        setIsLoading(false);
      };

      audio.onpause = () => {
        setIsPaused(true);
      };

      audio.onended = () => {
        setIsPlaying(false);
        setIsPaused(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setIsLoading(false);
      };

      await audio.play();
    } catch (error) {
      console.error('TTS error:', error);
      setIsLoading(false);
      // Fallback to browser TTS
      speakWithBrowser(text);
    }
  }, []);

  // Browser TTS fallback
  const speakWithBrowser = useCallback((text) => {
    if (!('speechSynthesis' in window) || !text) return;

    window.speechSynthesis.cancel();

    const cleanText = cleanTextForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v =>
      v.name.includes('Samantha') ||
      v.name.includes('Karen') ||
      v.name.includes('Daniel') ||
      v.lang.startsWith('en')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  const speak = useCallback((text) => {
    speakWithServerless(text);
  }, [speakWithServerless]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPaused(true);
    } else if ('speechSynthesis' in window && isPlaying) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isPlaying]);

  const resume = useCallback(() => {
    if (audioRef.current && isPaused) {
      audioRef.current.play();
      setIsPaused(false);
    } else if ('speechSynthesis' in window && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [isPaused]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return { speak, pause, resume, stop, isPlaying, isPaused, isLoading };
}

export default useTextToSpeech;
