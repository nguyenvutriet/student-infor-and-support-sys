import toast from 'react-hot-toast'
import { downloadFile } from '../../../utils/file'
import { DOWNLOAD_ERROR, resourcePath } from '../../../utils/studyUtils'

export function safeDownload(file) {
  try { downloadFile(file) } catch { toast.error(DOWNLOAD_ERROR) }
}

export function downloadFromCard(resource, navigate) {
  const files = resource.files || []
  if (files.length === 1) return safeDownload(files[0])
  if (files.length === 0) return toast.error(DOWNLOAD_ERROR)
  toast('Có nhiều tập tin, vui lòng chọn tập tin cần tải')
  navigate(resourcePath(resource.resourceId))
}
