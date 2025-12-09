import { openai, checkOpenAIConfig } from '../../utils/openai-client';
import { getDatabase } from '../../config/database';
import { v4 as uuidv4 } from 'uuid';

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export class ChatService {
    async chatWithDocument(
        messages: ChatMessage[],
        documentContext: string,
        documentType: string,
        isGuest: boolean = false,
        userId?: string,
        documentId?: string
    ): Promise<string> {
        if (!checkOpenAIConfig()) {
            return "I'm sorry, but I can't connect to the AI service right now. Please check if the OpenAI API Key is configured.";
        }

        try {
            // 1. Save User Message (if not guest)
            if (!isGuest && userId && documentId) {
                const lastUserMessage = messages[messages.length - 1];
                if (lastUserMessage && lastUserMessage.role === 'user') {
                    await this.saveMessage(documentId, userId, 'user', lastUserMessage.content);
                }
            }

            const systemPrompt = `You are an intelligent research assistant helper. 
      You are helping a user working on a "${documentType}" document.
      
      Here is the content of the document they are working on:
      """
      ${documentContext}
      """
      
      Answer their questions based on this document.
      - Be concise and helpful.
      - If asked to summarize, use the provided content.
      - If asked to rewrite, maintain the professional tone suitable for a ${documentType}.
      - Do not hallucinate information not present in the document unless asked for general knowledge.
      ${isGuest ? '\nIMPORTANT: The user is a GUEST. Keep your response extremely brief (max 2-3 sentences). Do not offer deep analysis.' : ''}
      `;

            const response = await openai.chat.completions.create({
                model: 'gpt-5-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...messages
                ],
                temperature: 0.7,
                max_tokens: isGuest ? 150 : 500,
            });

            const assistantMessage = response.choices[0]?.message?.content || "I couldn't generate a response.";

            // 2. Save Assistant Message (if not guest)
            if (!isGuest && userId && documentId) {
                await this.saveMessage(documentId, userId, 'assistant', assistantMessage);
            }

            return assistantMessage;
        } catch (error) {
            console.error('Error in ChatService:', error);
            throw new Error('Failed to generate chat response.');
        }
    }

    async saveMessage(documentId: string, userId: string, role: 'user' | 'assistant', content: string) {
        try {
            const db = await getDatabase();
            await db.run(`
        INSERT INTO chat_messages (id, document_id, user_id, role, content)
        VALUES (?, ?, ?, ?, ?)
      `, [uuidv4(), documentId, userId, role, content]);
        } catch (error) {
            console.error('Failed to save chat message:', error);
            // Don't throw, just log. chat shouldn't fail if save fails
        }
    }

    async getChatHistory(documentId: string, userId: string): Promise<ChatMessage[]> {
        try {
            const db = await getDatabase();
            const rows = await db.all(`
        SELECT role, content 
        FROM chat_messages 
        WHERE document_id = ? AND user_id = ?
        ORDER BY created_at ASC
      `, [documentId, userId]);

            return rows.map(row => ({
                role: row.role as 'user' | 'assistant',
                content: row.content
            }));
        } catch (error) {
            console.error('Failed to get chat history:', error);
            return [];
        }
    }
}
