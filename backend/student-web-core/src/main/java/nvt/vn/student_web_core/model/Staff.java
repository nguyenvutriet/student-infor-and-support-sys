package nvt.vn.student_web_core.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "staffs")
@Getter
@Setter
public class Staff extends User{

    @OneToOne
    @JoinColumn(name = "departmentId", referencedColumnName = "departmentId")
    private Department department;

    @OneToMany(mappedBy = "staff", orphanRemoval = true)
    private List<Report> reports = new ArrayList<>();

    @OneToMany(mappedBy = "staff", orphanRemoval = true)
    private List<StudyResource> studyResources = new ArrayList<>();

    @OneToMany(mappedBy = "staff", orphanRemoval = true)
    private List<Document> documents = new ArrayList<>();

    public Staff() {
        super(Role.STAFF);
    }
}
