import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import ForumModal from './ForumModal'
import ForumAvatar from './ForumAvatar'
import PostAttachments from './PostAttachments'
import PostMenu from './PostMenu'
import { CommentIcon } from './ForumIcons'
import ReportModal from './ReportModal'
import { CommentInput, CommentList } from './CommentSection'
import { ReactionButton, ReactionSummary } from './ReactionBar'
import { fullDate, timeAgo } from './forumUtils'
import { MODULE_LABELS } from '../../../config/menus'
import {
  addForumComment, closeForumDetail, fetchForumComments, fetchForumPostDetail,
  openForumDetail, reactForumPost, toggleSaveForumPost,
} from '../../../store/action/action'

export default function PostDetailModal({ post: initialPost, user, canSave, canReport, focusComment, onClose }) {
  const dispatch = useDispatch()
  const postId = initialPost.postId
  const live = useSelector((s) => s.forum.detailPost)
  const { items: comments, loading: cLoading, error: cError } = useSelector((s) => s.forum.comments)
  const post = live?.postId === postId ? live : initialPost

  const [replyTo, setReplyTo] = useState(null)
  const [report, setReport] = useState(null)
  const inputRef = useRef(null)
  const bodyRef = useRef(null)

  useEffect(() => {
    dispatch(openForumDetail(initialPost))
    dispatch(fetchForumPostDetail(postId, toast))
    dispatch(fetchForumComments(postId, toast))
    return () => dispatch(closeForumDetail())
  }, [dispatch, postId])

  useEffect(() => {
    if (post.removed) onClose()
  }, [post.removed, onClose])

  useEffect(() => {
    if (focusComment) setTimeout(() => inputRef.current?.focus(), 150)
  }, [focusComment])

  const submitComment = async (content) => {
    const res = await dispatch(addForumComment(postId, { content, parentId: replyTo?.parentId ?? replyTo?.commentId ?? null }, toast))
    if (res.ok) {
      setReplyTo(null)
      setTimeout(() => bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' }), 50)
    }
    return res.ok
  }

  const own = post.author?.userId === user?.userId
  const showReport = canReport && !own

  return (
    <>
      <ForumModal
        title={`Bài viết của ${post.author?.fullName || ''}`}
        onClose={onClose}
        width={680}
        footer={
          <CommentInput
            user={user}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            onSubmit={submitComment}
            inputRef={inputRef}
          />
        }
      >
        <div className="fm-detail" ref={bodyRef}>
          <header className="fm-post__head">
            <ForumAvatar name={post.author?.fullName} src={post.author?.avatar} size={42} />
            <div className="fm-post__who">
              <strong>{post.author?.fullName}</strong>
              {post.author?.role && post.author.role !== 'student' && (
                <span className={`fm-role fm-role--${post.author.role}`}>{MODULE_LABELS[post.author.role]}</span>
              )}
              <time title={fullDate(post.createAt)}>{timeAgo(post.createAt)} · {fullDate(post.createAt)}</time>
            </div>
            <PostMenu
              saved={post.saved}
              onToggleSave={canSave ? () => dispatch(toggleSaveForumPost(post, toast)) : undefined}
              onReport={showReport ? () => setReport({ type: 'POST', id: postId, preview: post.title }) : undefined}
            />
          </header>

          <h3 className="fm-post__title fm-post__title--lg">{post.title}</h3>
          <p className="fm-post__content">{post.content}</p>
          <PostAttachments attachments={post.attachments} />

          <ReactionSummary post={post} onClickComments={() => inputRef.current?.focus()} />

          <div className="fm-actions">
            <ReactionButton myReaction={post.myReaction} onReact={(type) => dispatch(reactForumPost(post, type, toast))} />
            <button type="button" className="fm-action" onClick={() => inputRef.current?.focus()}>
              <CommentIcon size={20} /> <span>Bình luận</span>
            </button>
          </div>

          <CommentList
            comments={comments}
            loading={cLoading}
            error={cError}
            onRetry={() => dispatch(fetchForumComments(postId, toast))}
            myUserId={user?.userId}
            canReport={canReport}
            onReply={(c) => { setReplyTo(c); inputRef.current?.focus() }}
            onReport={(c) => setReport({ type: 'COMMENT', id: c.commentId, preview: c.content })}
          />
        </div>
      </ForumModal>

      {report && <ReportModal target={report} onClose={() => setReport(null)} />}
    </>
  )
}
