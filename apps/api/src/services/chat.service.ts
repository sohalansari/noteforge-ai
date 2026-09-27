import { Types } from 'mongoose';
import { getAIProvider } from '../ai/providerFactory.js';
import { chatSystemPrompt, chatUserPrompt } from '../ai/prompts/chat.prompt.js';
import { DocumentChunkModel } from '../models/DocumentChunk.model.js';
import { DocumentModel } from '../models/Document.model.js';
import { ApiError } from '../utils/ApiError.js';

const MAX_CONTEXT_CHUNKS = 5;

export class ChatService {
    async askDocument(documentId: string, userId: string, question: string) {
        if (!Types.ObjectId.isValid(documentId)) {
            throw ApiError.badRequest('INVALID_ID', 'Invalid document id');
        }

        const document = await DocumentModel.findOne({
            _id: new Types.ObjectId(documentId),
            userId: new Types.ObjectId(userId),
            isDeleted: false,
        }).select('_id').lean();
        if (!document) throw ApiError.notFound('DOCUMENT_NOT_FOUND', 'Document not found');

        const searchTerms = question.match(/[\p{L}\p{N}]+/gu)?.join(' ');
        const chunks = searchTerms
            ? await DocumentChunkModel.find({
                documentId: document._id,
                userId: new Types.ObjectId(userId),
                $text: { $search: searchTerms },
            }, { score: { $meta: 'textScore' } })
                .sort({ score: { $meta: 'textScore' } } as any)
                .limit(MAX_CONTEXT_CHUNKS)
                .lean()
            : [];

        const contextBlocks = chunks.map((chunk) => {
            const location = chunk.pageStart
                ? `Page ${chunk.pageStart}${chunk.pageEnd && chunk.pageEnd !== chunk.pageStart ? `-${chunk.pageEnd}` : ''}`
                : chunk.slideStart
                    ? `Slide ${chunk.slideStart}${chunk.slideEnd && chunk.slideEnd !== chunk.slideStart ? `-${chunk.slideEnd}` : ''}`
                    : chunk.sectionTitle || `Section ${chunk.index + 1}`;
            return `[${location}]\n${chunk.text}`;
        });

        const answer = await getAIProvider().generateText({
            system: chatSystemPrompt(),
            user: chatUserPrompt(question, contextBlocks),
            maxTokens: 1000,
            temperature: 0.2,
        });

        return {
            answer,
            sources: chunks.map((chunk) => ({
                chunkIndex: chunk.index,
                pageStart: chunk.pageStart,
                pageEnd: chunk.pageEnd,
                slideStart: chunk.slideStart,
                slideEnd: chunk.slideEnd,
                sectionTitle: chunk.sectionTitle,
            })),
        };
    }
}

export const chatService = new ChatService();
