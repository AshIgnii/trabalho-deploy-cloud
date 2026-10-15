package br.unesc.notas.note;

import br.unesc.notas.attachment.AttachmentResponse;
import br.unesc.notas.attachment.AttachmentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class NoteService {

    private final NoteRepository repository;
    private final AttachmentService attachmentService;

    public NoteService(NoteRepository repository, AttachmentService attachmentService) {
        this.repository = repository;
        this.attachmentService = attachmentService;
    }

    @Transactional(readOnly = true)
    public List<NoteResponse> findAll(String search) {
        List<Note> notes = search == null || search.isBlank()
                ? repository.findAllByOrderByPinnedDescUpdatedAtDesc()
                : repository.search(search.trim());
        Map<Long, List<AttachmentResponse>> attachments = attachmentService.findSummariesByNoteIds(
                notes.stream().map(Note::getId).toList()
        );
        return notes.stream()
                .map(note -> NoteResponse.from(note, attachments.getOrDefault(note.getId(), List.of())))
                .toList();
    }

    @Transactional(readOnly = true)
    public NoteResponse findById(Long id) {
        return toResponse(getNote(id));
    }

    @Transactional
    public NoteResponse create(NoteRequest request) {
        Note note = new Note();
        apply(note, request);
        return NoteResponse.from(repository.save(note), List.of());
    }

    @Transactional
    public NoteResponse update(Long id, NoteRequest request) {
        Note note = getNote(id);
        apply(note, request);
        return toResponse(repository.saveAndFlush(note));
    }

    @Transactional
    public void delete(Long id) {
        repository.delete(getNote(id));
    }

    private NoteResponse toResponse(Note note) {
        List<AttachmentResponse> attachments = attachmentService.findSummariesByNoteIds(List.of(note.getId()))
                .getOrDefault(note.getId(), List.of());
        return NoteResponse.from(note, attachments);
    }

    private Note getNote(Long id) {
        return repository.findById(id).orElseThrow(() -> new NoteNotFoundException(id));
    }

    private void apply(Note note, NoteRequest request) {
        note.setTitle(request.title().trim());
        note.setContent(request.content());
        note.setColor(request.color());
        note.setPinned(request.pinned());
    }
}
