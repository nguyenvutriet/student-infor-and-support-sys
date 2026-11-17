import { PageHead } from '../../commom/Card'
import StudentDocumentList from './StudentDocumentList'
import StudentDocumentDetail from './StudentDocumentDetail'
import '../../../styles/documents.css'
import '../../../styles/student-documents.css'

export default function StudentDocuments({ view = 'list' }) {
  return (
    <>
      <PageHead title={view === 'detail' ? 'Chi tiết văn bản' : 'Văn bản'} />
      {view === 'detail' ? <StudentDocumentDetail /> : <StudentDocumentList />}
    </>
  )
}
