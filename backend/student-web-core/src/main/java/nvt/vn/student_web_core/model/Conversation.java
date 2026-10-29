package nvt.vn.student_web_core.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "conversations")
@Data
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer conId;

    private String subject;
    private boolean isClosed = false;
    private LocalDateTime createdAt;
    private LocalDateTime closedAt;

    @OneToOne(mappedBy = "conversation", fetch = FetchType.LAZY)
    private Request request;

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Message> messages = new ArrayList<>();

}
