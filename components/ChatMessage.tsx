import React from 'react';
import { ChatMessage as ChatMessageType } from '../types';
import { BotIcon, UserIcon } from './Icons';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isModel = message.role === 'model';
  const text = message.parts.map(part => part.text).join('');

  return (
    <div className={`flex items-start gap-3 my-4 md:gap-4 ${isModel ? 'justify-start' : 'justify-end'}`}>
      {isModel && (
         <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-green-600">
           <BotIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
         </div>
      )}
      <div className={`p-3 md:p-4 rounded-xl max-w-lg lg:max-w-2xl xl:max-w-3xl ${isModel ? 'bg-gray-700' : 'bg-green-700'}`}>
        <p className="text-white whitespace-pre-wrap text-sm md:text-base">{text}</p>
      </div>
       {!isModel && (
         <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-gray-600">
           <UserIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
         </div>
      )}
    </div>
  );
};

export default ChatMessage;
