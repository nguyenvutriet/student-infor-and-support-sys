import { useId, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { MAX_NOTE, MAX_SUBJECT, MAX_TITLE, REQUIRED_MSG } from '../../../utils/scheduleUtils'
import { changeScheduleForm, closeScheduleForm, submitScheduleForm } from '../../../store/action/studentAction'

export default function ScheduleForm({ submitLabel, idPrefix = 'sch' }) {
  const dispatch = useDispatch()
  const uid = useId()
  const listId = `${uid}-subjects`
  const { form, items } = useSelector((s) => s.schedule)
  const { values: v, errors, serverError, saving } = form
  const subjects = useMemo(() => [...new Set(items.map((s) => s.subject).filter(Boolean))], [items])

  const on = (field) => (e) => dispatch(changeScheduleForm(field, e.target.value))
  const submit = (e) => { e.preventDefault(); dispatch(submitScheduleForm(toast)) }

  const missing = Object.values(errors).includes(REQUIRED_MSG)
  const cls = (k) => `doc-input${errors[k] ? ' doc-input--error' : ''}`
  const id = (k) => `${idPrefix}-${k}`
  const detail = (k) => errors[k] && errors[k] !== REQUIRED_MSG && <div className="doc-error">{errors[k]}</div>

  return (
    <form className="sty-form" onSubmit={submit} noValidate>
      {(missing || serverError) && <div className="doc-alert" role="alert">{serverError || REQUIRED_MSG}</div>}

      <div className="doc-field">
        <label htmlFor={id('title')}>Tiêu đề <span className="doc-req">*</span></label>
        <input id={id('title')} className={cls('title')} value={v.title} onChange={on('title')} maxLength={MAX_TITLE} placeholder="Ví dụ: Ôn chương 3 Cấu trúc dữ liệu" />
        {detail('title')}
      </div>

      <div className="doc-field">
        <label htmlFor={id('subject')}>Môn học (tùy chọn)</label>
        <input id={id('subject')} className="doc-input" value={v.subject} onChange={on('subject')} maxLength={MAX_SUBJECT} list={listId} placeholder="Nhập hoặc chọn môn học" />
        <datalist id={listId}>{subjects.map((s) => <option key={s} value={s} />)}</datalist>
      </div>

      <div className="doc-field">
        <label htmlFor={id('date')}>Ngày <span className="doc-req">*</span></label>
        <input id={id('date')} type="date" className={cls('date')} value={v.date} onChange={on('date')} />
      </div>

      <div className="sty-form__row">
        <div className="doc-field">
          <label htmlFor={id('start')}>Giờ bắt đầu <span className="doc-req">*</span></label>
          <input id={id('start')} type="time" className={cls('start')} value={v.start} onChange={on('start')} />
        </div>
        <div className="doc-field">
          <label htmlFor={id('end')}>Giờ kết thúc <span className="doc-req">*</span></label>
          <input id={id('end')} type="time" className={cls('end')} value={v.end} onChange={on('end')} />
          {detail('end')}
        </div>
      </div>

      <div className="doc-field">
        <label htmlFor={id('note')}>Ghi chú (tùy chọn)</label>
        <textarea id={id('note')} className="doc-input" rows={3} value={v.note} onChange={on('note')} maxLength={MAX_NOTE} placeholder="Nội dung cần ôn, tài liệu cần đọc..." />
      </div>

      <div className="sty-form__actions">
        <button type="button" className="ute-btn ute-btn--outline" onClick={() => dispatch(closeScheduleForm())} disabled={saving}>Hủy</button>
        <button type="submit" className="ute-btn" disabled={saving}>{saving ? 'Đang lưu...' : submitLabel}</button>
      </div>
    </form>
  )
}
