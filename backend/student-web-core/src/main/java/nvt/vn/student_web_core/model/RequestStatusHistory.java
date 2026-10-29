package nvt.vn.student_web_core.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "histories")
@Data
public class RequestStatusHistory {

    @Id
    private Integer historyId;

    private String note;
    private LocalDateTime createAt;

    @Enumerated(EnumType.STRING)
    private RequestStatus status;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requestId")
    private Request request;

}
