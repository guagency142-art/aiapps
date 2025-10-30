export interface ChatMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}
