package nvt.vn.student_web_core.websocket;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.ConcurrentWebSocketSessionDecorator;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/** Quản lý các kết nối WebSocket đang mở theo userId (một người có thể mở nhiều tab). */
@Slf4j
@Component
public class ChatSessionRegistry {

    private final Map<String, Set<ConcurrentWebSocketSessionDecorator>> byUser = new ConcurrentHashMap<>();

    public void register(String userId, WebSocketSession session) {
        // Decorator đảm bảo gửi tuần tự an toàn từ nhiều luồng; quá 10s / 512KB thì ngắt kết nối chậm.
        var safe = new ConcurrentWebSocketSessionDecorator(session, 10_000, 512 * 1024);
        byUser.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(safe);
    }

    public void unregister(String userId, WebSocketSession session) {
        var set = byUser.get(userId);
        if (set == null) return;
        set.removeIf(s -> s.getId().equals(session.getId()));
        if (set.isEmpty()) byUser.remove(userId);
    }

    public void sendTo(String userId, String json) {
        var set = byUser.get(userId);
        if (set == null) return;
        for (var s : set) {
            try {
                if (s.isOpen()) s.sendMessage(new TextMessage(json));
            } catch (Exception e) {
                log.debug("Không gửi được tới {}: {}", userId, e.getMessage());
                try { s.close(CloseStatus.SESSION_NOT_RELIABLE); } catch (Exception ignored) { }
            }
        }
    }

    public void send(WebSocketSession session, String userId, String json) {
        sendTo(userId, json);
    }
}
