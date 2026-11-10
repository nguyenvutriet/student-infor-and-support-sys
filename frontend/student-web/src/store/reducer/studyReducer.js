
const list = { items: [], loading: false, error: '', loaded: false }

const initialSearch = {
  ...list,
  key: '',                                 
  availableYears: [],
  filters: { keyword: '', year: '' },     
  keywordInput: '',                       
}

const initialState = {
  activeTab: 'resources',                  
  tabOwner: '',                             
  departments: { ...list },                
  latest: { ...list },                     
  department: { id: '', tab: 'overview', data: null, loading: false, error: '', notFound: false }, 
  search: initialSearch,              
  detail: { data: null, loading: false, error: '', notFound: false },                            
}

export const studyReducer = (state = initialState, action) => {
  const p = action.payload
  switch (action.type) {
    case 'STUDY_TAB_SET': return { ...state, activeTab: p.tab, tabOwner: p.owner }

    case 'STUDY_DEPARTMENTS_REQUEST': return { ...state, departments: { ...state.departments, loading: true, error: '' } }
    case 'STUDY_DEPARTMENTS_SUCCESS': return { ...state, departments: { items: p, loading: false, error: '', loaded: true } }
    case 'STUDY_DEPARTMENTS_FAILURE': return { ...state, departments: { ...state.departments, loading: false, error: p } }

    case 'STUDY_LATEST_REQUEST': return { ...state, latest: { ...state.latest, loading: true, error: '' } }
    case 'STUDY_LATEST_SUCCESS': return { ...state, latest: { items: p, loading: false, error: '', loaded: true } }
    case 'STUDY_LATEST_FAILURE': return { ...state, latest: { ...state.latest, loading: false, error: p } }

    case 'STUDY_DEPARTMENT_REQUEST': {
      const same = state.department.id === p.departmentId 
      return { ...state, department: { id: p.departmentId, tab: same ? state.department.tab : 'overview', data: null, loading: true, error: '', notFound: false } }
    }
    case 'STUDY_DEPARTMENT_SUCCESS': return { ...state, department: { ...state.department, data: p, loading: false, error: '', notFound: false } }
    case 'STUDY_DEPARTMENT_FAILURE': return { ...state, department: { ...state.department, data: null, loading: false, error: p.message, notFound: !!p.notFound } }
    case 'STUDY_DEPARTMENT_TAB_SET': return { ...state, department: { ...state.department, tab: p } }

    case 'STUDY_SEARCH_REQUEST': return { ...state, search: { ...state.search, key: p.key, items: [], error: '', loading: true } }
    case 'STUDY_SEARCH_SUCCESS':
      if (p.key !== state.search.key) return state
      return { ...state, search: { ...state.search, items: p.items, availableYears: p.availableYears, loading: false, error: '', loaded: true } }
    case 'STUDY_SEARCH_FAILURE':
      if (p.key !== state.search.key) return state
      return { ...state, search: { ...state.search, loading: false, error: p.message } }
    case 'STUDY_KEYWORD_INPUT': return { ...state, search: { ...state.search, keywordInput: p } }
    case 'STUDY_FILTERS_SET': {
      const filters = { ...state.search.filters, ...p }
      return { ...state, search: { ...state.search, filters, keywordInput: 'keyword' in p ? p.keyword : state.search.keywordInput } }
    }
    case 'STUDY_FILTERS_RESET': return { ...state, search: { ...initialSearch } }

    case 'STUDY_DETAIL_REQUEST': return { ...state, detail: { data: null, loading: true, error: '', notFound: false } }
    case 'STUDY_DETAIL_SUCCESS': return { ...state, detail: { data: p, loading: false, error: '', notFound: false } }
    case 'STUDY_DETAIL_FAILURE': return { ...state, detail: { data: null, loading: false, error: p.message, notFound: !!p.notFound } }

    default: return state
  }
}
