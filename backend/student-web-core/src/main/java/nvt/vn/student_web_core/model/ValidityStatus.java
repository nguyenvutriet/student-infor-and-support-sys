package nvt.vn.student_web_core.model;

/**
 * Tình trạng hiệu lực của văn bản (lưu trong CSDL).
 * Văn bản bị thay thế (REPLACED_BY) được hệ thống tự chuyển sang EXPIRED.
 */
public enum ValidityStatus {
    PENDING,    // chưa có hiệu lực
    IN_EFFECT,  // còn hiệu lực
    EXPIRED     // hết hiệu lực
}