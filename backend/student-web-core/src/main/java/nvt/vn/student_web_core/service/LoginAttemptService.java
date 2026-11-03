package nvt.vn.student_web_core.service;

import nvt.vn.student_web_core.handler.TooManyLoginAttemptsException;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;


@Service
public class LoginAttemptService {

    public static final int MAX_ATTEMPTS = 5;
    public static final Duration LOCK_TIME = Duration.ofMinutes(5);

    private record Attempt(int count, Instant lockedUntil) {}

    private final ConcurrentHashMap<String, Attempt> attempts = new ConcurrentHashMap<>();

//    public void checkNotLocked(String username) {
//        long secondsLeft = getSecondsLeft(username);
//        if (secondsLeft > 0) {
//            throw new TooManyLoginAttemptsException(secondsLeft);
//        }
//
//        attempts.computeIfPresent(key(username), (k, a) ->
//                a.lockedUntil() != null ? null : a);
//    }

    public void loginFailed(String username) {
        attempts.compute(key(username), (k, old) -> {
            int count = (old == null ? 0 : old.count()) + 1;
            return count >= MAX_ATTEMPTS
                    ? new Attempt(0, Instant.now().plus(LOCK_TIME))
                    : new Attempt(count, null);
        });
    }

    public long getSecondsLeft(String username) {
        Attempt a = attempts.get(key(username));
        if (a == null || a.lockedUntil() == null) return 0;

        long millisLeft = Duration.between(Instant.now(), a.lockedUntil()).toMillis();
        return millisLeft > 0 ? (millisLeft + 999) / 1000 : 0;
    }

    public boolean isBlocked(String username) {
        return getSecondsLeft(username) > 0;
    }

    public void loginSucceeded(String username) {
        attempts.remove(key(username));
    }

    private String key(String username) {
        return username == null ? "" : username.trim().toLowerCase(Locale.ROOT);
    }
}
