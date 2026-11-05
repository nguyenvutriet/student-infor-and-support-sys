package nvt.vn.student_web_core.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "histories")
@Data
public class RequestStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer historyId;

    private String note;
    private LocalDateTime createAt;
    private String action;
    private String actorName;
    private String departmentName;

    @Enumerated(EnumType.STRING)
    private RequestStatus status;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requestId")
    private Request request;

}
