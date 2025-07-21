import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const IntroVideo = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleEnded = () => {
      navigate('/welcome', { replace: true });
    };
    video.addEventListener('ended', handleEnded);
    return () => {
      video.removeEventListener('ended', handleEnded);
    };
  }, [navigate]);

  return (
    <div className="flex items-center justify-center bg-white">
      <video
        ref={videoRef}
        src="/Intro.mp4"
        autoPlay
        muted
        playsInline
        controls={false}
        className="w-full h-full max-h-dvh object-contain"
        style={{ objectFit: 'contain' }}
      />
    </div>
  );
};

export default IntroVideo; 