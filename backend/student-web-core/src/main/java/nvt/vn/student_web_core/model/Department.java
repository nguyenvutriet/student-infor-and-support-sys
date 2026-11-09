package nvt.vn.student_web_core.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "departments")
@Data
public class Department {

    @Id
    private String departmentId;

    private String name;
    private String description;
    private String email;
    private String phone;
    private String location;
    private String logoUrl;

    @OneToOne(mappedBy = "department",
        fetch = FetchType.LAZY,
        cascade = CascadeType.ALL
    )
    private Staff headOfDepartment;

    @OneToMany(mappedBy = "toDepartment")
    private List<Request> requests = new ArrayList<>();

    @OneToMany(mappedBy = "forwardTo")
    private List<ForwardingLog> forwardingLogs = new ArrayList<>();

    @OneToMany(mappedBy = "receiveFrom")
    private List<ForwardingLog> receivedLogs = new ArrayList<>();

    @OneToMany(mappedBy = "department")
    private List<Document> documents = new ArrayList<>();

}
