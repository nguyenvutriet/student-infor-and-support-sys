package nvt.vn.student_web_core.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "study_resources")
@Data
public class StudyResource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer resourceId;

    private String title;
    private String description;
    private LocalDateTime createAt;

    @Enumerated(EnumType.STRING)
    private ViewStatus status = ViewStatus.VISIBLE;

    @Enumerated(EnumType.STRING)
    private ResourceType resourceType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staffId")
    private Staff staff;

    @OneToMany(mappedBy = "studyResource", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FileAttachment> files = new ArrayList<>();

}
