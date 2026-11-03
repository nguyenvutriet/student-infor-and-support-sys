package nvt.vn.student_web_core.service;

import nvt.vn.student_web_core.model.*;
import nvt.vn.student_web_core.payload.DocumentRequest;
import nvt.vn.student_web_core.payload.DocumentResponse;
import nvt.vn.student_web_core.repository.DepartmentRepo;
import nvt.vn.student_web_core.repository.DocumentRelationRepo;
import nvt.vn.student_web_core.repository.DocumentRepo;
import nvt.vn.student_web_core.util.AuthUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DocumentServiceTest {

    @Mock
    private DocumentRepo documentRepo;

    @Mock
    private DocumentRelationRepo relationRepo;

    @Mock
    private DepartmentRepo departmentRepo;

    @Mock
    private AuthUtil authUtil;

    @Mock
    private CloudinaryService cloudinaryService;

    @InjectMocks
    private DocumentService documentService;

    private Department deptIT;
    private Department deptOther;
    private Staff staff;

    @BeforeEach
    void setUp() {
        deptIT = new Department();
        deptIT.setDepartmentId("CNTT");
        deptIT.setName("Khoa Công nghệ Thông tin");

        deptOther = new Department();
        deptOther.setDepartmentId("DT");
        deptOther.setName("Phòng Đào tạo");

        staff = new Staff();
        staff.setUserId("staff1");
        staff.setFullName("Nguyen Van Staff");
        staff.setDepartment(deptIT);

        lenient().when(authUtil.loggedInUser()).thenReturn(staff);
    }

    @Test
    void testCreateDocument_withValidityPending_success() {
        DocumentRequest req = new DocumentRequest(
                "01/QĐ-CNTT", "Quyết định 1", "Nội dung 1", "PENDING", null, List.of()
        );

        when(documentRepo.existsByDocNumberIgnoreCase("01/QĐ-CNTT")).thenReturn(false);
        when(documentRepo.save(any(Document.class))).thenAnswer(invocation -> {
            Document d = invocation.getArgument(0);
            d.setDocId(1);
            return d;
        });
        when(relationRepo.findIncoming(anyCollection())).thenReturn(List.of());

        DocumentResponse resp = documentService.create(req, null);

        assertNotNull(resp);
        assertEquals("PENDING", resp.validity());
        assertEquals("PENDING", resp.selectedValidity());
        assertEquals("01/QĐ-CNTT", resp.docNumber());
    }

    @Test
    void testCreateDocument_linkToItself_throwsException() {
        DocumentRequest req = new DocumentRequest(
                "01/QĐ-CNTT", "Quyết định 1", "Nội dung 1", "IN_EFFECT", null,
                List.of(new DocumentRequest.RelationRequest(1, "REPLACES"))
        );

        when(documentRepo.existsByDocNumberIgnoreCase("01/QĐ-CNTT")).thenReturn(false);
        when(documentRepo.save(any(Document.class))).thenAnswer(invocation -> {
            Document d = invocation.getArgument(0);
            d.setDocId(1);
            return d;
        });

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            documentService.create(req, null);
        });

        assertNotNull(ex);
    }

    @Test
    void testCreateDocument_duplicateRelationInRequest_throwsException() {
        Document doc2 = new Document();
        doc2.setDocId(2);
        doc2.setDocNumber("02/QĐ-CNTT");
        doc2.setDepartment(deptIT);

        DocumentRequest req = new DocumentRequest(
                "01/QĐ-CNTT", "Quyết định 1", "Nội dung 1", "IN_EFFECT", null,
                List.of(
                        new DocumentRequest.RelationRequest(2, "REPLACES"),
                        new DocumentRequest.RelationRequest(2, "AMENDS")
                )
        );

        when(documentRepo.existsByDocNumberIgnoreCase("01/QĐ-CNTT")).thenReturn(false);
        when(documentRepo.save(any(Document.class))).thenAnswer(invocation -> {
            Document d = invocation.getArgument(0);
            d.setDocId(1);
            return d;
        });
        when(documentRepo.findById(2)).thenReturn(Optional.of(doc2));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            documentService.create(req, null);
        });

        assertNotNull(ex);
    }

    @Test
    void testCreateDocument_linkToDifferentDepartment_throwsException() {
        Document docOther = new Document();
        docOther.setDocId(3);
        docOther.setDocNumber("03/QĐ-DT");
        docOther.setDepartment(deptOther);

        DocumentRequest req = new DocumentRequest(
                "01/QĐ-CNTT", "Quyết định 1", "Nội dung 1", "IN_EFFECT", null,
                List.of(new DocumentRequest.RelationRequest(3, "REPLACES"))
        );

        when(documentRepo.existsByDocNumberIgnoreCase("01/QĐ-CNTT")).thenReturn(false);
        when(documentRepo.save(any(Document.class))).thenAnswer(invocation -> {
            Document d = invocation.getArgument(0);
            d.setDocId(1);
            return d;
        });
        when(documentRepo.findById(3)).thenReturn(Optional.of(docOther));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            documentService.create(req, null);
        });

        assertNotNull(ex);
    }

    @Test
    void testCreateDocument_whenReverseRelationAlreadyExists_throwsException() {
        Document doc2 = new Document();
        doc2.setDocId(2);
        doc2.setDocNumber("02/QĐ-CNTT");
        doc2.setDepartment(deptIT);

        DocumentRequest req = new DocumentRequest(
                "01/QĐ-CNTT", "Quyết định 1", "Nội dung 1", "IN_EFFECT", null,
                List.of(new DocumentRequest.RelationRequest(2, "AMENDS"))
        );

        when(documentRepo.existsByDocNumberIgnoreCase("01/QĐ-CNTT")).thenReturn(false);
        when(documentRepo.save(any(Document.class))).thenAnswer(invocation -> {
            Document d = invocation.getArgument(0);
            d.setDocId(1);
            return d;
        });
        when(documentRepo.findById(2)).thenReturn(Optional.of(doc2));
        // doc2 already points to doc1
        when(relationRepo.findByDocumentIdAndRelatedDocumentId(2, 1))
                .thenReturn(Optional.of(new DocumentRelation()));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            documentService.create(req, null);
        });

        assertNotNull(ex);
    }

    @Test
    void testCreateDocument_replacesRelation_automaticallyMarksReplacedAsExpired() {
        Document doc2 = new Document();
        doc2.setDocId(2);
        doc2.setDocNumber("02/QĐ-CNTT");
        doc2.setTitle("Văn bản cũ");
        doc2.setDepartment(deptIT);
        doc2.setValidity(ValidityStatus.IN_EFFECT);

        DocumentRequest req = new DocumentRequest(
                "01/QĐ-CNTT", "Quyết định thay thế", "Nội dung mới", "IN_EFFECT", null,
                List.of(new DocumentRequest.RelationRequest(2, "REPLACES"))
        );

        when(documentRepo.existsByDocNumberIgnoreCase("01/QĐ-CNTT")).thenReturn(false);
        when(documentRepo.save(any(Document.class))).thenAnswer(invocation -> {
            Document d = invocation.getArgument(0);
            if (d.getDocId() == null) d.setDocId(1);
            return d;
        });
        when(documentRepo.findById(2)).thenReturn(Optional.of(doc2));
        when(relationRepo.findByDocumentIdAndRelatedDocumentId(2, 1)).thenReturn(Optional.empty());
        when(relationRepo.findIncoming(anyCollection())).thenReturn(List.of());

        DocumentResponse resp = documentService.create(req, null);

        assertNotNull(resp);
        // doc2 must be updated to EXPIRED
        assertEquals(ValidityStatus.EXPIRED, doc2.getValidity());
        verify(documentRepo).save(doc2);
    }

    @Test
    void testToResponse_displaysDirectAndInverseRelationsAndAutoExpiresReplaced() {
        // doc1: created by staff, was replaced by doc2 (incoming relation)
        Document doc1 = new Document();
        doc1.setDocId(1);
        doc1.setDocNumber("01/QĐ-CNTT");
        doc1.setTitle("Văn bản số 1");
        doc1.setContent("Nội dung");
        doc1.setValidity(ValidityStatus.IN_EFFECT); // Staff originally set IN_EFFECT
        doc1.setStatus(ViewStatus.VISIBLE);
        doc1.setDepartment(deptIT);
        doc1.setStaff(staff);
        doc1.setCreateAt(LocalDateTime.now());
        doc1.setUpdateAt(LocalDateTime.now());

        // doc3: doc1 supplements doc3 (direct relation)
        Document doc3 = new Document();
        doc3.setDocId(3);
        doc3.setDocNumber("03/QĐ-CNTT");
        doc3.setTitle("Văn bản số 3");

        DocumentRelation directRel = new DocumentRelation();
        directRel.setRelationId(101);
        directRel.setDocument(doc1);
        directRel.setRelatedDocument(doc3);
        directRel.setRelationType(DocumentRelationType.SUPPLEMENTS);
        doc1.setRelatedDocuments(new ArrayList<>(List.of(directRel)));

        // doc2 replaces doc1 (incoming relation)
        Document doc2 = new Document();
        doc2.setDocId(2);
        doc2.setDocNumber("02/QĐ-CNTT");
        doc2.setTitle("Văn bản số 2 thay thế số 1");

        DocumentRelation incomingRel = new DocumentRelation();
        incomingRel.setRelationId(102);
        incomingRel.setDocument(doc2);
        incomingRel.setRelatedDocument(doc1);
        incomingRel.setRelationType(DocumentRelationType.REPLACES);

        when(documentRepo.findById(1)).thenReturn(Optional.of(doc1));
        when(relationRepo.findIncoming(List.of(1))).thenReturn(List.of(incomingRel));

        DocumentResponse resp = documentService.staffDetail(1);

        assertNotNull(resp);
        // Effective validity must be EXPIRED because it is replaced by doc2
        assertEquals("EXPIRED", resp.validity());
        assertEquals("IN_EFFECT", resp.selectedValidity());

        // Must contain both direct relation (SUPPLEMENTS) and reverse relation (REPLACED_BY)
        assertEquals(2, resp.relations().size());

        DocumentResponse.Relation direct = resp.relations().stream()
                .filter(r -> !r.incoming()).findFirst().orElseThrow();
        assertEquals(3, direct.docId());
        assertEquals("SUPPLEMENTS", direct.type());

        DocumentResponse.Relation reverse = resp.relations().stream()
                .filter(DocumentResponse.Relation::incoming).findFirst().orElseThrow();
        assertEquals(2, reverse.docId());
        assertEquals("REPLACED_BY", reverse.type());
    }

    @Test
    void testUpdateDocument_whenReplacedByAnother_locksValidityToExpired() {
        Document doc1 = new Document();
        doc1.setDocId(1);
        doc1.setDocNumber("01/QĐ-CNTT");
        doc1.setTitle("Văn bản số 1");
        doc1.setContent("Nội dung");
        doc1.setValidity(ValidityStatus.EXPIRED);
        doc1.setStatus(ViewStatus.VISIBLE);
        doc1.setDepartment(deptIT);
        doc1.setStaff(staff);
        doc1.setCreateAt(LocalDateTime.now());
        doc1.setUpdateAt(LocalDateTime.now());

        Document doc2 = new Document();
        doc2.setDocId(2);
        doc2.setDocNumber("02/QĐ-CNTT");
        doc2.setTitle("Văn bản thay thế");

        // incoming relation from doc2: REPLACES
        DocumentRelation incomingRel = new DocumentRelation();
        incomingRel.setDocument(doc2);
        incomingRel.setRelatedDocument(doc1);
        incomingRel.setRelationType(DocumentRelationType.REPLACES);

        when(documentRepo.findById(1)).thenReturn(Optional.of(doc1));
        when(documentRepo.existsByDocNumberIgnoreCaseAndDocIdNot("01/QĐ-CNTT", 1)).thenReturn(false);
        when(relationRepo.findIncoming(List.of(1))).thenReturn(List.of(incomingRel));
        when(documentRepo.save(any(Document.class))).thenAnswer(i -> i.getArgument(0));

        // Staff tries to set validity back to "IN_EFFECT"
        DocumentRequest req = new DocumentRequest(
                "01/QĐ-CNTT", "Văn bản số 1 đã sửa", "Nội dung mới", "IN_EFFECT", null, List.of()
        );

        DocumentResponse resp = documentService.update(1, req, null);

        assertNotNull(resp);
        // doc1 validity is locked to EXPIRED
        assertEquals(ValidityStatus.EXPIRED, doc1.getValidity());
        assertEquals("EXPIRED", resp.validity());
    }
}
