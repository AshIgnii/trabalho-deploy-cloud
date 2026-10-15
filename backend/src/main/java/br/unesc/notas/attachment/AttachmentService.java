package br.unesc.notas.attachment;

import br.unesc.notas.note.Note;
import br.unesc.notas.note.NoteNotFoundException;
import br.unesc.notas.note.NoteRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.Base64;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AttachmentService {

    private final AttachmentRepository repository;
    private final NoteRepository noteRepository;

    public AttachmentService(AttachmentRepository repository, NoteRepository noteRepository) {
        this.repository = repository;
        this.noteRepository = noteRepository;
    }

    @Transactional(readOnly = true)
    public Map<Long, List<AttachmentResponse>> findSummariesByNoteIds(Collection<Long> noteIds) {
        if (noteIds.isEmpty()) {
            return Map.of();
        }
        return repository.findSummariesByNoteIds(noteIds).stream()
                .collect(Collectors.groupingBy(AttachmentResponse::noteId));
    }

    @Transactional
    public AttachmentResponse upload(Long noteId, MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Arquivo vazio");
        }
        Note note = noteRepository.findById(noteId).orElseThrow(() -> new NoteNotFoundException(noteId));

        Attachment attachment = new Attachment();
        attachment.setNote(note);
        attachment.setFileName(resolveFileName(file));
        attachment.setContentType(file.getContentType() != null ? file.getContentType() : MediaType.APPLICATION_OCTET_STREAM_VALUE);
        attachment.setSize(file.getSize());
        attachment.setBase64Data(encode(file));

        Attachment saved = repository.save(attachment);
        return new AttachmentResponse(saved.getId(), noteId, saved.getFileName(), saved.getContentType(), saved.getSize(), saved.getCreatedAt());
    }

    @Transactional(readOnly = true)
    public AttachmentFile download(Long id) {
        Attachment attachment = getAttachment(id);
        return new AttachmentFile(
                attachment.getFileName(),
                attachment.getContentType(),
                Base64.getDecoder().decode(attachment.getBase64Data())
        );
    }

    @Transactional
    public void delete(Long id) {
        repository.delete(getAttachment(id));
    }

    private Attachment getAttachment(Long id) {
        return repository.findById(id).orElseThrow(() -> new AttachmentNotFoundException(id));
    }

    private String resolveFileName(MultipartFile file) {
        String fileName = StringUtils.getFilename(file.getOriginalFilename());
        if (!StringUtils.hasText(fileName)) {
            return "arquivo";
        }
        return fileName.length() > 255 ? fileName.substring(fileName.length() - 255) : fileName;
    }

    private String encode(MultipartFile file) {
        try {
            return Base64.getEncoder().encodeToString(file.getBytes());
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Não foi possível ler o arquivo", e);
        }
    }
}
