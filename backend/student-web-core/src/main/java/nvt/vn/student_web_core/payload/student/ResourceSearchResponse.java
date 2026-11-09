package nvt.vn.student_web_core.payload.student;

import lombok.Data;

import java.util.List;

@Data
public class ResourceSearchResponse {

    private List<StudyResourceSummaryResponse> items;
    private List<Integer> availableYears;

}
