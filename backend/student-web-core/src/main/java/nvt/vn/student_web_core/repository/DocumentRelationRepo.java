package nvt.vn.student_web_core.repository;

import nvt.vn.student_web_core.model.DocumentRelation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentRelationRepo extends JpaRepository<DocumentRelation, Integer> {
    /** Các quan hệ do văn bản KHÁC khai báo và trỏ tới các văn bản này (chiều ngược, tự truy vấn khi đọc). */
    @Query("SELECT r FROM DocumentRelation r WHERE r.relatedDocument.docId IN :ids")
    List<DocumentRelation> findIncoming(@Param("ids") Collection<Integer> ids);

    @Query("SELECT r FROM DocumentRelation r WHERE r.document.docId = :docId AND r.relatedDocument.docId = :relatedDocId")
    Optional<DocumentRelation> findByDocumentIdAndRelatedDocumentId(@Param("docId") Integer docId, @Param("relatedDocId") Integer relatedDocId);
}
