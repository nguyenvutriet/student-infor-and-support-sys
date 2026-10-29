package nvt.vn.student_web_core.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "requests")
@Data
public class Request {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer requestId;

    private String subject;
    private String description;
    private boolean isPrivate;
    private LocalDateTime createdAt;
    private boolean isDeleted;

    @Enumerated(EnumType.STRING)
    private  RequestStatus status = RequestStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "studentId")
    private Student student;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversationId")
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "toDepartmentId")
    private Department toDepartment;

    @OneToMany(mappedBy = "request", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RequestStatusHistory> histories = new ArrayList<>();

    @OneToMany(mappedBy = "request", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ForwardingLog> forwardingLogs = new ArrayList<>();

    @OneToMany(mappedBy = "request", cascade = CascadeType.ALL)
    private List<FileAttachment> attachments = new ArrayList<>();


}
