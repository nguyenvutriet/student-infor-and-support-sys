import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import Card from '../../commom/Card'
import ScheduleForm from './ScheduleForm'
import ScheduleModal from './ScheduleModal'
import {
  addDays, DAY_LABELS, dateKeyOf, fmtDM, formatWhen, getActiveDay, timeOf, todayKey, weekLabel,
} from '../../../utils/scheduleUtils'
import {
  cancelDeleteSchedule, closeScheduleForm, confirmDeleteSchedule, fetchWeekSchedules, goToScheduleToday,
  initScheduleTab, openCreateSchedule, openEditSchedule, pickScheduleDay, requestDeleteSchedule,
  selectSchedule, shiftScheduleWeek,
} from '../../../store/action/studentAction'

export default function ScheduleTab() {
  const dispatch = useDispatch()
  const schedule = useSelector((s) => s.schedule)
  const { weekStart, items, loading, error, loaded, selectedId, form, confirmDelete, deleting } = schedule

  useEffect(() => { dispatch(initScheduleTab()) }, [dispatch])

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const byDay = useMemo(() => {
    const m = Object.fromEntries(days.map((d) => [d, []]))
    items.forEach((s) => m[dateKeyOf(s.startTime)]?.push(s))
    return m
  }, [days, items])
  const selected = items.find((s) => s.scheduleId === selectedId) || null
  const activeDay = getActiveDay(schedule)
  const today = todayKey()
  const editing = form.mode === 'edit' && selected

  return (
    <Card className="sty-sch-card">
      <div className="sty-sch__toolbar">
        <div className="sty-sch__nav">
          <button type="button" className="ute-btn ute-btn--outline" onClick={() => dispatch(shiftScheduleWeek(-1))}>Trước</button>
          <button type="button" className="ute-btn ute-btn--outline" onClick={() => dispatch(goToScheduleToday())}>Hôm nay</button>
          <button type="button" className="ute-btn ute-btn--outline" onClick={() => dispatch(shiftScheduleWeek(1))}>Sau</button>
          <strong className="sty-sch__week">{weekLabel(weekStart)}</strong>
        </div>
        <button type="button" className="ute-btn" onClick={() => dispatch(openCreateSchedule())}>Thêm lịch</button>
      </div>

      {error && (
        <div className="doc-alert sty-sch__alert" role="alert">
          {error} <button type="button" className="doc-link" onClick={() => dispatch(fetchWeekSchedules(weekStart))}>Thử lại</button>
        </div>
      )}
      {!error && loaded && items.length === 0 && <p className="sty-sch__empty">Chưa có lịch biểu nào trong tuần này.</p>}

      <div className="sty-sch" aria-busy={loading}>
        <div className="sty-week">
          {days.map((day, i) => (
            <div className="sty-day" key={day}>
              <button
                type="button"
                className={`sty-day__head${day === activeDay ? ' is-active' : ''}${day === today ? ' is-today' : ''}`}
                onClick={() => dispatch(pickScheduleDay(day))}
                aria-pressed={day === activeDay}
              >
                {DAY_LABELS[i]} {fmtDM(day)}
              </button>
              <div className="sty-day__body">
                {byDay[day].length === 0 && <span className="sty-day__none">Chưa có lịch</span>}
                {byDay[day].map((s) => (
                  <button
                    type="button"
                    key={s.scheduleId}
                    className={`sty-event${s.scheduleId === selectedId ? ' is-selected' : ''}`}
                    onClick={() => dispatch(selectSchedule(s.scheduleId))}
                  >
                    <strong>{timeOf(s.startTime)} - {timeOf(s.endTime)}</strong>
                    <span>{s.title}</span>
                    {s.subject && <span>{s.subject}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <aside className="sty-detail" aria-label="Chi tiết lịch">
          <h3>Chi tiết lịch</h3>
          {!selected && <p className="sty-detail__hint">Chọn một lịch trong tuần để xem chi tiết.</p>}

          {selected && !editing && (
            <>
              <dl className="sty-detail__list">
                <dt>Tiêu đề</dt><dd>{selected.title}</dd>
                <dt>Môn học</dt><dd>{selected.subject || '—'}</dd>
                <dt>Thời gian</dt><dd>{formatWhen(selected)}</dd>
                <dt>Ghi chú</dt><dd className="sty-detail__note">{selected.note || '—'}</dd>
              </dl>
              <div className="sty-detail__actions">
                <button type="button" className="ute-btn ute-btn--outline" onClick={() => dispatch(openEditSchedule())}>Sửa</button>
                <button type="button" className="ute-btn ute-btn--danger" onClick={() => dispatch(requestDeleteSchedule())}>Xóa</button>
              </div>
            </>
          )}

          {editing && <ScheduleForm idPrefix="sch-edit" submitLabel="Cập nhật" />}
        </aside>
      </div>

      {form.mode === 'create' && (
        <ScheduleModal title="Thêm lịch học" onClose={() => dispatch(closeScheduleForm())}>
          <ScheduleForm idPrefix="sch-new" submitLabel="Lưu lịch" />
        </ScheduleModal>
      )}

      {confirmDelete && selected && (
        <ScheduleModal title="Xóa lịch biểu" width={440} onClose={() => dispatch(cancelDeleteSchedule())}>
          <p className="sty-confirm">Bạn có chắc muốn xóa lịch “{selected.title}” không? Thao tác này không thể hoàn tác.</p>
          <div className="sty-form__actions">
            <button type="button" className="ute-btn ute-btn--outline" onClick={() => dispatch(cancelDeleteSchedule())} disabled={deleting}>Hủy</button>
            <button type="button" className="ute-btn ute-btn--danger" onClick={() => dispatch(confirmDeleteSchedule(toast))} disabled={deleting}>{deleting ? 'Đang xóa...' : 'Xác nhận'}</button>
          </div>
        </ScheduleModal>
      )}
    </Card>
  )
}
