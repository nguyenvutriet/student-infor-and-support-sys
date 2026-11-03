import { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import MainLayout from './MainLayout'
import { MENUS } from '../../config/menus'
import { getHomePath, getUserRole } from '../../utils/roles'
import { logoutUser } from '../../store/action/action'

/**
 * Layout route: bọc MainLayout quanh mọi trang con (qua <Outlet />).
 * - module  : lấy từ role của user đăng nhập (student | staff | admin)
 * - activeKey: suy ra từ URL hiện tại, khớp path dài nhất trong MENUS
 * - onNavigate: điều hướng theo item.path (item "home" → trang chủ của role)
 */
export default function AppLayout() {
  const { user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const module = getUserRole(user) || 'student'

  const activeKey = useMemo(() => {
    const items = (MENUS[module] || []).filter((it) => it.path)
    const match = items
      .filter((it) => pathname === it.path || pathname.startsWith(`${it.path}/`))
      .sort((a, b) => b.path.length - a.path.length)[0]
    return match?.key
  }, [module, pathname])

  const handleNavigate = (item) => {
    if (item.key === 'home') return navigate(getHomePath(user) || '/')
    if (item.path) navigate(item.path)
  }

  const layoutUser = {
    name: user?.fullName,
    code: user?.userId,
    avatar: user?.avatar,
  }

  return (
    <MainLayout
      module={module}
      activeKey={activeKey}
      onNavigate={handleNavigate}
      user={layoutUser}
      onLogout={() => dispatch(logoutUser(navigate))}
    >
      <Outlet />
    </MainLayout>
  )
}
