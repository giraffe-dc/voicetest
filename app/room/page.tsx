 'use client';

import { useState, useEffect } from 'react';
import SocketInitializer from '@/app/components/SocketInitializer';
import { RoomMode } from '@/app/components/RoomMode';

export default function RoomPage() {
  const [roomId] = useState<string | undefined>(undefined);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      <SocketInitializer />
      <main className='min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 relative overflow-hidden'>
        {/* Animated background elements */}
        <div className='fixed inset-0 pointer-events-none'>
          <div className='absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob'></div>
          <div className='absolute top-1/2 right-1/4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000'></div>
          <div className='absolute bottom-0 left-1/2 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000'></div>
        </div>

        {/* Content */}
        <div className='relative z-10 min-h-screen flex flex-col'>
          {/* Header (hidden on mobile) */}
          {!isMobile && (
            <header className='border-b border-purple-500/30 bg-slate-950/50 backdrop-blur-md'>
              <div className='max-w-7xl mx-auto px-4 py-6'>
                <div className='flex justify-between items-center gap-4'>
                  <div>
                    <h1 className='text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent'>
                      Voice Signal - Room Mode
                    </h1>
                    <p className='text-purple-300/70 text-sm md:text-base mt-1'>
                      Multi-user synchronized audio analyzer
                    </p>
                  </div>
                  <a
                    href='/'
                    className='px-4 py-2 rounded-lg bg-slate-800/50 border border-purple-500/30 text-white hover:border-purple-500/50 transition-colors text-sm'
                  >
                    ← Back to Main
                  </a>
                </div>
              </div>
            </header>
          )}

          {/* Main Content */}
          <div className='flex-1 flex flex-col items-center justify-center px-4 py-8 md:py-12'>
            <RoomMode defaultRoomId={roomId} />
          </div>

          {/* Footer (hidden on mobile) */}
          {!isMobile && (
            <footer className='border-t border-purple-500/30 bg-slate-950/50 backdrop-blur-md'>
              <div className='max-w-7xl mx-auto px-4 py-4 text-center text-purple-300/70 text-sm'>
                <p>
                  👥 Share your room ID with others to synchronize audio visualization
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
