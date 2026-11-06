import { useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import useChatSocket from '../../hooks/useChatSocket'
import { ROLES, getUserRole } from '../../utils/roles'
import {
  acceptRequest, closeRequest, createRequest, deleteRequest, forwardRequest, getMessages, getRequest,
  inviteDepartments, listDepartments, listRequests, recallMessage, rejectRequest, sendMessage,
} from '../../api/chatApi'
import RequestList from './RequestList'
import ChatWindow from './ChatWindow'
import InfoPanel from './InfoPanel'
import {
  CloseDialog, ConfirmDialog, CreateRequestDialog, ForwardDialog, InviteDialog, RejectDialog,
} from './ChatDialogs'
import '../../styles/chat.css'

/**
 * Trang NHẮN TIN dùng chung cho Sinh viên và Nhân viên (UC 21–31).
 *  - Sinh viên: danh sách yêu cầu của mình + Tạo yêu cầu.
 *  - Nhân viên: 2 tab "Tiếp nhận yêu cầu" / "Nhắn tin" + cột thông tin yêu cầu.
 * Dữ liệu thay đổi (tin nhắn, đổi trạng thái...) được server đẩy qua WebSocket nên không cần tải lại trang.
 */
export default function ChatPage({ initialTab = 'MESSAGES' }) {
  const { user } = useSelector((s) => s.auth)
  const isStaff = getUserRole(user) === ROLES.STAFF
  const myId = user?.userId

  const [tab, setTab] = useState(isStaff ? initialTab : 'MESSAGES')
  const [q, setQ] = useState('')
  const [dq, setDq] = useState('')
  const [status, setStatus] = useState('')
  const [requests, setRequests] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState(false)

  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingChat, setLoadingChat] = useState(false)
  const [chatError, setChatError] = useState('')
  const [unread, setUnread] = useState(() => new Set())
  const [showInfo, setShowInfo] = useState(false)

  const [dialog, setDialog] = useState(null)
  const [departments, setDepartments] = useState([])

  const latest = useRef({})
  const convToken = useRef(0)
  const listTimer = useRef(null)

  // ---------------------------------------------------------------- danh sách
  const fetchList = useCallback(async () => {
    try {
      const data = await listRequests({ tab: isStaff ? tab : undefined, status: status || undefined, q: dq || undefined })
      setRequests(data)
      setListError(false)
    } catch {
      setListError(true)
    } finally {
      setLoadingList(false)
    }
  }, [isStaff, tab, status, dq])

  useEffect(() => { const t = setTimeout(fetchList, 0); return () => clearTimeout(t) }, [fetchList])
  useEffect(() => { const t = setTimeout(() => setDq(q.trim()), 300); return () => clearTimeout(t) }, [q])

  const scheduleList = useCallback(() => {
    clearTimeout(listTimer.current)
    listTimer.current = setTimeout(() => latest.current.fetchList?.(), 250)
  }, [])
  useEffect(() => () => clearTimeout(listTimer.current), [])

  // ---------------------------------------------------------------- hội thoại
  const clearSelection = useCallback(() => {
    convToken.current += 1
    setSelectedId(null); setDetail(null); setMessages([]); setChatError(''); setShowInfo(false)
  }, [])

  const loadConversation = useCallback(async (id) => {
    const token = ++convToken.current
    setLoadingChat(true)
    try {
      const [d, m] = await Promise.all([getRequest(id), getMessages(id)])
      if (token !== convToken.current) return
      setDetail(d); setMessages(m); setChatError('')
    } catch (e) {
      if (token !== convToken.current) return
      if (e.status === 404 || e.status === 403) {
        toast.error(e.message)
        clearSelection()
        latest.current.fetchList?.()
      } else {
        setChatError('Không thể tải tin nhắn')
      }
    } finally {
      if (token === convToken.current) setLoadingChat(false)
    }
  }, [clearSelection])

  const select = useCallback((id) => {
    setSelectedId(id); setDetail(null); setMessages([]); setChatError(''); setShowInfo(false)
    setUnread((prev) => { const n = new Set(prev); n.delete(id); return n })
    loadConversation(id)
  }, [loadConversation])

  const refreshDetail = useCallback(async (id) => {
    try {
      const d = await getRequest(id)
      if (latest.current.selectedId === id) setDetail(d)
    } catch (e) {
      if (latest.current.selectedId === id && (e.status === 404 || e.status === 403)) {
        clearSelection()
        toast(e.status === 403 ? 'Yêu cầu đã được chuyển sang đơn vị khác' : 'Yêu cầu không còn tồn tại')
      }
    }
  }, [clearSelection])

  useEffect(() => { latest.current = { selectedId, fetchList, myId, isStaff, refreshDetail, loadConversation } })

  // ---------------------------------------------------------------- WebSocket
  useChatSocket(
    useCallback((ev) => {
      const { type, requestId, payload } = ev
      const { selectedId: sel, myId: me, isStaff: staff } = latest.current
      switch (type) {
        case 'MESSAGE_CREATED':
          if (requestId === sel) {
            setMessages((prev) => (prev.some((m) => m.messId === payload.messId) ? prev : [...prev, payload]))
          } else if (payload.senderId !== me && payload.type !== 'SYSTEM') {
            setUnread((prev) => new Set(prev).add(requestId))
          }
          scheduleList()
          break
        case 'MESSAGE_RECALLED':
          if (requestId === sel) {
            setMessages((prev) => prev.map((m) => (m.messId === payload.messId
              ? { ...m, recalled: true, content: null, attachments: [] } : m)))
          }
          break
        case 'REQUEST_DELETED':
          if (requestId === sel) { clearSelection(); toast('Yêu cầu đã bị sinh viên xóa') }
          scheduleList()
          break
        case 'REQUEST_CREATED':
          if (staff) toast('Có yêu cầu hỗ trợ mới', { icon: '📩' })
          scheduleList()
          break
        default: // REQUEST_CHANGED
          scheduleList()
          if (requestId === sel) latest.current.refreshDetail(requestId)
      }
    }, [scheduleList, clearSelection]),
    useCallback((reconnected) => {
      if (!reconnected) return
      latest.current.fetchList?.()   // bù dữ liệu bị lỡ khi mất kết nối
      if (latest.current.selectedId) latest.current.loadConversation(latest.current.selectedId)
    }, []),
  )

  // ---------------------------------------------------------------- hành động
  const ensureDepartments = useCallback(async () => {
    if (departments.length) return departments
    const list = await listDepartments()
    setDepartments(list)
    return list
  }, [departments])

  const openWithDepartments = async (d) => {
    try { await ensureDepartments(); setDialog(d) } catch (e) { toast.error(e.message) }
  }

  /** Khi lỗi do dữ liệu đã đổi (không tồn tại / sai trạng thái) thì đồng bộ lại rồi ném lỗi cho hộp thoại hiển thị. */
  const guard = async (fn) => {
    try { return await fn() } catch (e) {
      if ([403, 404, 409].includes(e.status)) {
        fetchList()
        if (selectedId) refreshDetail(selectedId)
      }
      throw e
    }
  }

  const doAccept = async (id) => {
    await guard(() => acceptRequest(id))
    toast.success('Tiếp nhận yêu cầu thành công')
    setDialog(null); setTab('MESSAGES'); select(id)
  }
  const doReject = async (id, reason) => {
    const d = await guard(() => rejectRequest(id, reason))
    toast.success('Từ chối thành công')
    setDialog(null)
    if (d && d.requestId) { setTab('MESSAGES'); select(id) }   // từ chối hẳn: xem lại yêu cầu
    else { clearSelection(); fetchList() }                      // trả về đơn vị cũ / gỡ lời mời: không còn quyền xem
  }
  const doForward = async (id, deptId, note) => {
    await guard(() => forwardRequest(id, deptId, note))
    toast.success('Chuyển tiếp yêu cầu thành công')
    setDialog(null); clearSelection(); fetchList()
  }
  const doInvite = async (id, ids, message) => {
    setDetail(await guard(() => inviteDepartments(id, ids, message)))
    toast.success('Mời đơn vị hỗ trợ thành công')
    setDialog(null)
  }
  const doClose = async (id, note) => {
    setDetail(await guard(() => closeRequest(id, note)))
    toast.success('Đóng trao đổi thành công')
    setDialog(null)
  }
  const doDelete = async (id) => {
    await guard(() => deleteRequest(id))
    toast.success('Xóa yêu cầu thành công')
    setDialog(null)
    if (selectedId === id) clearSelection()
    fetchList()
  }
  const doCreate = async (body) => {
    const d = await createRequest(body)
    toast.success('Gửi yêu cầu thành công')
    setDialog(null); setQ(''); setStatus('')
    fetchList(); select(d.requestId)
  }
  const doRecall = async (msg) => {
    try {
      await recallMessage(selectedId, msg.messId)
      setMessages((prev) => prev.map((m) => (m.messId === msg.messId ? { ...m, recalled: true, content: null, attachments: [] } : m)))
      toast.success('Thu hồi tin nhắn thành công')
    } catch (e) {
      toast.error(e.status ? e.message : 'Thu hồi tin nhắn không thành công')
    }
    setDialog(null)
  }

  const onSend = async (content, files) => {
    const m = await guard(() => sendMessage(selectedId, content, files))
    setMessages((prev) => (prev.some((x) => x.messId === m.messId) ? prev : [...prev, m]))
  }

  const reset = () => { setQ(''); setStatus('') }
  const changeTab = (t) => { setTab(t); setStatus('') }

  const infoActions = {
    accept: () => setDialog({ type: 'accept', id: detail.requestId }),
    reject: () => setDialog({ type: 'reject', id: detail.requestId }),
    forward: () => openWithDepartments({ type: 'forward', id: detail.requestId }),
    invite: () => openWithDepartments({ type: 'invite', id: detail.requestId }),
    close: () => setDialog({ type: 'close', id: detail.requestId }),
    remove: () => setDialog({ type: 'delete', id: detail.requestId }),
  }

  return (
    <div className={`cx-shell ${selectedId ? 'has-selection' : ''} ${isStaff ? 'is-staff' : ''}`}>
      <RequestList
        isStaff={isStaff} tab={tab} onTab={changeTab} q={q} onQ={setQ} status={status} onStatus={setStatus} onReset={reset}
        items={requests} loading={loadingList} error={listError} selectedId={selectedId} unread={unread}
        onSelect={select}
        onCreate={() => openWithDepartments({ type: 'create' })}
        onAccept={(id) => setDialog({ type: 'accept', id })}
        onDelete={(id) => setDialog({ type: 'delete', id })}
      />

      <ChatWindow
        detail={detail} messages={messages} myId={myId} isStaff={isStaff}
        loading={loadingChat} error={chatError}
        onSend={onSend}
        onRecall={(msg) => setDialog({ type: 'recall', msg })}
        onBack={clearSelection}
        onToggleInfo={() => setShowInfo((v) => !v)}
      />

      <InfoPanel detail={detail} isStaff={isStaff} open={showInfo} onClose={() => setShowInfo(false)} actions={infoActions} />

      {dialog?.type === 'accept' && (
        <ConfirmDialog title="Tiếp nhận yêu cầu" message="Bạn xác nhận tiếp nhận và phụ trách yêu cầu hỗ trợ này?"
          onConfirm={() => doAccept(dialog.id)} onClose={() => setDialog(null)} />
      )}
      {dialog?.type === 'reject' && (
        <RejectDialog onSubmit={(reason) => doReject(dialog.id, reason)} onClose={() => setDialog(null)} />
      )}
      {dialog?.type === 'forward' && (
        <ForwardDialog departments={departments} currentId={detail?.departmentId}
          onSubmit={(deptId, note) => doForward(dialog.id, deptId, note)} onClose={() => setDialog(null)} />
      )}
      {dialog?.type === 'invite' && (
        <InviteDialog departments={departments} currentId={detail?.departmentId}
          invitedIds={(detail?.invitedDepartments || []).map((d) => d.id)}
          onSubmit={(ids, msg) => doInvite(dialog.id, ids, msg)} onClose={() => setDialog(null)} />
      )}
      {dialog?.type === 'close' && (
        <CloseDialog onSubmit={(note) => doClose(dialog.id, note)} onClose={() => setDialog(null)} />
      )}
      {dialog?.type === 'delete' && (
        <ConfirmDialog title="Xóa yêu cầu" danger okText="Xóa" message="Bạn có chắc muốn xóa yêu cầu này? Hành động không thể hoàn tác."
          onConfirm={() => doDelete(dialog.id)} onClose={() => setDialog(null)} />
      )}
      {dialog?.type === 'recall' && (
        <ConfirmDialog title="Thu hồi tin nhắn" okText="Thu hồi" message="Tin nhắn sẽ bị thu hồi ở cả hai bên. Bạn có chắc không?"
          onConfirm={() => doRecall(dialog.msg)} onClose={() => setDialog(null)} />
      )}
      {dialog?.type === 'create' && (
        <CreateRequestDialog departments={departments} onSubmit={doCreate} onClose={() => setDialog(null)} />
      )}
    </div>
  )
}
