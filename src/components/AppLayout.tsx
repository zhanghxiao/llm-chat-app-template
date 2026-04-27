import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { parseExcel } from '@/utils/dataProcessor';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  GitCompare,
  Trophy,
  Table2,
  Upload,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

const navItems = [
  { path: '/', label: '总览', icon: LayoutDashboard },
  { path: '/slope', label: '坡度图', icon: GitCompare },
  { path: '/race', label: '赛跑图', icon: Trophy },
  { path: '/ranking', label: '排名表', icon: Table2 },
];

export default function AppLayout() {
  const { setData } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const [uploading, setUploading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      setData(parseExcel(buffer));
    } catch (err) {
      console.error('解析失败:', err);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#FDFBF7]">
      {/* Sidebar */}
      <aside
        className="flex flex-col h-full py-6 border-r border-[#E8E4D9] bg-white/60 transition-all duration-300 ease-in-out"
        style={{ width: collapsed ? 64 : 200, minWidth: collapsed ? 64 : 200 }}
      >
        {/* Logo + collapse toggle */}
        <div className={`mb-8 flex items-center ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          {!collapsed && (
            <div className="px-0">
              <h1 className="font-display text-lg tracking-tight text-[#2D2B26]">
                成绩分析
              </h1>
              <p className="text-[11px] text-[#6B685A] mt-0.5">
                七年级 · 11班
              </p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-1.5 rounded-md text-[#B0A99A] hover:text-[#6B685A] hover:bg-[#F5F2EB] transition-colors"
            title={collapsed ? '展开侧边栏' : '收起侧边栏'}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className={`flex-1 space-y-0.5 ${collapsed ? 'px-2' : 'px-4'}`}>
          {navItems.map((item) => {
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={`flex items-center rounded-[10px] text-sm transition-colors duration-150 ${
                  collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'
                }`}
                style={{
                  color: isActive ? '#3B5C9F' : '#6B685A',
                  background: isActive ? 'rgba(59,92,159,0.06)' : 'transparent',
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                <Icon size={16} strokeWidth={1.8} />
                {!collapsed && item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className={`pt-4 border-t border-[#E8E4D9] space-y-2 ${collapsed ? 'px-2' : 'px-4'}`}>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleUpload}
            className="hidden"
          />
          <Button
            variant="ghost"
            size="sm"
            className={`w-full text-[12px] text-[#6B685A] hover:text-[#2D2B26] h-8 font-normal ${
              collapsed ? 'justify-center px-0' : 'justify-start gap-2'
            }`}
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            title={collapsed ? '上传 Excel' : undefined}
          >
            <Upload size={14} strokeWidth={1.8} />
            {!collapsed && (uploading ? '解析中...' : '上传 Excel')}
          </Button>
          {!collapsed && (
            <p className="text-[10px] text-center text-[#B0A99A] mt-1">
              711 · 数据可视化
            </p>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-[900px] mx-auto px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
