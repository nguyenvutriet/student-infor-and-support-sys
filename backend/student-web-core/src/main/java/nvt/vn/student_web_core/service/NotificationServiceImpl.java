package nvt.vn.student_web_core.service;

import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.model.Notification;
import nvt.vn.student_web_core.model.NotificationType;
import nvt.vn.student_web_core.model.User;
import nvt.vn.student_web_core.payload.NotificationDTO;
import nvt.vn.student_web_core.payload.NotificationResponse;
import nvt.vn.student_web_core.payload.UnreadCountResponse;
import nvt.vn.student_web_core.repository.NotificationRepo;
import nvt.vn.student_web_core.repository.UserRepo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService{

    private final NotificationRepo notificationRepo;
    private final UserRepo userRepo;

    private static final int MAX_CONTENT = 1000;

    @Override
    @Transactional(readOnly = true)
    public NotificationResponse getAllNotification(String keyword, Integer pageNumber, Integer pageSize, String userId) {
        Sort sort = Sort.by(Sort.Direction.DESC, "createAt");
        Pageable pageable = PageRequest.of(pageNumber, pageSize, sort);

        Specification<Notification> spec = (root, q, cb) -> cb.equal(root.get("user").get("userId"), userId);
        if(keyword != null && !keyword.isBlank()){
            String kw = "%" + keyword.trim().toLowerCase() + "%";
            spec = spec.and((root, q, cb) -> cb.like(cb.lower(root.get("content")), kw));
        }

        Page<Notification> page = notificationRepo.findAll(spec, pageable);

        List<NotificationDTO> content = page.getContent().stream()
                .map(noti -> new NotificationDTO(noti.getNotiId(), noti.getContent(), noti.getType(), noti.isRead(), noti.getCreateAt()))
                .toList();

        NotificationResponse response = new NotificationResponse();
        response.setContent(content);
        response.setTotalPages(page.getTotalPages());
        response.setTotalElements(page.getTotalElements());
        response.setPageNumber(page.getNumber());
        response.setPageSize(page.getSize());
        response.setLastPage(page.isLast());

        return response;
    }

    @Override
    @Transactional
    public NotificationDTO markToReaded(Integer notiId, String userId) {
        Notification notification = notificationRepo.findByNotiIdAndUser_UserId(notiId, userId);
        if(notification == null){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tìm thấy thông báo");
        }
        notification.setRead(true);
        notificationRepo.save(notification);

        NotificationDTO notificationDTO = new NotificationDTO(notification.getNotiId(), notification.getContent(), notification.getType(), notification.isRead(), notification.getCreateAt());
        return notificationDTO;
    }

    @Override
    public UnreadCountResponse getUnreadCount(String userId) {
        UnreadCountResponse unreadCountResponse = new UnreadCountResponse();
        unreadCountResponse.setUnreadCount(notificationRepo.countByUser_UserIdAndIsReadFalse(userId));

        return unreadCountResponse;
    }

    @Override
    @Transactional
    public void send(String userId, NotificationType type, String content) {
        if(userId == null || type == null || content == null || content.isBlank()) return;
        User user = userRepo.findById(userId).orElseThrow(
                () -> new UsernameNotFoundException("User not found with id: " + userId)
        );

        if(content.length() > MAX_CONTENT){
            content = content.substring(0, MAX_CONTENT);
        }

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setContent(content);
        notification.setType(type);
        notification.setCreateAt(LocalDateTime.now());

        notificationRepo.save(notification);
    }

    @Override
    @Transactional
    public void sendToMany(Collection<String> userIds, NotificationType type, String content) {
        if (userIds == null || userIds.isEmpty() || type == null || content == null || content.isBlank()) return;
        List<User> users = userRepo.findAllById(userIds);
        if (users.isEmpty()) return;
        List<Notification> notifications = users.stream()
                .map(user -> {
                    Notification notification = new Notification();
                    notification.setUser(user);
                    notification.setContent(content.length() > MAX_CONTENT ? content.substring(0, MAX_CONTENT) : content);
                    notification.setType(type);
                    notification.setCreateAt(LocalDateTime.now());
                    return notification;
                })
                .toList();

        notificationRepo.saveAll(notifications);
    }

    @Override
    @Transactional
    public void sendToAll(NotificationType type, String content) {
        if (type == null || content == null || content.isBlank()) return;
        List<User> users = userRepo.findAll();
        if (users.isEmpty()) return;
        
        for(int i = 0; i < users.size(); i += 1000){
            int end = Math.min(i + 1000, users.size());
            List<User> batchUsers = users.subList(i, end);
            sendToMany(batchUsers.stream().map(User::getUserId).toList(), type, content);
        }
    }
}
