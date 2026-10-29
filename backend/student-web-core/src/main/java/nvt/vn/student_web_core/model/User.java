package nvt.vn.student_web_core.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Inheritance(strategy = InheritanceType.JOINED)
@Data
public abstract class User {

    @Id
    private String userId;
    private String fullName;
    private String email;
    private String password;

    @Enumerated(EnumType.STRING)
    private AccountStatus status = AccountStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Getter
    private Role role;

    @OneToMany(mappedBy = "sender", orphanRemoval = true)
    private List<Message> messages = new ArrayList<>();

    @OneToMany(mappedBy = "user", orphanRemoval = true)
    private List<SavedPost> savedPosts = new ArrayList<>();

    @OneToMany(mappedBy = "author", orphanRemoval = true)
    private List<ForumPost> forumPosts = new ArrayList<>();

    @OneToMany(mappedBy = "user", orphanRemoval = true)
    private List<Vote> votes = new ArrayList<>();

    @OneToMany(mappedBy = "user", orphanRemoval = true)
    private List<Comment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "user", orphanRemoval = true)
    private List<Notification> notifications = new ArrayList<>();


    protected User(Role role) {
        this.role = role;
    }

}
