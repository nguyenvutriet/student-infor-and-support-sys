import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FiRotateCcw, FiX } from 'react-icons/fi'
import Card from '../../commom/Card'
import Icon from '../../commom/Icon'
import ResourceCard from './ResourceCard'
import {
  applyStudyKeyword, clearStudyKeyword, openStudyBrowser, resetStudyFilters,
  searchStudyResources, setStudyKeywordInput, setStudyYear,
} from '../../../store/action/studentAction'

export default function ResourceBrowser({ departmentId, type }) {
  const dispatch = useDispatch()
  const { items, loading, error, loaded, availableYears, filters, keywordInput } = useSelector((s) => s.study.search)
  const label = type === 'EXAM' ? 'đề thi' : 'tài liệu'
  const filtering = !!(filters.keyword || filters.year)

  useEffect(() => { dispatch(openStudyBrowser(departmentId, type)) }, [dispatch, departmentId, type])

  const submit = (e) => { e.preventDefault(); dispatch(applyStudyKeyword(departmentId, type)) }
  const years = filters.year && !availableYears.map(String).includes(String(filters.year)) ? [...availableYears, filters.year] : availableYears

  return (
    <Card title={type === 'EXAM' ? 'Đề thi' : 'Tài liệu'}>
      <form className="sty-filter" onSubmit={submit}>
        <label className="sty-search">
          <Icon name="search" size={18} />
          <input
            value={keywordInput}
            onChange={(e) => dispatch(setStudyKeywordInput(e.target.value))}
            placeholder={`Tìm ${label} theo mã môn học hoặc tên môn học...`}
          />
          {(keywordInput || filters.keyword) && (
            <button type="button" className="sty-iconbtn" onClick={() => dispatch(clearStudyKeyword(departmentId, type))} aria-label="Hủy tìm kiếm" title="Hủy tìm kiếm"><FiX size={16} /></button>
          )}
        </label>
        <button type="submit" className="ute-btn">Tìm kiếm</button>
        <select
          className="doc-input sty-year"
          value={filters.year}
          onChange={(e) => dispatch(setStudyYear(departmentId, type, e.target.value))}
          aria-label="Lọc theo năm học"
        >
          <option value="">Tất cả năm học</option>
          {years.map((y) => <option key={y} value={y}>Năm {y}</option>)}
        </select>
        <button
          type="button"
          className="ute-btn ute-btn--light sty-reset"
          onClick={() => dispatch(resetStudyFilters(departmentId, type))}
          title="Đặt lại bộ lọc"
          aria-label="Đặt lại bộ lọc"
          disabled={!filtering && !keywordInput}
        >
          <FiRotateCcw size={16} /> Đặt lại
        </button>
      </form>

      {loading && <div className="doc-state">Đang tải...</div>}
      {!loading && error && (
        <div className="doc-state">
          <strong>{error}</strong>
          <button type="button" className="ute-btn" onClick={() => dispatch(searchStudyResources(departmentId, type))}>Thử lại</button>
        </div>
      )}
      {!loading && loaded && !error && items.length === 0 && (
        <div className="doc-state"><strong>{filtering ? 'Không tìm thấy' : `Chưa có ${label} nào được đăng lên`}</strong></div>
      )}
      {!loading && items.length > 0 && (
        <div className="sty-grid sty-grid--res">
          {items.map((r, i) => <ResourceCard key={r.resourceId ?? i} resource={r} showDepartment={false} />)}
        </div>
      )}
    </Card>
  )
}
