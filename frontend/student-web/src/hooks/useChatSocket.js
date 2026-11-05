import { useEffect, useRef } from 'react'

const WS_URL = `${String(import.meta.env.VITE_BACK_END_URL || '').replace(/^http/i, 'ws')}/api/ws/chat`
const PING_MS = 25000

/**
 * Kết nối WebSocket (ws/wss) tới backend, tự kết nối lại (backoff 1s → 15s) và gửi PING giữ kết nối.
 * Xác thực bằng cookie JWT httpOnly nên không cần gửi token.
 *
 * @param onEvent (event) => void   nhận { type, requestId, payload }
 * @param onOpen  (isReconnect) => void   gọi mỗi lần kết nối thành công (để tải lại dữ liệu bị lỡ khi mất mạng)
 */
export default function useChatSocket(onEvent, onOpen) {
    const eventRef = useRef(onEvent)
    const openRef = useRef(onOpen)
    useEffect(() => { eventRef.current = onEvent; openRef.current = onOpen })

    useEffect(() => {
        let ws = null
        let closed = false
        let retry = 0
        let reconnectTimer = null
        let pingTimer = null
        let everOpened = false

        const connect = () => {
            ws = new WebSocket(WS_URL)

            ws.onopen = () => {
                retry = 0
                openRef.current?.(everOpened)
                everOpened = true
                pingTimer = setInterval(() => {
                    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'PING' }))
                }, PING_MS)
            }

            ws.onmessage = (e) => {
                try {
                    const msg = JSON.parse(e.data)
                    if (msg.type === 'PONG' || msg.type === 'CONNECTED') return
                    eventRef.current?.(msg)
                } catch { /* bỏ qua gói tin lỗi */ }
            }

            ws.onclose = () => {
                clearInterval(pingTimer)
                if (closed) return
                const delay = Math.min(15000, 1000 * 2 ** retry++)
                reconnectTimer = setTimeout(connect, delay)
            }

            ws.onerror = () => ws?.close()
        }

        connect()
        return () => {
            closed = true
            clearTimeout(reconnectTimer)
            clearInterval(pingTimer)
            ws?.close()
        }
    }, [])
}
