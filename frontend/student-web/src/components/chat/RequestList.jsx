import { FiSearch, FiRotateCcw, FiPlus, FiHome, FiTrash2 } from 'react-icons/fi'
import { STATUS_LABEL, STATUS_OPTIONS } from '../../api/chatApi'
import Avatar from './Avatar'
import StatusPill from './StatusPill'
import { timeLabel } from './chatUtils'

export default function RequestList({
                                        isStaff, tab, onTab, q, onQ, status, onStatus, onReset,
                                        items, loading, error, selectedId, unread, onSelect, onCreate, onAccept, onDelete,
                                    }) {
    const filtered = Boolean(q || status)
    const empty = filtered ? 'Không tìm thấy' : 'Chưa có yêu cầu nào'

    return (
        <section className="cx-list" aria-label="Yêu cầu hỗ trợ">
            {isStaff ? (
                <div className="cx-tabs">
                    <button type="button" className={`cx-tabs__btn ${tab === 'REQUESTS' ? 'is-active' : ''}`} onClick={() => onTab('REQUESTS')}>
                        Tiếp nhận yêu cầu
                    </button>
                    <button type="button" className={`cx-tabs__btn ${tab === 'MESSAGES' ? 'is-active' : ''}`} onClick={() => onTab('MESSAGES')}>
                        Nhắn tin
                    </button>
                </div>
            ) : (
                <div className="cx-list__head">
                    <h2>Yêu cầu hỗ trợ</h2>
                    <button type="button" className="cx-btn cx-btn--sm" onClick={onCreate}><FiPlus /> Tạo yêu cầu</button>
                </div>
            )}

            <div className="cx-list__tools">
                <label className="cx-search">
                    <FiSearch />
                    <input value={q} onChange={(e) => onQ(e.target.value)} placeholder="Tìm kiếm yêu cầu..." />
                </label>
                {!(isStaff && tab === 'REQUESTS') && (
                    <div className="cx-filter">
                        <select value={status} onChange={(e) => onStatus(e.target.value)} aria-label="Lọc theo trạng thái">
                            <option value="">Tất cả</option>
                            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                        </select>
                        <button type="button" className="cx-icobtn" onClick={onReset} title="Đặt lại bộ lọc" aria-label="Đặt lại bộ lọc"><FiRotateCcw /></button>
                    </div>
                )}
            </div>

            <ul className="cx-items">
                {loading && <li className="cx-empty">Đang tải…</li>}
                {!loading && error && <li className="cx-empty">Không thể tải danh sách yêu cầu</li>}
                {!loading && !error && items.length === 0 && <li className="cx-empty">{empty}</li>}
                {!loading && !error && items.map((r) => {
                    const name = isStaff ? r.studentName : (r.departmentName || 'Đơn vị')
                    return (
                        <li key={r.requestId}>
                            <div
                                role="button" tabIndex={0}
                                className={`cx-item ${selectedId === r.requestId ? 'is-active' : ''}`}
                                onClick={() => onSelect(r.requestId)}
                                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect(r.requestId))}
                            >
                                <Avatar name={name} size={46} />
                                <div className="cx-item__main">
                                    <div className="cx-item__row">
                                        <strong className={unread.has(r.requestId) ? 'is-unread' : ''}>{name}</strong>
                                        <time>{timeLabel(r.updatedAt || r.createdAt)}</time>
                                    </div>
                                    <div className="cx-item__subject">{r.subject}</div>
                                    <div className="cx-item__row">
                                        {isStaff
                                            ? <span className="cx-item__dept"><FiHome /> {r.departmentName}</span>
                                            : <StatusPill status={r.status} small />}
                                        {isStaff && tab === 'REQUESTS' && (
                                            <button type="button" className="cx-btn cx-btn--sm"
                                                    onClick={(e) => { e.stopPropagation(); onAccept(r.requestId) }}>Tiếp nhận</button>
                                        )}
                                        {!isStaff && r.deletable && (
                                            <button type="button" className="cx-icobtn cx-icobtn--danger" title="Xóa yêu cầu" aria-label="Xóa yêu cầu"
                                                    onClick={(e) => { e.stopPropagation(); onDelete(r.requestId) }}><FiTrash2 /></button>
                                        )}
                                    </div>
                                </div>
                                {unread.has(r.requestId) && <span className="cx-dot" aria-label="Tin nhắn mới" />}
                            </div>
                        </li>
                    )
                })}
            </ul>
        </section>
    )
}