import { PageHead } from '../../commom/Card'
import StudentDocumentList from './StudentDocumentList'
import StudentDocumentDetail from './StudentDocumentDetail'
import '../../../styles/documents.css'
import '../../../styles/student-documents.css'

/** Trang "Văn bản" của sinh viên: view = 'list' (/student/documents) hoặc 'detail' (/student/documents/:docId). */
export default function StudentDocuments({ view = 'list' }) {
  return (
    <>
      <PageHead title={view === 'detail' ? 'Chi tiết văn bản' : 'Văn bản'} />
      {view === 'detail' ? <StudentDocumentDetail /> : <StudentDocumentList />}
    </>
  )
}
