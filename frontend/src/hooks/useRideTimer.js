import { useState } from "react";

export default function useRideTimer() {
  const [rideTimer, setRideTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);

  const startTimer = () => {
    setRideTimer(0);
    const interval = setInterval(() => {
      setRideTimer(prev => prev + 1);
    }, 1000);
    setTimerInterval(interval);
  };

  const stopTimer = () => {
    if (timerInterval) clearInterval(timerInterval);
    setTimerInterval(null);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  return { rideTimer, startTimer, stopTimer, formatTime };
}
