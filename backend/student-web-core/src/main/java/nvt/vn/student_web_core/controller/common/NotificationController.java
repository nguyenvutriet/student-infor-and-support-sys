package nvt.vn.student_web_core.controller.common;

import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.config.AppConstants;
import nvt.vn.student_web_core.payload.NotificationDTO;
import nvt.vn.student_web_core.payload.NotificationResponse;
import nvt.vn.student_web_core.payload.UnreadCountResponse;
import nvt.vn.student_web_core.service.NotificationService;
import nvt.vn.student_web_core.util.AuthUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final AuthUtil authUtil;

    @GetMapping
    public ResponseEntity<NotificationResponse> getNotifications(
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "pageNumber", defaultValue = AppConstants.PAGE_NUMBER, required = false) Integer pageNumber,
            @RequestParam(name = "pageSize", defaultValue = AppConstants.PAGE_SIZE, required = false) Integer pageSize
    ){
        NotificationResponse response = notificationService.getAllNotification(keyword, pageNumber, pageSize, authUtil.loggedInUser().getUserId());
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PutMapping("/{notiId}/read")
    public ResponseEntity<NotificationDTO> markAsRead(@PathVariable Integer notiId){
        NotificationDTO readNoti = notificationService.markToReaded(notiId, authUtil.loggedInUser().getUserId());
        return new ResponseEntity<>(readNoti, HttpStatus.OK);
    }

    @GetMapping("/unread-count")
    public  ResponseEntity<UnreadCountResponse> getUnread(){
        UnreadCountResponse unread = notificationService.getUnreadCount(authUtil.loggedInUser().getUserId());
        return new ResponseEntity<>(unread, HttpStatus.OK);
    }



}
