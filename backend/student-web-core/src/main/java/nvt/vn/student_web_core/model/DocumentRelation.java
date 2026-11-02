
package nvt.vn.student_web_core.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "document_relations")
@Data
public class DocumentRelation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer relationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "documentId", nullable = false)
    private Document document;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "relatedDocumentId", nullable = false)
    private Document relatedDocument;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DocumentRelationType relationType;
}
