package br.unesc.notas.attachment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface AttachmentRepository extends JpaRepository<Attachment, Long> {

    @Query("""
            select new br.unesc.notas.attachment.AttachmentResponse(a.id, a.note.id, a.fileName, a.contentType, a.size, a.createdAt)
            from Attachment a
            where a.note.id in :noteIds
            order by a.createdAt
            """)
    List<AttachmentResponse> findSummariesByNoteIds(@Param("noteIds") Collection<Long> noteIds);
}
