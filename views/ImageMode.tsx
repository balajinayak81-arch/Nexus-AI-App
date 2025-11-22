import React, { useState } from 'react';
import { Image as ImageIcon, Upload, Wand2, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { generateImage } from '../services/geminiService';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const ImageMode: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '3:4' | '4:3' | '16:9' | '9:16'>('1:1');
  const [baseImage, setBaseImage] = useState<{data: string, mimeType: string} | undefined>(undefined);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove header data:image/xyz;base64,
        const base64Data = base64String.split(',')[1];
        setBaseImage({
          data: base64Data,
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const result = await generateImage({
        prompt,
        aspectRatio,
        baseImage
      });
      setGeneratedImage(result);
    } catch (err: any) {
      setError(err.message || "Failed to generate image");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden">
      {/* Controls Panel */}
      <div className="w-full md:w-96 bg-gray-900/50 p-6 border-b md:border-b-0 md:border-r border-gray-800 overflow-y-auto flex-shrink-0">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-primary-500" />
          Image Studio
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to create..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white h-32 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Aspect Ratio</label>
            <div className="grid grid-cols-3 gap-2">
              {['1:1', '3:4', '4:3', '16:9', '9:16'].map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio as any)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    aspectRatio === ratio
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Reference / Edit Image (Optional)
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-700 rounded-xl cursor-pointer hover:border-primary-500 hover:bg-gray-800/50 transition-colors"
              >
                {baseImage ? (
                  <img 
                    src={`data:${baseImage.mimeType};base64,${baseImage.data}`} 
                    alt="Preview" 
                    className="h-full w-full object-contain rounded-lg"
                  />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-gray-500 mb-2" />
                    <span className="text-xs text-gray-500">Click to upload</span>
                  </>
                )}
              </label>
              {baseImage && (
                <button 
                  onClick={() => setBaseImage(undefined)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt}
            className="w-full bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white font-semibold py-3 px-6 rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary-900/20"
          >
            {isLoading ? <LoadingSpinner message="" /> : <><Wand2 className="w-5 h-5" /> Generate</>}
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 bg-gray-950 flex items-center justify-center p-8 relative">
        {isLoading ? (
          <LoadingSpinner message="Designing your masterpiece..." />
        ) : error ? (
          <div className="text-center max-w-md p-6 bg-red-900/20 border border-red-800 rounded-xl">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-400 mb-2">Generation Failed</h3>
            <p className="text-red-300/80">{error}</p>
          </div>
        ) : generatedImage ? (
          <div className="relative group max-w-full max-h-full">
            <img
              src={generatedImage}
              alt="Generated"
              className="max-w-full max-h-[80vh] rounded-lg shadow-2xl shadow-black"
            />
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <a
                href={generatedImage}
                download={`omnigen-${Date.now()}.png`}
                className="bg-black/70 backdrop-blur-sm text-white p-2 rounded-lg hover:bg-black transition-colors"
              >
                <Download className="w-5 h-5" />
              </a>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-600">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">Ready to create</p>
            <p className="text-sm opacity-60">Configure your settings and click Generate</p>
          </div>
        )}
      </div>
    </div>
  );
};