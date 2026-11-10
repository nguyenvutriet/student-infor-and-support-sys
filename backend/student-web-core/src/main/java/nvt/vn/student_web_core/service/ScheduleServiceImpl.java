package nvt.vn.student_web_core.service;

import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.model.ScheduleEvent;
import nvt.vn.student_web_core.model.Student;
import nvt.vn.student_web_core.payload.student.ScheduleEventRequest;
import nvt.vn.student_web_core.payload.student.ScheduleEventResponse;
import nvt.vn.student_web_core.repository.ScheduleEventRepo;
import nvt.vn.student_web_core.repository.StudentRepo;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ScheduleServiceImpl implements ScheduleService{

    private final ScheduleEventRepo scheduleEventRepo;
    private final StudentRepo studentRepo;

    @Override
    public List<ScheduleEventResponse> getSchedules(String userId, LocalDate start, LocalDate end) {
        if(start.isAfter(end)){
            throw new IllegalArgumentException("Lỗi: Thời gian bắt đầu không được sau thời gian kết thúc");
        }

        List<ScheduleEvent> scheduleEvents = scheduleEventRepo.findByStudent_UserIdAndStartTimeGreaterThanEqualAndStartTimeLessThanOrderByStartTimeAsc(userId, start, end.plusDays(1));

        List<ScheduleEventResponse> scheduleEventResponses = scheduleEvents.stream()
                .map(schedule -> {
                    ScheduleEventResponse scheduleEventResponse = new ScheduleEventResponse();
                    scheduleEventResponse.setScheduleId(schedule.getScheduleId());
                    scheduleEventResponse.setTitle(schedule.getTitle());
                    scheduleEventResponse.setNote(schedule.getNote());
                    scheduleEventResponse.setSubject(schedule.getSubject());
                    scheduleEventResponse.setStartTime(schedule.getStartTime());
                    scheduleEventResponse.setEndTime(schedule.getEndTime());

                    return scheduleEventResponse;
                }).toList();

        return scheduleEventResponses;
    }

    @Override
    public ScheduleEventResponse createSchedule(String userId, ScheduleEventRequest request) {

        if(request.getTitle().isBlank() || request.getStartTime().isAfter(request.getEndTime())){
            throw new IllegalArgumentException("Lỗi: Thời gian bắt đầu không được sau thời gian kết thúc");
        }

        Student student = studentRepo.findById(userId).orElseThrow(
                () -> new IllegalArgumentException("Lỗi: Không tìm thấy sinh viên với userId: " + userId)
        );

        ScheduleEvent scheduleEvent = new ScheduleEvent();
        scheduleEvent.setTitle(request.getTitle());
        scheduleEvent.setNote(request.getNote());
        scheduleEvent.setSubject(request.getSubject());
        scheduleEvent.setStartTime(request.getStartTime());
        scheduleEvent.setEndTime(request.getEndTime());
        scheduleEvent.setStudent(student);

        ScheduleEvent savedScheduleEvent = scheduleEventRepo.save(scheduleEvent);

        ScheduleEventResponse scheduleEventResponse = new ScheduleEventResponse();
        scheduleEventResponse.setScheduleId(savedScheduleEvent.getScheduleId());
        scheduleEventResponse.setTitle(savedScheduleEvent.getTitle());
        scheduleEventResponse.setNote(savedScheduleEvent.getNote());
        scheduleEventResponse.setSubject(savedScheduleEvent.getSubject());
        scheduleEventResponse.setStartTime(savedScheduleEvent.getStartTime());
        scheduleEventResponse.setEndTime(savedScheduleEvent.getEndTime());

        return scheduleEventResponse;
    }

    @Override
    public ScheduleEventResponse updateSchedule(String userId, Integer scheduleId, ScheduleEventRequest request) {

        ScheduleEvent scheduleEvent = scheduleEventRepo.findById(scheduleId).orElseThrow(
                () -> new IllegalArgumentException("Lỗi: Không tìm thấy lịch với scheduleId: " + scheduleId)
        );

        if(!scheduleEvent.getStudent().getUserId().equals(userId)){
            throw new IllegalArgumentException("Lỗi: Sinh viên không có quyền chỉnh sửa lịch này");
        }

        if(request.getTitle().isBlank() || request.getStartTime().isAfter(request.getEndTime())){
            throw new IllegalArgumentException("Lỗi: Thời gian bắt đầu không được sau thời gian kết thúc");
        }

        scheduleEvent.setTitle(request.getTitle());
        scheduleEvent.setNote(request.getNote());
        scheduleEvent.setSubject(request.getSubject());
        scheduleEvent.setStartTime(request.getStartTime());
        scheduleEvent.setEndTime(request.getEndTime());

        ScheduleEvent updatedScheduleEvent = scheduleEventRepo.save(scheduleEvent);

        ScheduleEventResponse response = new ScheduleEventResponse();
        response.setScheduleId(updatedScheduleEvent.getScheduleId());
        response.setTitle(updatedScheduleEvent.getTitle());
        response.setNote(updatedScheduleEvent.getNote());
        response.setSubject(updatedScheduleEvent.getSubject());
        response.setStartTime(updatedScheduleEvent.getStartTime());
        response.setEndTime(updatedScheduleEvent.getEndTime());

        return response;
    }

    @Override
    public void deleteSchedule(String userId, Integer scheduleId) {

        ScheduleEvent scheduleEvent = scheduleEventRepo.findById(scheduleId).orElseThrow(
                () -> new IllegalArgumentException("Lỗi: Không tìm thấy lịch với scheduleId: " + scheduleId)
        );

        if(!scheduleEvent.getStudent().getUserId().equals(userId)){
            throw new IllegalArgumentException("Lỗi: Sinh viên không có quyền xóa lịch này");
        }

        scheduleEventRepo.delete(scheduleEvent);

    }
}
