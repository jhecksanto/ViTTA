import React from 'react';
import { ChatView } from './System/ChatView';

export const SupportChat: React.FC<{ user: any }> = ({ user }) => {
  return <ChatView user={user} />;
};

export default SupportChat;
