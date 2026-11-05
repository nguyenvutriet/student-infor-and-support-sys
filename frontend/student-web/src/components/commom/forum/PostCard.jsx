import { useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import ForumAvatar from './ForumAvatar'
import Icon from '../Icon'
import PostAttachments from './PostAttachments'
import { ReactionButton, ReactionSummary } from './ReactionBar'
import { fullDate, timeAgo } from './forumUtils'
import { MODULE_LABELS } from '../../../config/menus'
import { reactForumPost, toggleSaveForumPost } from '../../../store/action/action'


export default function PostCard({ post, canSave, onOpen }) {
  const dispatch = useDispatch()
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
      </header>

      <div className="fm-post__body" onClick={() => onOpen(post)}>
        <h3 className="fm-post__title">{post.title}</h3>
        <p className={`fm-post__content ${long ? 'fm-clamp' : ''}`}>{post.content}</p>
        {long && <span className="fm-more">Xem thêm</span>}
      </div>

      <PostAttachments attachments={post.attachments} limit={4} onOpen={() => onOpen(post)} />

      <ReactionSummary post={post} onClickComments={() => onOpen(post)} />

      <div className="fm-actions">
        <ReactionButton myReaction={post.myReaction} onReact={(type) => dispatch(reactForumPost(post, type, toast))} />
        <button type="button" className="fm-action" onClick={() => onOpen(post, { focusComment: true })}>
          <Icon name="forum" size={19} /> <span>Bình luận</span>
        </button>
        {canSave && (
          <button
            type="button"
            className={`fm-action ${post.saved ? 'fm-action--saved' : ''}`}
            onClick={() => dispatch(toggleSaveForumPost(post, toast))}
          >
            <Icon name="bookmark" size={19} filled={post.saved} /> <span>{post.saved ? 'Đã lưu' : 'Lưu'}</span>
          </button>
        )}
      </div>
    </article>
  )
}
