import Icon from './Icon'

// Thẻ nội dung (bo góc, nền trắng – kiểu Facebook)
export default function Card({ title, action, children, className = '' }) {
  return (
    <section className={`ute-card ${className}`}>
      {(title || action) && (
        <div className="ute-card__head">
          <h2 className="ute-card__title">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

// Tiêu đề trang dạng nhãn xanh như trang online.hcmute
export function PageHead({ title, subtitle }) {
  return (
    <div className="ute-pagehead">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
  )
}

// Tab gạch đỏ: tabs = [{ key, label }]
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="ute-tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={active === t.key}
          className={`ute-tab ${active === t.key ? 'ute-tab--active' : ''}`}
          onClick={() => onChange?.(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function SearchField({ placeholder = 'Tìm kiếm', value, onChange }) {
  return (
    <label className="ute-field">
      <Icon name="search" size={18} />
      <input value={value} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder} />
    </label>
  )
}

// Bảng đầu xanh: columns = [{ key, title, render?(row) }]
export function DataTable({ columns, rows, onRowClick }) {
  return (
    <div className="ute-tablewrap">
      <table className="ute-table">
        <thead>
          <tr>{columns.map((c) => <th key={c.key}>{c.title}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id ?? i}>
              {columns.map((c) => (
                <td key={c.key}>
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
