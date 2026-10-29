package nvt.vn.student_web_core.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "forwards")
@Data
public class ForwardingLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer forwardId;

    private String note;
    private LocalDateTime forwardAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requestId")
    private Request request;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "forwardTo")
    private Department forwardTo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiveFrom")
    private Department receiveFrom;

}
