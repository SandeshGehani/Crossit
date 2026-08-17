import { Outlet, NavLink, useLocation } from 'react-router-dom';

export default function Layout() {
  const location = useLocation();

  // Helper to determine active state for nav items
  const navLinkClass = ({ isActive }) =>
    `flex flex-col items-center justify-center min-w-[touch-target-min] transition-colors ${
      isActive ? 'text-primary font-semibold' : 'text-on-surface-variant'
    }`;

  // Get page title based on current route
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/people': return 'People';
      case '/reports': return 'Reports';
      case '/settings': return 'Settings';
      case '/add-expense': return 'Add Expense';
      case '/add-iou': return 'Add IOU';
      case '/aging': return 'Aging Debts';
      default:
        if (location.pathname.startsWith('/person/')) return 'Person Detail';
        return 'Crossit';
    }
  };

  const title = getPageTitle();

  return (
    <div className="min-h-screen flex flex-col bg-background font-inter text-on-background">
      {/* Top Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-gutter flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Minimal SVG Logo representation since we don't have the image file hosted */}
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-on-primary font-geist font-bold">
              XL
            </div>
            <span className="font-headline-md text-headline-md text-primary tracking-tight">
              {title}
            </span>
          </div>
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-surface-dim flex items-center justify-center text-on-surface text-label-caps font-bold">
            ME
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow pt-[calc(64px+env(safe-area-inset-top))] pb-[calc(100px+env(safe-area-inset-bottom))] bg-background">
        {/* The Outlet renders the current child route's component */}
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full z-50 bg-surface/80 backdrop-blur-xl pb-safe shadow-[0_-1px_8px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-around h-16">
          <NavLink to="/" className={navLinkClass}>
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-label-caps font-label-caps">Dashboard</span>
          </NavLink>
          
          {/* Add is technically a route or a trigger for the FAB. In the design it seems to trigger a FAB or go to a page. We'll link to an Add chooser or FAB state later, for now link to /add-expense as default */}
          <NavLink to="/add-expense" className={navLinkClass}>
            <span className="material-symbols-outlined">add_circle</span>
            <span className="text-label-caps font-label-caps">Add</span>
          </NavLink>
          
          <NavLink to="/people" className={navLinkClass}>
            <span className="material-symbols-outlined">group</span>
            <span className="text-label-caps font-label-caps">People</span>
          </NavLink>
          
          <NavLink to="/reports" className={navLinkClass}>
            <span className="material-symbols-outlined">bar_chart</span>
            <span className="text-label-caps font-label-caps">Reports</span>
          </NavLink>
          
          <NavLink to="/settings" className={navLinkClass}>
            <span className="material-symbols-outlined">settings</span>
            <span className="text-label-caps font-label-caps">Settings</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
