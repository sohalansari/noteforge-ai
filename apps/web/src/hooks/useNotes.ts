import { useQuery } from '@tanstack/react-query';
import { notesApi } from '../api/notes.api';

export function useNotes(documentId: string | undefined) {
    return useQuery({
        queryKey: ['notes', documentId],
        queryFn: () => notesApi.getByDocument(documentId!),
        enabled: !!documentId,
        staleTime: 60_000,
    });
}