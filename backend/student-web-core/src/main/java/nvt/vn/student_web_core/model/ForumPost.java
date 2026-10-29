package nvt.vn.student_web_core.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "forum_posts")
@Data
public class ForumPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer postId;

    private String title;
    private String content;
    private LocalDateTime createAt;

    @Enumerated(EnumType.STRING)
    private ViewStatus status = ViewStatus.VISIBLE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "authorId")
    private User author;

    @OneToMany(mappedBy = "forumPost", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FileAttachment> attachments = new ArrayList<>();

    @OneToMany(mappedBy = "forumPost", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SavedPost> savedPosts = new ArrayList<>();

    @OneToMany(mappedBy = "forumPost", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Vote> votes = new ArrayList<>();

    @OneToMany(mappedBy = "forumPost", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Comment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "forumPost", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Report> reports = new ArrayList<>();

}
