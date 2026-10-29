package nvt.vn.student_web_core.model;

import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "admins")
@Getter
@Setter
public class Admin extends User {

    @OneToMany(mappedBy = "handledBy", orphanRemoval = true)
    private List<Report> handledReports = new ArrayList<>();

    public Admin() {
        super(Role.ADMIN);
    }
}
