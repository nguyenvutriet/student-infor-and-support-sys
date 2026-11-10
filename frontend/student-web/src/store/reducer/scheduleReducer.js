
import { addDays, dateKeyOf, emptyScheduleForm, mondayOf, todayKey } from '../../utils/scheduleUtils'

const closedForm = { mode: null, editingId: null, values: emptyScheduleForm(), errors: {}, serverError: '', saving: false }

const initialState = {
  weekStart: mondayOf(todayKey()),   
  pickedDay: todayKey(),           
  items: [],
  loading: false,
  error: '',
  loaded: false,
  selectedId: null,
  form: closedForm,                 
  confirmDelete: false,
  deleting: false,
}

const byStart = (a, b) => a.startTime.localeCompare(b.startTime)
const leaveEditing = (state) => ({
  confirmDelete: false,
  deleting: false,
  form: state.form.mode === 'edit' ? closedForm : state.form,
})

export const scheduleReducer = (state = initialState, action) => {
  const p = action.payload
  switch (action.type) {
    case 'SCHEDULE_WEEK_SET':
      return { ...state, weekStart: p, items: [], loaded: false, selectedId: null, error: '', ...leaveEditing(state) }
    case 'SCHEDULE_DAY_PICK':
      return { ...state, pickedDay: p, selectedId: null, ...leaveEditing(state) }
    case 'SCHEDULE_SELECT':
      return { ...state, selectedId: p, ...leaveEditing(state) }

    case 'SCHEDULE_LIST_REQUEST': return { ...state, loading: true, error: '' }
    case 'SCHEDULE_LIST_SUCCESS':
      if (p.weekStart !== state.weekStart) return state 
      return { ...state, items: [...p.items].sort(byStart), loading: false, loaded: true }
    case 'SCHEDULE_LIST_FAILURE':
      if (p.weekStart !== state.weekStart) return state
      return { ...state, loading: false, error: p.message }

    case 'SCHEDULE_UPSERT': {
      const day = dateKeyOf(p.startTime)
      const inWeek = day >= state.weekStart && day <= addDays(state.weekStart, 6)
      const rest = state.items.filter((s) => s.scheduleId !== p.scheduleId)
      return { ...state, items: inWeek ? [...rest, p].sort(byStart) : rest, selectedId: inWeek ? p.scheduleId : null }
    }
    case 'SCHEDULE_REMOVE':
      return { ...state, items: state.items.filter((s) => s.scheduleId !== p), selectedId: state.selectedId === p ? null : state.selectedId }

    case 'SCHEDULE_FORM_OPEN': return { ...state, form: { ...closedForm, mode: p.mode, editingId: p.editingId ?? null, values: p.values } }
    case 'SCHEDULE_FORM_CHANGE': {
      const { field, value } = p
      const errors = { ...state.form.errors, [field]: '' }
      if (field === 'start' || field === 'end') errors.end = ''
      return { ...state, form: { ...state.form, values: { ...state.form.values, [field]: value }, errors } }
    }
    case 'SCHEDULE_FORM_SAVING': return { ...state, form: { ...state.form, saving: true, serverError: '' } }
    case 'SCHEDULE_FORM_ERRORS': return { ...state, form: { ...state.form, errors: p.errors, serverError: p.serverError || '', saving: false } }
    case 'SCHEDULE_FORM_CLOSE': return { ...state, form: closedForm }

    case 'SCHEDULE_CONFIRM_DELETE': return { ...state, confirmDelete: p, deleting: false }
    case 'SCHEDULE_DELETING': return { ...state, deleting: true }

    default: return state
  }
}
