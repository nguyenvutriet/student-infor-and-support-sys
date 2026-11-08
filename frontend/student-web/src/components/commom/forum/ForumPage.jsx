import { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { PageHead } from '../Card'
import Icon from '../Icon'
import ForumAvatar from './ForumAvatar'
import { RefreshIcon } from './ForumIcons'
import PostCard from './PostCard'
import PostComposerModal from './PostComposerModal'
import PostDetailModal from './PostDetailModal'
import SavedPostList from './SavedPostList'
import { firstName } from './forumUtils'
import { getUserRole } from '../../../utils/roles'
import { fetchForumPosts, fetchSavedForumPosts, toggleSaveForumPost } from '../../../store/action/action'
import '../../../styles/forum.css'

// Cuộn vô hạn: trả về callback-ref gắn vào phần tử "mốc" cuối danh sách; khi mốc lọt vào màn hình → onReach()
function useSentinel(onReach, active) {
  const [node, setNode] = useState(null)
  useEffect(() => {
    if (!node || !active) return undefined
    const io = new IntersectionObserver((e) => e[0].isIntersecting && onReach(), { rootMargin: '300px' })
    io.observe(node)
    return () => io.disconnect()
  }, [node, active, onReach])
  return setNode
}

/**
 * TRANG DIỄN ĐÀN DÙNG CHUNG CHO 3 ROLE (student / staff / admin).
 * Chỉ cần đặt <ForumPage /> vào trong layout của role – không cần props.
 * Dữ liệu & gọi API: Redux (state.forum, thunk trong store/action/action.js).
 *
 *  • UC6  Tham gia diễn đàn  : bảng tin + tìm kiếm theo tiêu đề
 *  • UC7  Đăng bài           : popup "Tạo bài viết"
 *  • UC8  Xem bài viết       : popup chi tiết (cảm xúc, bình luận, lưu, báo cáo)
 *  • UC9  Kho lưu trữ        : mục "Bài viết đã lưu" ở cột trái (chỉ student / staff)
 *  Cột trái bảng tin: "Trang chủ" (về bảng tin, thoát tìm kiếm) + "Bài viết đã lưu"
 *  • UC10 Báo cáo vi phạm    : nút "..." của bài viết / nút báo cáo bình luận (chỉ student / staff)
 */
export default function ForumPage() {
  const dispatch = useDispatch()
  const { user } = useSelector((s) => s.auth)
  const { feed, saved } = useSelector((s) => s.forum)
  const role = getUserRole(user) || 'student'
  const isAdmin = role === 'admin'
  const canSave = !isAdmin
  const canReport = !isAdmin

  const [view, setView] = useState('feed') // 'feed' | 'saved'
  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [focused, setFocused] = useState(false)
  const [composer, setComposer] = useState(false)
  const [detail, setDetail] = useState(null) // { post, focusComment }

  // Vào bảng tin / đổi từ khóa → tải lại từ trang đầu; vào Kho lưu trữ → tải danh sách đã lưu
  useEffect(() => {
    if (view === 'feed') dispatch(fetchForumPosts(keyword, 0))
    else dispatch(fetchSavedForumPosts(0))
  }, [dispatch, view, keyword])

  const feedMore = useCallback(() => dispatch(fetchForumPosts(feed.keyword, feed.page + 1)), [dispatch, feed.keyword, feed.page])
  const savedMore = useCallback(() => dispatch(fetchSavedForumPosts(saved.page + 1)), [dispatch, saved.page])
  const feedSentinel = useSentinel(feedMore, view === 'feed' && feed.hasMore && !feed.loading && !feed.error)
  const savedSentinel = useSentinel(savedMore, view === 'saved' && saved.hasMore && !saved.loading && !saved.error)

  const openPost = (post, opts = {}) => setDetail({ post, focusComment: !!opts.focusComment })
  const closeDetail = useCallback(() => setDetail(null), [])

  const submitSearch = (e) => {
    e.preventDefault()
    setKeyword(searchInput.trim()) // UC6 – 2.1
  }
  const backFromSearch = () => { // UC6 – 2.2
    setSearchInput('')
    setKeyword('')
    setFocused(false)
  }

  // "Trang chủ" ở cột trái: thoát tìm kiếm, về đầu bảng tin và tải lại
  const goHome = () => {
    const wasSearching = keyword !== ''
    backFromSearch()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (!wasSearching) dispatch(fetchForumPosts('', 0)) // đang tìm kiếm thì đổi keyword đã tự tải lại
  }

  // Đăng bài khi đang tìm kiếm → thoát tìm kiếm để bài mới hiện ở đầu bảng tin
  const afterPosted = () => { if (keyword) backFromSearch() }

  const searching = keyword !== ''
  const me = { userId: user?.userId, fullName: user?.fullName, avatar: user?.avatar }

  return (
    <div className="fm-page">
      <PageHead title="Diễn đàn" subtitle="Nơi trao đổi, chia sẻ thông tin học tập và đời sống sinh viên" />

      {view === 'saved' ? (
        <SavedPostList
          posts={saved.items}
          loading={saved.loading}
          error={saved.error}
          hasMore={saved.hasMore}
          setSentinel={savedSentinel}
          onRetry={() => dispatch(fetchSavedForumPosts(0))}
          onBack={() => setView('feed')}
          onOpen={(p) => openPost(p)}
          onUnsave={(p) => dispatch(toggleSaveForumPost(p, toast))}
        />
      ) : (
        <div className="fm-feed">
          {/* Cột trái: điều hướng nhanh */}
          <nav className="fm-rail fm-card" aria-label="Điều hướng diễn đàn">
            <button type="button" className={`fm-saved__item ${!searching ? 'fm-saved__item--on' : ''}`} onClick={goHome}>
              <span className="fm-saved__ico"><Icon name="home" size={20} /></span>
              Trang chủ
            </button>
            {canSave && (
              <button type="button" className="fm-saved__item" onClick={() => setView('saved')}>
                <span className="fm-saved__ico fm-saved__ico--gray"><Icon name="bookmark" size={20} filled /></span>
                Bài viết đã lưu
              </button>
            )}
          </nav>

          <div className="fm-col">
            <form className="fm-search" onSubmit={submitSearch}>
              {searching || focused ? (
                <button type="button" className="fm-search__back" onMouseDown={(e) => e.preventDefault()} onClick={backFromSearch} aria-label="Quay lại">
                  <Icon name="arrowLeft" size={18} />
                </button>
              ) : (
                <Icon name="search" size={18} />
              )}
              <input
                value={searchInput}
                placeholder="Tìm kiếm bài viết theo tiêu đề"
                onChange={(e) => setSearchInput(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
            </form>

            {!searching && (
              <div className="fm-card fm-compose">
                <ForumAvatar name={user?.fullName} src={user?.avatar} size={42} />
                <button type="button" className="fm-compose__input" onClick={() => setComposer(true)}>
                  {firstName(user?.fullName)} ơi, bạn đang nghĩ gì thế?
                </button>
              </div>
            )}

            {searching && (
              <div className="fm-searchinfo">
                Kết quả tìm kiếm cho “<strong>{keyword}</strong>”
              </div>
            )}

            {feed.items.map((p) => (
              <PostCard key={p.postId} post={p} canSave={canSave} canReport={canReport} onOpen={openPost} />
            ))}

            {feed.loading && <div className="fm-state">Đang tải bài viết…</div>}

            {feed.error && (
              <div className="fm-card fm-state fm-state--err">
                <p>{feed.error}</p>
                <button type="button" className="fm-btn" onClick={() => dispatch(fetchForumPosts(keyword, 0))}>
                  <RefreshIcon size={16} spinning={feed.loading} /> Thử lại
                </button>
              </div>
            )}

            {!feed.loading && !feed.error && feed.loaded && feed.items.length === 0 && (
              <div className="fm-card fm-state">
                <Icon name="forum" size={40} />
                <p>{searching ? 'Không tìm thấy bài viết' : 'Diễn đàn hiện chưa có bài viết nào'}</p>
              </div>
            )}

            {feed.hasMore && !feed.error && <div ref={feedSentinel} style={{ height: 1 }} />}
          </div>
        </div>
      )}

      {composer && <PostComposerModal user={me} role={role} onClose={() => setComposer(false)} onPosted={afterPosted} />}

      {detail && (
        <PostDetailModal
          key={detail.post.postId}
          post={detail.post}
          user={me}
          canSave={canSave}
          canReport={canReport}
          focusComment={detail.focusComment}
          onClose={closeDetail}
        />
      )}
    </div>
  )
}
