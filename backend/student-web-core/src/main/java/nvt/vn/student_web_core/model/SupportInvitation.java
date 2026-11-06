package nvt.vn.student_web_core.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/** Đơn vị được Nhân viên phụ trách mời tham gia hỗ trợ một yêu cầu. */
@Entity
@Table(name = "support_invitations",
        uniqueConstraints = @UniqueConstraint(columnNames = {"requestId", "departmentId"}))
@Getter
@Setter
public class SupportInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer inviteId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requestId")
    private Request request;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "departmentId")
    private Department department;

    @Column(length = 500)
    private String note;

    private LocalDateTime invitedAt;

    /** Đơn vị được mời phải bấm "Tiếp nhận" thì mới được nhắn tin trong hội thoại. */
    private boolean accepted;
    private LocalDateTime acceptedAt;
}
