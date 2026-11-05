package nvt.vn.student_web_core.controller.common;

import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.payload.chat.ChatDto.*;
import nvt.vn.student_web_core.service.ChatService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/** API nhắn tin / yêu cầu hỗ trợ dùng chung cho Sinh viên và Nhân viên. Realtime: ws /api/ws/chat. */
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STUDENT','STAFF')")
public class ChatController {

    private final ChatService chatService;

    @GetMapping("/departments")
    public List<DepartmentOption> departments() { return chatService.departments(); }

    @GetMapping("/requests")
    public List<RequestSummary> list(@RequestParam(required = false) String tab,
                                     @RequestParam(required = false) String status,
                                     @RequestParam(required = false) String q) {
        return chatService.list(tab, status, q);
    }

    @PostMapping("/requests")
    @ResponseStatus(HttpStatus.CREATED)
    public RequestDetail create(@RequestBody CreateRequestBody body) { return chatService.create(body); }

    @GetMapping("/requests/{id}")
    public RequestDetail detail(@PathVariable Integer id) { return chatService.detail(id); }

    @DeleteMapping("/requests/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) { chatService.delete(id); }

    @GetMapping("/requests/{id}/messages")
    public List<MessageDto> messages(@PathVariable Integer id) { return chatService.thread(id); }

    @PostMapping(value = "/requests/{id}/messages", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public MessageDto send(@PathVariable Integer id,
                           @RequestParam(value = "content", required = false) String content,
                           @RequestParam(value = "files", required = false) List<MultipartFile> files) {
        return chatService.send(id, content, files);
    }

    @DeleteMapping("/requests/{id}/messages/{messId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void recall(@PathVariable Integer id, @PathVariable Integer messId) { chatService.recall(id, messId); }

    @PostMapping("/requests/{id}/accept")
    public RequestDetail accept(@PathVariable Integer id) { return chatService.accept(id); }

    @PostMapping("/requests/{id}/reject")
    public RequestDetail reject(@PathVariable Integer id, @RequestBody RejectBody b) { return chatService.reject(id, b.reason()); }

    @PostMapping("/requests/{id}/forward")
    public RequestDetail forward(@PathVariable Integer id, @RequestBody ForwardBody b) { return chatService.forward(id, b); }

    @PostMapping("/requests/{id}/invite")
    public RequestDetail invite(@PathVariable Integer id, @RequestBody InviteBody b) { return chatService.invite(id, b); }

    @PostMapping("/requests/{id}/close")
    public RequestDetail close(@PathVariable Integer id, @RequestBody(required = false) CloseBody b) {
        return chatService.close(id, b == null ? null : b.note());
    }
}
