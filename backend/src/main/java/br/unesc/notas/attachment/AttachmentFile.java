package br.unesc.notas.attachment;

public record AttachmentFile(String fileName, String contentType, byte[] content) {
}
