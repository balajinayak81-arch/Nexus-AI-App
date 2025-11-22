import React, { useState, useRef } from 'react';
import { Mic, Play, Square, Volume2, AudioWaveform } from 'lucide-react';
import { generateSpeech } from '../services/geminiService';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const AudioMode: React.FC = () => {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState<'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr'>('Kore');
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // We need a persistent context but only init on user action usually.
  // For simplicity, we init context inside the service call or use a ref.
  const audioContextRef = useRef<AudioContext | null>(null);

  const handleGenerate = async () => {
    if (!text) return;
    setIsLoading(true);
    setAudioUrl(null);
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      }
      
      const buffer = await generateSpeech({ text, voiceName: voice }, audioContextRef.current);
      
      // Convert buffer to WAV blob for easy playback in <audio> tag
      const wavBlob = bufferToWave(buffer, buffer.length);
      const url = URL.createObjectURL(wavBlob);
      setAudioUrl(url);
    } catch (e) {
      console.error(e);
      alert("Failed to generate audio");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to convert AudioBuffer to WAV Blob for playback
  function bufferToWave(abuffer: AudioBuffer, len: number) {
    let numOfChan = abuffer.numberOfChannels,
        length = len * numOfChan * 2 + 44,
        buffer = new ArrayBuffer(length),
        view = new DataView(buffer),
        channels = [], i, sample,
        offset = 0,
        pos = 0;
  
    // write WAVE header
    setUint32(0x46464952);                         // "RIFF"
    setUint32(length - 8);                         // file length - 8
    setUint32(0x45564157);                         // "WAVE"
  
    setUint32(0x20746d66);                         // "fmt " chunk
    setUint32(16);                                 // length = 16
    setUint16(1);                                  // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2);                      // block-align
    setUint16(16);                                 // 16-bit (hardcoded in this example)
  
    setUint32(0x61746164);                         // "data" - chunk
    setUint32(length - pos - 4);                   // chunk length
  
    // write interleaved data
    for(i = 0; i < abuffer.numberOfChannels; i++)
      channels.push(abuffer.getChannelData(i));
  
    while(pos < len) {
      for(i = 0; i < numOfChan; i++) {             // interleave channels
        sample = Math.max(-1, Math.min(1, channels[i][pos])); // clamp
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0; // scale to 16-bit signed int
        view.setInt16(44 + offset, sample, true);          // write 16-bit sample
        offset += 2;
      }
      pos++;
    }
  
    return new Blob([buffer], {type: "audio/wav"});
  
    function setUint16(data: any) {
      view.setUint16(pos, data, true);
      pos += 2;
    }
  
    function setUint32(data: any) {
      view.setUint32(pos, data, true);
      pos += 4;
    }
  }

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden">
      <div className="w-full md:w-96 bg-gray-900/50 p-6 border-b md:border-b-0 md:border-r border-gray-800 overflow-y-auto flex-shrink-0">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Mic className="w-6 h-6 text-primary-500" />
          Speech Studio
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Script</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to speak..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white h-48 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Voice Personality</label>
            <div className="grid grid-cols-1 gap-2">
              {['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'].map((v) => (
                <button
                  key={v}
                  onClick={() => setVoice(v as any)}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                    voice === v
                      ? 'bg-primary-600/20 border-primary-500 text-white'
                      : 'bg-gray-800 border-transparent text-gray-400 hover:bg-gray-750'
                  }`}
                >
                  <span>{v}</span>
                  {voice === v && <div className="w-2 h-2 rounded-full bg-primary-500"></div>}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading || !text}
            className="w-full bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white font-semibold py-3 px-6 rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary-900/20"
          >
            {isLoading ? <LoadingSpinner message="" /> : <><Volume2 className="w-5 h-5" /> Generate Speech</>}
          </button>
        </div>
      </div>

      <div className="flex-1 bg-gray-950 flex items-center justify-center p-8">
        {isLoading ? (
          <LoadingSpinner message="Synthesizing voice..." />
        ) : audioUrl ? (
          <div className="text-center w-full max-w-md">
            <div className="w-32 h-32 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full mx-auto flex items-center justify-center mb-8 shadow-2xl shadow-primary-900/20 relative">
              <div className="absolute inset-0 rounded-full border-4 border-primary-500/20 animate-pulse-slow"></div>
              <Mic className="w-12 h-12 text-primary-500" />
            </div>
            
            <audio 
              ref={audioRef} 
              src={audioUrl} 
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              className="hidden" 
            />

            <div className="flex justify-center gap-4 mb-6">
               <button 
                 onClick={() => isPlaying ? audioRef.current?.pause() : audioRef.current?.play()}
                 className="w-16 h-16 rounded-full bg-primary-500 hover:bg-primary-400 flex items-center justify-center text-white transition-transform hover:scale-105 shadow-lg"
               >
                 {isPlaying ? <Square className="w-6 h-6 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
               </button>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <p className="text-gray-400 text-sm mb-1">Voice: <span className="text-primary-400 font-medium">{voice}</span></p>
              <p className="text-gray-500 text-xs truncate max-w-xs mx-auto">"{text}"</p>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-600">
            <AudioWaveform className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">AI Text-to-Speech</p>
            <p className="text-sm opacity-60">Convert your text into lifelike audio</p>
          </div>
        )}
      </div>
    </div>
  );
};