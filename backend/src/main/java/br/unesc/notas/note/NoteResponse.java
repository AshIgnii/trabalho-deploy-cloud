package br.unesc.notas.note;

import br.unesc.notas.attachment.AttachmentResponse;

import java.time.Instant;
import java.util.List;

public record NoteResponse(
        Long id,
        String title,
        String content,
        String color,
        boolean pinned,
        Instant createdAt,
        Instant updatedAt,
        List<AttachmentResponse> attachments
) {
    static NoteResponse from(Note note, List<AttachmentResponse> attachments) {
        return new NoteResponse(
                note.getId(),
                note.getTitle(),
                note.getContent(),
                note.getColor(),
                note.isPinned(),
                note.getCreatedAt(),
                note.getUpdatedAt(),
                attachments
        );
    }
}
