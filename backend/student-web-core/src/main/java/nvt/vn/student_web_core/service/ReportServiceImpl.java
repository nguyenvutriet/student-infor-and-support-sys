package nvt.vn.student_web_core.service;

import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.model.*;
import nvt.vn.student_web_core.payload.ReportRequest;
import nvt.vn.student_web_core.payload.ReportResponse;
import nvt.vn.student_web_core.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService{

    private final ForumPostRepo forumPostRepo;
    private final UserRepo userRepo;
    private final StudentRepo studentRepo;
    private final StaffRepo staffRepo;
    private final ReportRepo reportRepo;
    private final CommentRepo commentRepo;

    @Override
    public ReportResponse reportPostOrComment(ReportRequest request, String userId) {

        User user = userRepo.findById(userId).orElseThrow(
                () -> new RuntimeException("Không tìm thấy người dùng")
        );

        if(request.getTargetType() == "POST") {

            ForumPost post = forumPostRepo.findById(request.getTargetId()).orElseThrow(
                    () -> new RuntimeException("Không tìm thấy bài viết")
            );

            Report report = new Report();
            report.setReason(request.getReason());
            report.setForumPost(post);
            report.setCreateAt(LocalDateTime.now());
            if(user.getRole() == Role.STUDENT){
                Student student = studentRepo.findById(user.getUserId()).orElseThrow(
                        () -> new RuntimeException("Không tìm thấy sinh viên")
                );
                report.setStudent(student);
            } else if (user.getRole() == Role.STAFF) {
                Staff staff = staffRepo.findById(user.getUserId()).orElseThrow(
                        () -> new RuntimeException("Không tìm thấy nhân viên")
                );
                report.setStaff(staff);
            }
            reportRepo.save(report);
            ReportResponse response = new ReportResponse();
            response.setReportId(report.getReportId());
            return response;


        } else{
            Comment comment = commentRepo.findById(request.getTargetId()).orElseThrow(
                    () -> new RuntimeException("Không tìm thấy bình luận")
            );

            Report report = new Report();
            report.setReason(request.getReason());
            report.setComment(comment);
            report.setCreateAt(LocalDateTime.now());
            if(user.getRole() == Role.STUDENT){
                Student student = studentRepo.findById(user.getUserId()).orElseThrow(
                        () -> new RuntimeException("Không tìm thấy sinh viên")
                );
                report.setStudent(student);
            } else if (user.getRole() == Role.STAFF) {
                Staff staff = staffRepo.findById(user.getUserId()).orElseThrow(
                        () -> new RuntimeException("Không tìm thấy nhân viên")
                );
                report.setStaff(staff);
            }
            reportRepo.save(report);
            ReportResponse response = new ReportResponse();
            response.setReportId(report.getReportId());
            return response;
        }
    }
}
