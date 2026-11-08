import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import ForumAvatar from './ForumAvatar'
import PostAttachments from './PostAttachments'
import PostMenu from './PostMenu'
import ReportModal from './ReportModal'
import { CommentIcon } from './ForumIcons'
import { ReactionButton, ReactionSummary } from './ReactionBar'
import { fullDate, timeAgo } from './forumUtils'
import { MODULE_LABELS } from '../../../config/menus'
import { reactForumPost, toggleSaveForumPost } from '../../../store/action/action'

export default function PostCard({ post, canSave, canReport, isAdmin, isHidden = false, onOpen, onHidePost, onRestorePost}) {
  const dispatch = useDispatch()
  const me = useSelector((s) => s.auth?.user)
  const [report, setReport] = useState(false)
  const own = !!post.author?.userId && post.author.userId === me?.userId
  const long = post.content.length > 280 || post.content.split('\n').length > 5

  return (
    <article className="fm-card fm-post">
      <header className="fm-post__head">
        <ForumAvatar name={post.author?.fullName} src={post.author?.avatar} size={42} />
        <div className="fm-post__who">
          <strong>{post.author?.fullName}</strong>
          {post.author?.role && post.author.role !== 'student' && (
            <span className={`fm-role fm-role--${post.author.role}`}>{MODULE_LABELS[post.author.role]}</span>
          )}
          <time title={fullDate(post.createAt)}>{timeAgo(post.createAt)}</time>
        </div>
        <PostMenu
          saved={post.saved}
          onToggleSave={!isHidden && canSave ? () => dispatch(toggleSaveForumPost(post, toast)) : undefined}
          onReport={!isHidden && canReport && !own ? () => setReport(true) : undefined}
          onHide={isAdmin && !isHidden ? () => onHidePost?.(post) : undefined}
          onRestore={isAdmin && isHidden ? () => onRestorePost?.(post) : undefined}
        />
      </header>

      <div className="fm-post__body" onClick={() => onOpen(post)}>
        <h3 className="fm-post__title">{post.title}</h3>
        <p className={`fm-post__content ${long ? 'fm-clamp' : ''}`}>{post.content}</p>
        {long && <span className="fm-more">Xem thêm</span>}
      </div>

      <PostAttachments attachments={post.attachments} limit={4} />

      <ReactionSummary post={post} onClickComments={() => onOpen(post)} />

      <div className="fm-actions">
        <ReactionButton myReaction={post.myReaction} onReact={(type) => dispatch(reactForumPost(post, type, toast))} />
        <button type="button" className="fm-action" onClick={() => onOpen(post, { focusComment: true })}>
          <CommentIcon size={20} /> <span>Bình luận</span>
        </button>
      </div>

      {report && <ReportModal target={{ type: 'POST', id: post.postId, preview: post.title }} onClose={() => setReport(false)} />}
    </article>
  )
}
