import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, Part } from '@google/genai';
import { ChatMessage as ChatMessageType } from './types';
import { fileToGenerativePart } from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import Spinner from './components/Spinner';
import { UploadIcon, SendIcon, PlantIcon, BotIcon } from './components/Icons';

interface WelcomeScreenProps {
  imagePreviewUrl: string | null;
  isLoading: boolean;
  error: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onIdentify: () => void;
  onSelectImageClick: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  imagePreviewUrl,
  isLoading,
  error,
  fileInputRef,
  onImageChange,
  onIdentify,
  onSelectImageClick,
}) => (
  <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-4 sm:p-8 bg-gray-800 rounded-2xl shadow-2xl transition-all duration-500">
    <PlantIcon className="w-20 h-20 sm:w-24 sm:h-24 text-green-400 mb-6" />
    <h1 className="text-3xl sm:text-4xl font-bold text-white text-center mb-2">AI Gardening Assistant</h1>
    <p className="text-gray-300 text-center mb-8">Upload a photo of your plant to get started!</p>
    <div className="w-full p-4 sm:p-6 border-2 border-dashed border-gray-600 rounded-lg text-center">
      {imagePreviewUrl ? (
        <div className="mb-4">
          <img src={imagePreviewUrl} alt="Plant preview" className="max-h-60 mx-auto rounded-lg shadow-lg" />
        </div>
      ) : (
        <div className="flex flex-col items-center text-gray-400 mb-4 py-8">
          <UploadIcon className="w-12 h-12 mb-2" />
          <p>Click below to select an image</p>
        </div>
      )}
      <input type="file" accept="image/*" onChange={onImageChange} className="hidden" ref={fileInputRef} />
      <div className="flex flex-col sm:flex-row justify-center items-center gap-2">
        <button
          onClick={onSelectImageClick}
          className="bg-gray-600 w-full sm:w-auto text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition-colors"
        >
          {imagePreviewUrl ? 'Change Image' : 'Select Image'}
        </button>
        {imagePreviewUrl && (
          <button
            onClick={onIdentify}
            disabled={isLoading}
            className="bg-green-600 w-full sm:w-auto text-white px-6 py-2 rounded-lg hover:bg-green-500 transition-colors disabled:bg-green-800 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? <Spinner /> : 'Identify Plant'}
          </button>
        )}
      </div>
    </div>
    {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
  </div>
);


interface ChatScreenProps {
  imagePreviewUrl: string | null;
  chatHistory: ChatMessageType[];
  isLoading: boolean;
  isModelResponding: boolean;
  error: string | null;
  currentMessage: string;
  onStartOver: () => void;
  onSendMessage: (e: React.FormEvent) => void;
  onCurrentMessageChange: (value: string) => void;
  onSetError: (error: string | null) => void;
  chatContainerRef: React.RefObject<HTMLDivElement>;
}

const ChatScreen: React.FC<ChatScreenProps> = ({
  imagePreviewUrl,
  chatHistory,
  isLoading,
  isModelResponding,
  error,
  currentMessage,
  onStartOver,
  onSendMessage,
  onCurrentMessageChange,
  onSetError,
  chatContainerRef
}) => (
  <div className="w-full h-full max-w-4xl flex flex-col bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
    <header className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-700">
      <div className="flex items-center gap-3">
        {imagePreviewUrl && <img src={imagePreviewUrl} alt="Identified Plant" className="w-12 h-12 rounded-full object-cover" />}
        <h2 className="text-xl font-semibold text-white">Plant Care Chat</h2>
      </div>
      <button onClick={onStartOver} className="text-sm bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
        Start Over
      </button>
    </header>

    <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6">
      <div className="flex flex-col">
        {chatHistory.map((msg, index) => <ChatMessage key={index} message={msg} />)}
        {isModelResponding && (
          <div className="flex items-start gap-3 my-4">
            <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-green-600">
              <BotIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="p-4 rounded-lg bg-gray-700">
              <Spinner />
            </div>
          </div>
        )}
      </div>
    </main>

    <footer className="p-4 bg-gray-900 border-t border-gray-700">
      {error && <p className="text-red-400 text-center pb-2">{error}</p>}
      <form onSubmit={onSendMessage} className="flex items-center gap-3">
        <input
          type="text"
          value={currentMessage}
          onChange={(e) => {
            onCurrentMessageChange(e.target.value);
            if (error) onSetError(null);
          }}
          placeholder="Ask a follow-up question..."
          className="flex-1 bg-gray-700 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !currentMessage.trim()} className="bg-green-600 text-white p-3 rounded-lg hover:bg-green-500 transition-colors disabled:bg-green-800 disabled:cursor-not-allowed">
          <SendIcon className="w-6 h-6" />
        </button>
      </form>
    </footer>
  </div>
);

const App: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isChatStarted, setIsChatStarted] = useState<boolean>(false);

  const geminiChat = useRef<Chat | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setUploadedImage(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleIdentifyPlant = async () => {
    if (!uploadedImage) {
      setError('Please upload an image first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setChatHistory([]);
    setIsChatStarted(true);

    try {
      const ai = new GoogleGenAI(process.env.API_KEY as string);
      geminiChat.current = ai.chats.create({ model: 'gemini-2.5-flash' });

      const promptParts: Part[] = [
        await fileToGenerativePart(uploadedImage),
        { text: 'You are an expert botanist. Identify this plant and provide detailed care instructions. Include information on watering, sunlight, soil, temperature, humidity, and potential pests. Format the response clearly using markdown for headings and lists.' },
      ];

      const result = await geminiChat.current.sendMessage(promptParts);

      const firstBotMessage: ChatMessageType = {
        role: 'model',
        parts: [{ text: result.text }],
      };
      setChatHistory([firstBotMessage]);

    } catch (e) {
      console.error(e);
      setError('Failed to analyze the image. The API key might be invalid or the service is unavailable. Please try again.');
      setIsChatStarted(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || isLoading || !geminiChat.current) return;

    const userMessage: ChatMessageType = {
      role: 'user',
      parts: [{ text: currentMessage }],
    };

    setChatHistory(prev => [...prev, userMessage]);
    const messageToSend = currentMessage;
    setCurrentMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const result = await geminiChat.current.sendMessage(messageToSend);
      const botMessage: ChatMessageType = {
        role: 'model',
        parts: [{ text: result.text }],
      };
      setChatHistory(prev => [...prev, botMessage]);
    } catch (e) {
      console.error(e);
      setError('An error occurred. Please try sending your message again.');
      setChatHistory(prev => prev.slice(0, -1)); // Remove the user's message if API call fails
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOver = () => {
    setUploadedImage(null);
    setImagePreviewUrl(null);
    setChatHistory([]);
    setIsLoading(false);
    setCurrentMessage('');
    setError(null);
    setIsChatStarted(false);
    geminiChat.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isModelResponding = isLoading && chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'user';

  return (
    <div className="bg-gray-900 min-h-screen w-full flex flex-col items-center justify-center p-2 sm:p-4 font-sans text-white">
      <div className="w-full h-[95vh] sm:h-[90vh] flex items-center justify-center">
        {isChatStarted ? (
          <ChatScreen
            imagePreviewUrl={imagePreviewUrl}
            chatHistory={chatHistory}
            isLoading={isLoading}
            isModelResponding={isModelResponding}
            error={error}
            currentMessage={currentMessage}
            onStartOver={handleStartOver}
            onSendMessage={handleSendMessage}
            onCurrentMessageChange={setCurrentMessage}
            onSetError={setError}
            chatContainerRef={chatContainerRef}
          />
        ) : (
          <WelcomeScreen
            imagePreviewUrl={imagePreviewUrl}
            isLoading={isLoading}
            error={error}
            fileInputRef={fileInputRef}
            onImageChange={handleImageChange}
            onIdentify={handleIdentifyPlant}
            onSelectImageClick={() => fileInputRef.current?.click()}
          />
        )}
      </div>
    </div>
  );
};

export default App;
