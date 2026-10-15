package br.unesc.notas.note;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NoteRepository extends JpaRepository<Note, Long> {

    List<Note> findAllByOrderByPinnedDescUpdatedAtDesc();

    @Query("""
            select n from Note n
            where lower(n.title) like lower(concat('%', :search, '%'))
               or lower(n.content) like lower(concat('%', :search, '%'))
            order by n.pinned desc, n.updatedAt desc
            """)
    List<Note> search(@Param("search") String search);
}
