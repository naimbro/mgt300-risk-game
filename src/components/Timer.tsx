import { useEffect, useState } from 'react';

interface TimerProps {
  endTime: Date;
  onExpire?: () => void;
}

export const Timer: React.FC<TimerProps> = ({ endTime, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = endTime.getTime() - Date.now();
      return Math.max(0, Math.floor(difference / 1000));
    };
    
    setTimeLeft(calculateTimeLeft());
    
    const interval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      if (newTimeLeft === 0 && onExpire) {
        onExpire();
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [endTime, onExpire]);
  
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isUrgent = timeLeft <= 30;
  
  return (
    <div className={`text-2xl font-bold ${isUrgent ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}>
      {minutes}:{seconds.toString().padStart(2, '0')}
    </div>
  );
};