/**
 * AudioContext - Global audio playback state
 *
 * Enables audio to persist across page navigation.
 * - Manages audio element lifecycle
 * - Provides playback controls
 * - Exposes state for mini player
 */

import { createContext, useContext, useState, useRef, useCallback } from 'react';

const AudioContext = createContext(null);

export function AudioProvider({ children }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null); // { title, type }
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasAudio, setHasAudio] = useState(false);
  const audioRef = useRef(null);
  const progressInterval = useRef(null);

  const startProgressTracking = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    progressInterval.current = setInterval(() => {
      if (audioRef.current) {
        setProgress(audioRef.current.currentTime);
        setDuration(audioRef.current.duration || 0);
      }
    }, 250);
  }, []);

  const stopProgressTracking = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  }, []);

  const play = useCallback(async (text, trackInfo = { title: 'Audio', type: 'briefing' }) => {
    if (!audioRef.current) return;

    // Reset current audio
    audioRef.current.pause();
    setIsPlaying(false);
    
    setIsLoading(true);
    setCurrentTrack(trackInfo);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('TTS API Error:', errorData);
        throw new Error(errorData.error || 'Failed to generate audio');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      audioRef.current.src = audioUrl;
      setHasAudio(true);
      
      await audioRef.current.play();
    } catch (err) {
      console.error('Audio playback error:', err);
      alert(`Audio Error: ${err.message}`);
      setCurrentTrack(null);
      setHasAudio(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  }, [isPlaying]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTrack(null);
    setProgress(0);
    setHasAudio(false);
    stopProgressTracking();
  }, [stopProgressTracking]);

  const seek = useCallback((time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTrack(null);
    setProgress(0);
    setHasAudio(false);
    stopProgressTracking();
  }, [stopProgressTracking]);

  const handleError = useCallback((e) => {
    console.error('Audio element error:', e);
    setIsPlaying(false);
    setCurrentTrack(null);
    setHasAudio(false);
    stopProgressTracking();
  }, [stopProgressTracking]);

  const value = {
    isPlaying,
    isLoading,
    currentTrack,
    progress,
    duration,
    hasAudio,
    play,
    togglePlayPause,
    stop,
    seek,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        onPlay={() => {
          setIsPlaying(true);
          startProgressTracking();
        }}
        onPause={() => {
          setIsPlaying(false);
          stopProgressTracking();
        }}
        onEnded={handleEnded}
        onError={handleError}
        className="hidden"
      />
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
}

export default AudioContext;
