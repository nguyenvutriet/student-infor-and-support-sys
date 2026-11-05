import ForumAvatar from './ForumAvatar'
import Icon from '../Icon'
import { fullDate, isImageAttachment, timeAgo } from './forumUtils'

export default function SavedPostList({ posts, loading, error, hasMore, setSentinel, onRetry, onBack, onOpen, onUnsave }) {
  return (
    <div className="fm-saved">
      <aside className="fm-saved__side fm-card">
        <h2>Đã lưu</h2>
        <button type="button" className="fm-saved__item fm-saved__item--on">
          <span className="fm-saved__ico"><Icon name="bookmark" size={20} filled /></span>
          Bài viết đã lưu
        </button>
        <button type="button" className="fm-saved__item" onClick={onBack}>
          <span className="fm-saved__ico fm-saved__ico--gray"><Icon name="arrowLeft" size={20} /></span>
          Quay lại Diễn đàn
        </button>
      </aside>

      <section className="fm-saved__main">
        <div className="fm-saved__bar">
          <h2>Tất cả</h2>
          <span>{posts.length > 0 ? `${posts.length}${hasMore ? '+' : ''} bài viết` : ''}</span>
        </div>

        {loading && posts.length === 0 && <div className="fm-state">Đang tải…</div>}
        {error && (
          <div className="fm-state fm-state--err">
            {error} <button type="button" className="fm-link" onClick={onRetry}>Thử lại</button>
          </div>
        )}
        {!loading && !error && posts.length === 0 && (
          <div className="fm-state">
            <Icon name="bookmark" size={40} />
            <p>Bạn chưa lưu bài viết nào</p>
          </div>
        )}

        {posts.map((p) => {
          const thumb = (p.attachments || []).find(isImageAttachment)
          return (
            <article key={p.postId} className="fm-card fm-scard" onClick={() => onOpen(p)}>
              <div className="fm-scard__thumb">
                {thumb ? <img src={thumb.fileUrl} alt="" /> : <Icon name="forum" size={44} />}
              </div>
              <div className="fm-scard__body">
                <h3>{p.title}</h3>
                <p className="fm-scard__snippet">{p.content}</p>
                <div className="fm-scard__meta">
                  Bài viết • Đã lưu <span title={fullDate(p.savedAt)}>{timeAgo(p.savedAt)}</span>
                </div>
                <div className="fm-scard__from">
                  <ForumAvatar name={p.author?.fullName} src={p.author?.avatar} size={24} />
                  Đã lưu từ bài viết của <strong>{p.author?.fullName}</strong>
                </div>
                <div className="fm-scard__btns" onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="fm-btn fm-btn--light" onClick={() => onOpen(p)}>Xem bài viết</button>
                  <button type="button" className="fm-btn fm-btn--light" onClick={() => onUnsave(p)}>
                    <Icon name="bookmark" size={16} /> Bỏ lưu
                  </button>
                </div>
              </div>
            </article>
          )
        })}

        {hasMore && <div ref={setSentinel} className="fm-state">Đang tải thêm…</div>}
      </section>
    </div>
  )
}
