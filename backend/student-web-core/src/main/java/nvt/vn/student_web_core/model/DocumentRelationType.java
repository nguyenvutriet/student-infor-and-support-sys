package nvt.vn.student_web_core.model;

public enum DocumentRelationType {
    REPLACES,
    AMENDS,
    SUPPLEMENTS;

    /** Tên loại quan hệ nhìn từ văn bản đối diện (chỉ dùng để hiển thị). */
    public String inverseName() {
        return switch (this) {
            case REPLACES -> "REPLACED_BY";
            case AMENDS -> "AMENDED_BY";
            case SUPPLEMENTS -> "SUPPLEMENTED_BY";
        };
    }
}
