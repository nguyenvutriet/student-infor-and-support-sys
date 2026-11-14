import { createRoot } from 'react-dom/client'
import './index.css'
import { Provider } from 'react-redux'
import store from './store/store.js'
import App from './App.jsx'
import { purgeLegacyAuthStorage } from './utils/authStorage.js'
import { setupApiInterceptors } from './api/api.js'
import { restoreSession } from './store/action/action.js'

purgeLegacyAuthStorage()
setupApiInterceptors(store)
store.dispatch(restoreSession())

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
        <App />
    </Provider>
)
