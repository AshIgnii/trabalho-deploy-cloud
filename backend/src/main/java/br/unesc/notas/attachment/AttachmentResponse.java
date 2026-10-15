package br.unesc.notas.attachment;

import java.time.Instant;

public record AttachmentResponse(
        Long id,
        Long noteId,
        String fileName,
        String contentType,
        long size,
        Instant createdAt
) {
}
