import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { PageHead } from '../Card'
import Icon from '../Icon'
import { ChevronIcon, RefreshIcon } from '../forum/ForumIcons'
import { BellIcon, TypeIcon } from './NotificationIcons'
import { splitDateTime, typeMeta } from './notificationUtils'
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  openNotification,
} from '../../../store/action/action'
import '../../../styles/forum.css'
import '../../../styles/notification.css'


export default function NotificationPage() {
  const dispatch = useDispatch()
  const { list, unreadCount } = useSelector((s) => s.notification)
  const [input, setInput] = useState('')

  useEffect(() => {
    dispatch(fetchNotifications('', 0))
    dispatch(fetchUnreadNotificationCount())
  }, [dispatch])

  useEffect(() => {
    const kw = input.trim()
    if (kw === list.keyword) return undefined
    const t = setTimeout(() => dispatch(fetchNotifications(kw, 0)), 400)
    return () => clearTimeout(t)
  }, [input, list.keyword, dispatch])

  const searching = list.keyword !== ''
  const goPage = (p) => {
    dispatch(fetchNotifications(list.keyword, p))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const from = list.totalElements === 0 ? 0 : list.page * 10 + 1
  const to = list.page * 10 + list.items.length

  return (
    <div className="fm-page nt-page">
      <PageHead title="Thông báo" subtitle="Các thông báo được gửi đến bạn" />

      <section className="fm-card nt-card">
        <form className="nt-search" onSubmit={(e) => { e.preventDefault(); dispatch(fetchNotifications(input.trim(), 0)) }}>
          <Icon name="search" size={20} />
          <input
            value={input}
            placeholder="Tìm kiếm thông báo"
            onChange={(e) => setInput(e.target.value)}
            aria-label="Tìm kiếm thông báo"
          />
          {input && (
            <button type="button" className="nt-search__clear" onClick={() => setInput('')} aria-label="Xóa từ khóa">
              <Icon name="x" size={16} />
            </button>
          )}
        </form>

        {typeof unreadCount === 'number' && unreadCount > 0 && (
          <div className="nt-meta"><span className="nt-dot nt-dot--static" /> Bạn có <strong>{unreadCount}</strong> thông báo chưa đọc</div>
        )}

        {list.error ? (
          <div className="fm-state fm-state--err nt-state">
            <p>{list.error}</p>
            <button type="button" className="fm-btn" onClick={() => dispatch(fetchNotifications(list.keyword, list.page))}>
              <RefreshIcon size={16} spinning={list.loading} /> Thử lại
            </button>
          </div>
        ) : !list.loaded && list.loading ? (
          <div className="fm-state nt-state"><p>Đang tải thông báo…</p></div>
        ) : list.items.length === 0 ? (
          <div className="fm-state nt-state">
            <BellIcon size={40} />
            <p>{searching ? 'Không tìm thấy thông báo' : 'Chưa có thông báo'}</p>
          </div>
        ) : (
          <>
            <div className={`nt-tablewrap ${list.loading ? 'nt-tablewrap--busy' : ''}`}>
              <table className="nt-table">
                <thead>
                  <tr>
                    <th>Thông báo</th>
                    <th className="nt-col-kind">Loại</th>
                    <th className="nt-col-time">Thời gian gửi</th>
                  </tr>
                </thead>
                <tbody>
                  {list.items.map((n) => {
                    const m = typeMeta(n.type)
                    const { date, time } = splitDateTime(n.createAt)
                    const style = { '--k-bg': m.bg, '--k-fg': m.fg }
                    const open = () => dispatch(openNotification(n, toast))
                    return (
                      <tr
                        key={n.notiId}
                        className={`nt-row ${n.read ? '' : 'nt-row--unread'}`}
                        tabIndex={0}
                        role="button"
                        aria-label={`${n.read ? '' : 'Chưa đọc. '}${n.title || m.title}`}
                        onClick={open}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open() } }}
                      >
                        <td>
                          <div className="nt-cellwrap">
                            <span className="nt-ico" style={style}><TypeIcon kind={m.kind} size={20} /></span>
                            <span className="nt-main">
                              <span className="nt-title">{n.title || m.title}</span>
                              <span className="nt-preview">{n.content}</span>
                            </span>
                            {!n.read && <span className="nt-dot" title="Chưa đọc" />}
                          </div>
                        </td>
                        <td className="nt-col-kind"><span className="nt-badge" style={style}>{m.kindLabel}</span></td>
                        <td className="nt-col-time"><span>{date}</span><span>{time}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {list.totalPages > 1 && (
              <div className="nt-pager">
                <span className="nt-pager__info">Hiển thị {from}–{to} / {list.totalElements} thông báo</span>
                <div className="nt-pager__btns">
                  <button type="button" className="fm-btn fm-btn--light" disabled={list.loading || list.page <= 0} onClick={() => goPage(list.page - 1)}>
                    <ChevronIcon dir="left" size={16} /> Trước
                  </button>
                  <span className="nt-pager__page">Trang {list.page + 1} / {list.totalPages}</span>
                  <button type="button" className="fm-btn fm-btn--light" disabled={list.loading || list.page >= list.totalPages - 1} onClick={() => goPage(list.page + 1)}>
                    Sau <ChevronIcon dir="right" size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
