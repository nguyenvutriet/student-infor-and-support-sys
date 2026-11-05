import { format, isToday, isYesterday, differenceInMinutes } from 'date-fns'
import { fileExt, IMAGE_EXT } from '../../utils/file.js'

const toDate = (v) => (v ? new Date(v) : null)

export const initials = (name = '') =>
    name.trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase() || 'U'

export function timeLabel(v) {
    const d = toDate(v)
    if (!d) return ''
    if (isToday(d)) return format(d, 'HH:mm')
    if (isYesterday(d)) return 'Hôm qua'
    return format(d, 'dd/MM/yyyy')
}

export const clock = (v) => (toDate(v) ? format(toDate(v), 'HH:mm') : '')
export const fullDate = (v) => (toDate(v) ? format(toDate(v), 'dd/MM/yyyy - HH:mm') : '')

export function separatorLabel(v) {
    const d = toDate(v)
    if (!d) return ''
    if (isToday(d)) return `Hôm nay, ${format(d, 'HH:mm')}`
    if (isYesterday(d)) return `Hôm qua, ${format(d, 'HH:mm')}`
    return format(d, 'dd/MM/yyyy, HH:mm')
}

/** Có cần chèn mốc thời gian giữa hai tin: khác ngày hoặc cách nhau > 30 phút. */
export function needSeparator(prev, cur) {
    if (!prev) return true
    const a = toDate(prev.sendAt), b = toDate(cur.sendAt)
    if (!a || !b) return false
    return format(a, 'yyyyMMdd') !== format(b, 'yyyyMMdd') || differenceInMinutes(b, a) > 30
}

export const isImageFile = (f) => IMAGE_EXT.includes(fileExt(f?.fileName) || fileExt(f?.fileUrl))

export const sortByUpdated = (list) =>
    [...list].sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
