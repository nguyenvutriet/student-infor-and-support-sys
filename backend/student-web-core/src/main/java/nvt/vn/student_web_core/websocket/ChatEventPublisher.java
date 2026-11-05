package nvt.vn.student_web_core.websocket;

import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.payload.chat.ChatDto.ChatEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import tools.jackson.databind.json.JsonMapper;

import java.util.ArrayList;
import java.util.Collection;

/** Đẩy sự kiện tới người dùng; nếu đang trong transaction thì chỉ gửi SAU KHI commit thành công. */
@Component
@RequiredArgsConstructor
public class ChatEventPublisher {

    private final ChatSessionRegistry registry;
    private final JsonMapper mapper;

    public void publish(Collection<String> userIds, ChatEvent event) {
        final var targets = new ArrayList<>(userIds);
        Runnable send = () -> {
            String json = mapper.writeValueAsString(event);
            targets.forEach(id -> registry.sendTo(id, json));
        };
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCommit() { send.run(); }
            });
        } else {
            send.run();
        }
    }
}
