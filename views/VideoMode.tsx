import React, { useState } from 'react';
import { Video, Upload, Film, AlertTriangle, Play } from 'lucide-react';
import { generateVideo } from '../services/geminiService';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const VideoMode: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [startImage, setStartImage] = useState<{data: string, mimeType: string} | undefined>(undefined);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        setStartImage({
          data: base64Data,
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const checkAndSelectKey = async () => {
    try {
      const win = window as any;
      if (win.aistudio && win.aistudio.hasSelectedApiKey) {
        const hasKey = await win.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await win.aistudio.openSelectKey();
          // Race condition mitigation: assume success immediately after dialog returns/closes
        }
        return true;
      }
      // Fallback if not in expected environment, proceed with env key
      return true;
    } catch (e) {
      console.warn("Key selection error", e);
      return false;
    }
  };

  const handleGenerate = async () => {
    if (!prompt && !startImage) return;

    setError(null);
    setGeneratedVideoUrl(null);
    
    const keyReady = await checkAndSelectKey();
    if (!keyReady) {
      setError("API Key selection failed. Please try again.");
      return;
    }

    setIsLoading(true);
    setStatusMessage("Initializing Veo model...");

    try {
      // Simulate stages for UX since polling can take time
      const progressTimer = setInterval(() => {
        setStatusMessage(prev => {
           if(prev.includes("Initializing")) return "Dreaming up scenes...";
           if(prev.includes("Dreaming")) return "Rendering frames...";
           if(prev.includes("Rendering")) return "Polishing pixels...";
           return prev;
        });
      }, 15000);

      const videoUrl = await generateVideo({
        prompt,
        resolution,
        aspectRatio,
        image: startImage
      });

      clearInterval(progressTimer);
      setGeneratedVideoUrl(videoUrl);
    } catch (err: any) {
      setError(err.message || "Video generation failed.");
      if (err.message?.includes("Requested entity was not found")) {
        setError("API Key error. Please try selecting your key again.");
        // Trigger re-selection on next attempt
      }
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden">
      <div className="w-full md:w-96 bg-gray-900/50 p-6 border-b md:border-b-0 md:border-r border-gray-800 overflow-y-auto flex-shrink-0">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Video className="w-6 h-6 text-primary-500" />
          Video Creator (Veo)
        </h2>

        <div className="bg-blue-900/20 border border-blue-800 p-4 rounded-xl mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-200">
              <p className="font-bold mb-1">Billing Required</p>
              <p>Veo generation requires a paid project API key. You will be prompted to select one.</p>
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-white mt-1 block">View Billing Docs</a>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A cinematic shot of a cyberpunk city..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white h-24 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Resolution</label>
              <select 
                value={resolution} 
                onChange={(e) => setResolution(e.target.value as any)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm focus:border-primary-500 outline-none"
              >
                <option value="720p">720p (Standard)</option>
                <option value="1080p">1080p (HD)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Aspect Ratio</label>
              <select 
                value={aspectRatio} 
                onChange={(e) => setAspectRatio(e.target.value as any)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm focus:border-primary-500 outline-none"
              >
                <option value="16:9">16:9 (Landscape)</option>
                <option value="9:16">9:16 (Portrait)</option>
              </select>
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-400 mb-2">
              Start Image (Optional)
            </label>
             <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="video-image-upload"
              />
              <label
                htmlFor="video-image-upload"
                className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-700 rounded-xl cursor-pointer hover:border-primary-500 hover:bg-gray-800/50 transition-colors"
              >
                {startImage ? (
                   <div className="flex items-center gap-2 text-primary-400">
                     <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                     <span className="text-sm font-medium">Image Selected</span>
                   </div>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-gray-500 mb-1" />
                    <span className="text-xs text-gray-500">Upload start frame</span>
                  </>
                )}
              </label>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading || (!prompt && !startImage)}
            className="w-full bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white font-semibold py-3 px-6 rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary-900/20"
          >
             {isLoading ? <LoadingSpinner message="" /> : <><Film className="w-5 h-5" /> Generate Video</>}
          </button>
        </div>
      </div>

      <div className="flex-1 bg-gray-950 flex items-center justify-center p-8 relative">
        {isLoading ? (
           <LoadingSpinner message={statusMessage} />
        ) : error ? (
          <div className="text-center max-w-md p-6 bg-red-900/20 border border-red-800 rounded-xl">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-400 mb-2">Error</h3>
            <p className="text-red-300/80">{error}</p>
          </div>
        ) : generatedVideoUrl ? (
          <div className="w-full max-w-4xl">
            <div className="bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800">
              <video 
                controls 
                autoPlay 
                loop 
                className="w-full h-auto max-h-[80vh]"
                src={generatedVideoUrl}
              >
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="mt-4 flex justify-center">
               <a 
                 href={generatedVideoUrl} 
                 download={`veo-gen-${Date.now()}.mp4`}
                 className="text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-2"
               >
                 <Upload className="w-4 h-4 rotate-180" /> Download Video
               </a>
            </div>
          </div>
        ) : (
           <div className="text-center text-gray-600">
            <Film className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">AI Video Production</p>
            <p className="text-sm opacity-60">Generate cinematic clips with Veo</p>
          </div>
        )}
      </div>
    </div>
  );
};