export function formatDocumentDates(doc: any) {
    return {
        ...doc,
        created_at: doc.created_at ? new Date(doc.created_at).toISOString() : null,
        updated_at: doc.updated_at ? new Date(doc.updated_at).toISOString() : null,
        last_accessed_at: doc.last_accessed_at ? new Date(doc.last_accessed_at).toISOString() : null,
        // Transform snake_case to camelCase for frontend
        createdAt: doc.created_at ? new Date(doc.created_at).toISOString() : null,
        updatedAt: doc.updated_at ? new Date(doc.updated_at).toISOString() : null,
        lastAccessedAt: doc.last_accessed_at ? new Date(doc.last_accessed_at).toISOString() : null,
        wordCount: doc.word_count,
        readingTime: doc.reading_time,
        linkedDocuments: doc.linked_documents,
        isFavorite: doc.is_favorite || false,
    };
}
