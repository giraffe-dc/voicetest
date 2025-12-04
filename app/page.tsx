'use client';

import { useEffect, useState } from 'react';
import { useAudioAnalyzer } from '@/app/hooks/useAudioAnalyzer';
import { useSocketAudio } from '@/app/hooks/useSocketAudio';
import { Equalizer } from '@/app/components/Equalizer';
import SocketInitializer from '@/app/components/SocketInitializer';

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showRemote, setShowRemote] = useState(false);

  const audioAnalyzer = useAudioAnalyzer();
  const socketAudio = useSocketAudio();

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Send audio data via socket
  useEffect(() => {
    if (isListening && socketAudio.isConnected) {
      socketAudio.sendAudioData(audioAnalyzer.frequencies);
    }
  }, [audioAnalyzer.frequencies, isListening, socketAudio]);

  const handleStartStop = async () => {
    if (!isListening) {
      await audioAnalyzer.startAudio();
      setIsListening(true);
    } else {
      audioAnalyzer.stopAudio();
      setIsListening(false);
    }
  };

  const displayFrequencies = showRemote
    ? socketAudio.remoteAudioData?.frequencies || Array(256).fill(0)
    : audioAnalyzer.frequencies;

  const formatLevel = (level: number) => Math.round(level);

  return (
    <>
      <SocketInitializer />
      <main className='min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 relative overflow-hidden'>
        {/* Animated background elements */}
        <div className='fixed inset-0 pointer-events-none'>
          <div className='absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob'></div>
          <div className='absolute top-1/2 right-1/4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000'></div>
          <div className='absolute bottom-0 left-1/2 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000'></div>
        </div>      {/* Content */}
      <div className='relative z-10 min-h-screen flex flex-col'>
        {/* Header (hidden on mobile) */}
        {!isMobile && (
          <header className='border-b border-purple-500/30 bg-slate-950/50 backdrop-blur-md'>
            <div className='max-w-7xl mx-auto px-4 py-6'>
              <div className='flex justify-between items-center'>
                <div>
                  <h1 className='text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent'>
                    Voice Signal
                  </h1>
                  <p className='text-purple-300/70 text-sm md:text-base mt-1'>
                    Real-time audio frequency analyzer
                  </p>
                </div>
                <div className='flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-purple-500/30'>
                  <div
                    className={`w-3 h-3 rounded-full transition-colors ${
                      socketAudio.isConnected
                        ? 'bg-green-500 animate-pulse'
                        : 'bg-red-500'
                    }`}
                  ></div>
                  <span className='text-xs md:text-sm text-gray-300'>
                    {socketAudio.isConnected ? 'Connected' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Main Content */}
        <div className='flex-1 flex flex-col items-center justify-center px-4 py-8 md:py-12'>
          {/* Primary Equalizer */}
          <div className='w-full max-w-2xl'>
            <div className='flex flex-col items-center gap-6'>
              {/* Title for current equalizer */}
              <div className='text-center'>
                <h2 className='text-xl md:text-2xl font-semibold text-white mb-2'>
                  {isListening ? (isMobile ? 'Vertical Equalizer' : 'Horizontal Equalizer') : 'Ready to listen'}
                </h2>
                {isListening && (
                  <p className='text-purple-300/70 text-sm'>
                    Level: <span className='text-purple-400 font-semibold'>{formatLevel(audioAnalyzer.level)}</span>
                  </p>
                )}
              </div>

              {/* Main Equalizer Container */}
              <div className='w-full flex justify-center'>
                <div className={`${isMobile ? 'w-full' : 'w-full'}`}>
                  <Equalizer
                    frequencies={displayFrequencies}
                    isVertical={isMobile}
                  />
                </div>
              </div>

              {/* Control Buttons */}
              <div className='flex flex-col sm:flex-row gap-4 w-full sm:w-auto'>
                <button
                  onClick={handleStartStop}
                  className={`flex-1 sm:flex-initial px-8 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 active:scale-95 ${
                    isListening
                      ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/50'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/50'
                  }`}
                >
                  {isListening ? '⏹ Stop' : '🎤 Start Listening'}
                </button>

                {socketAudio.remoteAudioData && (
                  <button
                    onClick={() => setShowRemote(!showRemote)}
                    className='flex-1 sm:flex-initial px-8 py-3 rounded-lg font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/50'
                  >
                    {showRemote ? '📱 My Audio' : '👥 Remote Audio'}
                  </button>
                )}

                <a
                  href='/room'
                  className='flex-1 sm:flex-initial px-8 py-3 rounded-lg font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-cyan-500/50 text-center'
                >
                  👥 Room Mode
                </a>
              </div>
            </div>
          </div>

          {/* Info Section */}
          {!isListening && (
            <div className='mt-12 max-w-2xl text-center'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='p-4 rounded-lg bg-slate-800/30 border border-purple-500/20 hover:border-purple-500/50 transition-colors'>
                  <div className='text-2xl mb-2'>🎵</div>
                  <h3 className='text-white font-semibold mb-1'>Real-time Analysis</h3>
                  <p className='text-purple-300/70 text-sm'>
                    Instant frequency spectrum visualization
                  </p>
                </div>
                <div className='p-4 rounded-lg bg-slate-800/30 border border-purple-500/20 hover:border-purple-500/50 transition-colors'>
                  <div className='text-2xl mb-2'>🌍</div>
                  <h3 className='text-white font-semibold mb-1'>Multi-Device Sync</h3>
                  <p className='text-purple-300/70 text-sm'>
                    Synchronized across all connected devices
                  </p>
                </div>
                <div className='p-4 rounded-lg bg-slate-800/30 border border-purple-500/20 hover:border-purple-500/50 transition-colors'>
                  <div className='text-2xl mb-2'>📊</div>
                  <h3 className='text-white font-semibold mb-1'>Adaptive Display</h3>
                  <p className='text-purple-300/70 text-sm'>
                    Mobile & desktop optimized layouts
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer (hidden on mobile) */}
        {!isMobile && (
          <footer className='border-t border-purple-500/30 bg-slate-950/50 backdrop-blur-md'>
            <div className='max-w-7xl mx-auto px-4 py-4 text-center text-purple-300/70 text-sm'>
              <p>
                {isMobile ? '📱 Mobile Mode' : '🖥️ Desktop Mode'} •{' '}
                {socketAudio.isConnected
                  ? `Connected as ${socketAudio.clientId.slice(0, 8)}`
                  : 'Connecting...'}
              </p>
            </div>
          </footer>
        )}
      </div>

      <style jsx>{`
        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </main>
    </>
  );
}
