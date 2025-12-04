'use client';

import React, { useState, useEffect } from 'react';
import { useAudioAnalyzer } from '@/app/hooks/useAudioAnalyzer';
import { useRoomSocket } from '@/app/hooks/useRoomSocket';
import { Equalizer } from '@/app/components/Equalizer';

interface RoomModeProps {
  defaultRoomId?: string;
}

export const RoomMode: React.FC<RoomModeProps> = ({ defaultRoomId = '1' }) => {
  const [roomInput, setRoomInput] = useState(defaultRoomId || '');
  const [showRoom, setShowRoom] = useState(!!defaultRoomId);
  const [isMobile, setIsMobile] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const audioAnalyzer = useAudioAnalyzer();
  const roomSocket = useRoomSocket(defaultRoomId);

  // Detect insecure context (mobile over http) for guidance
  const [isInsecureContext, setIsInsecureContext] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const insecure = !window.isSecureContext && hostname !== 'localhost' && hostname !== '127.0.0.1';
      setIsInsecureContext(insecure);
    }
  }, []);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // On mobile, request microphone permission and auto-start listening
  useEffect(() => {
    if (!isMobile) return;

    // Only trigger permission request once
    if (audioAnalyzer.permissionState !== 'unknown') return;

    const requestPermission = async () => {
      await audioAnalyzer.startAudio();
      // After startAudio, permissionState will be updated in state
    };

    requestPermission();
  }, [isMobile, audioAnalyzer, audioAnalyzer.permissionState]);

  // Auto-start listening when permission is granted (mobile only)
  useEffect(() => {
    if (!isMobile || isListening) return;
    if (audioAnalyzer.permissionState === 'granted') {
      setIsListening(true);
    }
  }, [isMobile, audioAnalyzer.permissionState, isListening]);

  // Debug: log simple stats so we can verify audio reaches the equalizer (only on mobile)
  useEffect(() => {
    if (!isMobile) return;
    const freqs = audioAnalyzer.frequencies || [];
    if (!freqs.length) return;
    const avg = Math.round(freqs.reduce((a, b) => a + b, 0) / freqs.length);
    const peak = Math.max(...freqs);
    if (peak > 10) { // Only log when there's significant audio
      console.debug('[RoomMode] audio -> avg:', avg, 'peak:', peak);
    }
  }, [audioAnalyzer.frequencies, isMobile]);

  // Send audio data via socket
  useEffect(() => {
    if (isListening && roomSocket.isConnected && roomSocket.currentRoom) {
      roomSocket.sendAudioData(audioAnalyzer.frequencies);
    }
  }, [audioAnalyzer.frequencies, isListening, roomSocket]);

  const handleStartStop = async () => {
    if (!isListening) {
      await audioAnalyzer.startAudio();
      setIsListening(true);
    } else {
      audioAnalyzer.stopAudio();
      setIsListening(false);
    }
  };

  const handleJoinRoom = () => {
    if (roomInput.trim()) {
      roomSocket.joinRoom(roomInput.trim());
      setShowRoom(true);
    }
  };

  const getDisplayFrequencies = () => {
    if (selectedUserId) {
      const userData = roomSocket.connectedUsers.get(selectedUserId);
      return userData?.frequencies || Array(256).fill(0);
    }
    return audioAnalyzer.frequencies;
  };

  const connectedUsersList = Array.from(roomSocket.connectedUsers.entries()).map(
    ([id, data]) => ({
      id,
      ...data,
    })
  );

  // Auto-select a remote user when not listening locally
  useEffect(() => {
    if (!isListening && !selectedUserId && connectedUsersList.length > 0) {
      const remote = connectedUsersList.find((u) => u.id == roomSocket.clientId);
      if (remote) {
        setSelectedUserId(remote.id);
      }
    }
  }, [connectedUsersList, isListening, selectedUserId, roomSocket.clientId]);

  // On mobile, render only the equalizer
  if (isMobile) {
    return (
      <div className='w-full h-screen flex flex-col items-center justify-center px-4'>
        {/* Permission / HTTPS guidance banner for mobile */}
        {(audioAnalyzer.permissionState === 'denied' || isInsecureContext) && (
          <div className='absolute top-4 left-4 right-4 p-3 rounded-lg bg-amber-900 text-amber-100 border border-amber-700 text-sm z-10'>
            <p className='font-semibold'>Проблеми з мікрофоном</p>
            {audioAnalyzer.permissionState === 'denied' ? (
              <p className='mt-1'>Дозвольте доступ до мікрофона в налаштуваннях браузера.</p>
            ) : (
              <p className='mt-1'>Спробуйте відкрити сайт через HTTPS (ngrok).</p>
            )}
          </div>
        )}

        {/* Loading indicator while waiting for permission */}
        {audioAnalyzer.permissionState === 'prompt' && (
          <div className='absolute top-4 left-4 right-4 p-3 rounded-lg bg-blue-900 text-blue-100 border border-blue-700 text-sm z-10'>
            <p className='font-semibold'>⏳ Чекаємо на надання дозволу до мікрофона...</p>
          </div>
        )}

        {/* Title (minimal) */}
        <div className='absolute top-16 left-4 right-4 text-center'>
          <h3 className='text-sm font-semibold text-white/70'>
            {selectedUserId
              ? `${selectedUserId === roomSocket.clientId ? 'Your' : 'Remote'} Audio`
              : 'Your Audio'}
          </h3>
        </div>

        {/* Large Equalizer - takes up most of the screen */}
        <div className='w-full h-4/5 flex flex-col items-center justify-center px-2'>
          <Equalizer
            frequencies={getDisplayFrequencies()}
            isVertical={true}
            isMobile={true}
          />
        </div>

        {/* Status info - bottom */}
        <div className='absolute bottom-4 left-4 right-4 text-center text-purple-300/70 text-xs'>
          <p>🎤 {roomSocket.currentRoom || '1'} • {roomSocket.connectedUsers.size} users</p>
          <p className='mt-1'>{isListening ? '✅ Активне' : audioAnalyzer.permissionState === 'denied' ? '❌ Заблоковано' : audioAnalyzer.permissionState === 'prompt' ? '⏳ Очікування' : '⏹ Готово'}</p>
        </div>
      </div>
    );
  }

  // Desktop view
  return (
    <div className='w-full max-w-4xl mx-auto px-4'>
      {/* Permission / HTTPS guidance banner */}
      {(audioAnalyzer.permissionState === 'denied' || (isMobile && isInsecureContext)) && (
        <div className='mb-6 p-4 rounded-lg bg-amber-900 text-amber-100 border border-amber-700'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <p className='font-semibold'>Проблеми з мікрофоном або HTTP</p>
              {audioAnalyzer.permissionState === 'denied' ? (
                <p className='text-sm mt-1'>
                  Браузер заблокував доступ до мікрофона. Перевірте налаштування сайту у браузері та дозвольте використання мікрофона.
                </p>
              ) : (
                <p className='text-sm mt-1'>
                  Ваш пристрій підключено по HTTP. Багато мобільних браузерів вимагають HTTPS для доступу до мікрофона.
                </p>
              )}
              <p className='text-sm mt-2'>Рекомендації:</p>
              <ul className='text-sm list-disc ml-5 mt-1'>
                <li>Використайте ngrok для HTTPS: <code className='bg-slate-800 px-1 rounded'>npx ngrok http 3000</code></li>
                <li>Або запустіть сервер локально з доступом за `localhost` або через HTTPS.</li>
              </ul>
            </div>
            <div className='flex flex-col items-end gap-2'>
              <button
                onClick={async () => {
                  const cmd = 'npx ngrok http 3000';
                  try {
                    await navigator.clipboard.writeText(cmd);
                    // small visual confirmation could be added, but keep minimal
                    console.debug('[RoomMode] ngrok command copied');
                  } catch (e) {
                    console.warn('Clipboard not available', e);
                  }
                }}
                className='px-3 py-1 rounded bg-amber-700 hover:bg-amber-600 text-amber-50 text-sm'
              >
                Скопіювати команду
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Room Join Section */}
      {!showRoom && !defaultRoomId ? (
        <div className='flex flex-col items-center gap-6 py-12'>
          <div className='text-center'>
            <h2 className='text-2xl md:text-3xl font-semibold text-white mb-2'>
              Join a Room
            </h2>
            <p className='text-purple-300/70'>
              Connect with others to synchronize audio visualization
            </p>
          </div>

          <div className='w-full max-w-md flex flex-col gap-4'>
            <input
              type='text'
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
              placeholder='Enter room ID (e.g., office-1, party-2024)'
              className='px-6 py-3 rounded-lg bg-slate-800/50 border border-purple-500/30 text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-500 transition-colors'
            />
            <button
              onClick={handleJoinRoom}
              disabled={!roomInput.trim()}
              className='px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Join Room
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Room Header */}
          <div className='mb-4'>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <h2 className='text-lg font-semibold text-white'>
                  Room: <span className='text-purple-400'>{roomSocket.currentRoom || '1'}</span>
                </h2>
                <p className='text-purple-300/70 text-xs'>
                  {connectedUsersList.length} user(s) connected
                </p>
              </div>
              {defaultRoomId !== '1' && (
                <button
                  onClick={() => {
                    setShowRoom(false);
                    setRoomInput('');
                    setSelectedUserId('');
                  }}
                  className='px-3 py-1 text-sm rounded-lg bg-slate-800/50 border border-purple-500/30 text-white hover:border-purple-500/50 transition-colors'
                >
                  Change Room
                </button>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className='flex flex-col gap-8 items-center'>
            {/* Main Equalizer */}
            <div className='w-[85%] flex flex-col items-center gap-3'>
              <div className='text-center'>
                <h3 className='text-lg font-semibold text-white mb-1'>
                  {selectedUserId
                    ? `${selectedUserId === roomSocket.clientId ? 'Your' : 'Remote'} Audio`
                    : 'Your Audio'}
                </h3>
                {isListening && selectedUserId === roomSocket.clientId && (
                  <p className='text-purple-300/70 text-xs'>
                    Level:{' '}
                    <span className='text-purple-400 font-semibold'>
                      {Math.round(audioAnalyzer.level)}
                    </span>
                  </p>
                )}
              </div>

              <div className='w-full'>
                <Equalizer
                  frequencies={getDisplayFrequencies()}
                  isVertical={isMobile}
                  isMobile={false}
                />
              </div>

              <button
                onClick={handleStartStop}
                className={`px-6 py-2 text-sm rounded-lg font-semibold transition-all transform hover:scale-105 active:scale-95 ${
                  isListening
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/50'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/50'
                }`}
              >
                {isListening ? '⏹ Stop' : '🎤 Start'}
              </button>
            </div>

            {/* Connected Users List */}
            {connectedUsersList.length > 0 && (
              <div className='w-[85%] flex flex-col gap-2'>
                <h3 className='text-sm font-semibold text-white'>Connected Users</h3>
                <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
                  {connectedUsersList.map((user) => (
                    <button
                      key={user.id}
                      onClick={() =>
                        setSelectedUserId(selectedUserId === user.id ? '' : user.id)
                      }
                      className={`p-2 rounded-lg transition-all text-center text-xs ${
                        selectedUserId === user.id
                          ? 'bg-purple-600/50 border border-purple-400'
                          : 'bg-slate-800/30 border border-purple-500/20 hover:border-purple-500/50'
                      }`}
                    >
                      <div>
                        <p className='text-white font-semibold'>
                          {user.id === roomSocket.clientId ? 'You' : 'User'}{' '}
                          {user.id.slice(0, 4)}
                        </p>
                        <p className='text-purple-300/70'>
                          {user.deviceType === 'mobile' ? '📱' : '🖥️'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
