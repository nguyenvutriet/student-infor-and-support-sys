package nvt.vn.student_web_core.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.security.Principal;

/**
 * Kênh realtime một chiều chính (server → client) + ping/pong giữ kết nối.
 * Người dùng được xác thực bằng cookie JWT ngay lúc handshake (qua AuthTokenFilter).
 */
@Component
@RequiredArgsConstructor
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final ChatSessionRegistry registry;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Principal p = session.getPrincipal();
        if (p == null) {
            session.close(CloseStatus.POLICY_VIOLATION.withReason("Unauthenticated"));
            return;
        }
        registry.register(p.getName(), session);
        session.sendMessage(new TextMessage("{\"type\":\"CONNECTED\"}"));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        if (message.getPayload().contains("PING")) {
            session.sendMessage(new TextMessage("{\"type\":\"PONG\"}"));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Principal p = session.getPrincipal();
        if (p != null) registry.unregister(p.getName(), session);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        session.close(CloseStatus.SERVER_ERROR);
    }
}
