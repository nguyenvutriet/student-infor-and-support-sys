package nvt.vn.student_web_core.repository;

import nvt.vn.student_web_core.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepo extends JpaRepository<Message, Integer> {
    @Query("""
        SELECT DISTINCT m FROM Message m
        JOIN FETCH m.sender
        LEFT JOIN FETCH m.attachments
        WHERE m.conversation.conId = :conId
        ORDER BY m.sendAt ASC, m.messId ASC
    """)
    List<Message> findThread(@Param("conId") Integer conId);

    /** [conId, thời điểm tin nhắn cuối] */
    @Query("SELECT m.conversation.conId, MAX(m.sendAt) FROM Message m WHERE m.conversation.conId IN :ids GROUP BY m.conversation.conId")
    List<Object[]> lastMessageTimes(@Param("ids") List<Integer> ids);
}
