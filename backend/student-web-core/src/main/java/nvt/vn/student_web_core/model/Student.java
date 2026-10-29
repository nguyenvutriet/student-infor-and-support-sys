package nvt.vn.student_web_core.model;

import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "students")
@Getter
@Setter
public class Student extends User{

    private String major;

    public Student() {
        super(Role.STUDENT);
    }

    @OneToMany(mappedBy = "student", orphanRemoval = true)
    private List<ScheduleEvent> schedules = new ArrayList<>();

    @OneToMany(mappedBy = "student", orphanRemoval = true)
    private List<Request> requests = new ArrayList<>();

    @OneToMany(mappedBy = "student", orphanRemoval = true)
    private List<Report> reports = new ArrayList<>();

}
