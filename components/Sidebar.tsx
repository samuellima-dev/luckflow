
import React, { useState } from 'react';
import { Sparkles, Folder, Plus, Activity, Sun, Moon, LogOut, Share2, GripVertical, User as UserIcon, Users, Settings } from 'lucide-react';
import { Project, User, ViewMode } from '../types';
import { ROLES_CONFIG } from '../constants';

interface SidebarProps {
  projects: Project[];
  currentProjectId: string | null;
  setProjectId: (id: string) => void;
  onNewProject: () => void;
  onShareProject: (project: Project) => void;
  onReorderProjects: (projects: Project[]) => void;
  user: User;
  onLogout: () => void;
  isDark: boolean;
  toggleTheme: () => void;
  currentView: ViewMode;
  setView: (view: ViewMode) => void;
  onOpenProfile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  projects, 
  currentProjectId, 
  setProjectId, 
  onNewProject,
  onShareProject,
  onReorderProjects,
  user,
  onLogout,
  isDark,
  toggleTheme,
  currentView,
  setView,
  onOpenProfile
}) => {
  const [draggedProject, setDraggedProject] = useState<Project | null>(null);

  // Group Projects
  const myProjects = projects.filter(p => p.ownerId === user.id);
  const sharedProjects = projects.filter(p => p.ownerId !== user.id);
  
  // Find current project object
  const selectedProject = projects.find(p => p.id === currentProjectId);

  const handleDragStart = (e: React.DragEvent, project: Project) => {
    setDraggedProject(project);
    e.dataTransfer.effectAllowed = 'move';
    // Only allow reordering within "My Projects" for now to simplify
    if (project.ownerId !== user.id) {
       e.preventDefault();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetProject: Project) => {
    e.preventDefault();
    if (!draggedProject || draggedProject.id === targetProject.id) return;
    
    // Simple reorder logic for "My Projects"
    if (draggedProject.ownerId === user.id && targetProject.ownerId === user.id) {
        const newOrder = [...projects];
        const draggedIdx = newOrder.findIndex(p => p.id === draggedProject.id);
        const targetIdx = newOrder.findIndex(p => p.id === targetProject.id);
        
        // Remove and insert
        newOrder.splice(draggedIdx, 1);
        newOrder.splice(targetIdx, 0, draggedProject);
        
        onReorderProjects(newOrder);
    }
    setDraggedProject(null);
  };

  const renderProjectItem = (item: Project, isShared: boolean) => (
    <div 
        key={item.id} 
        className={`group relative flex items-center ${!isShared ? 'cursor-grab active:cursor-grabbing' : ''}`}
        draggable={!isShared}
        onDragStart={(e) => handleDragStart(e, item)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, item)}
    >
      {!isShared && (
        <div className="absolute left-1 opacity-0 group-hover:opacity-100 text-nexus-muted cursor-grab">
            <GripVertical size={12} />
        </div>
      )}
      <button
        onClick={() => { setProjectId(item.id); setView('board'); }}
        className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ml-2 ${
          currentProjectId === item.id && currentView !== 'monitoring'
            ? 'bg-nexus-card text-nexus-cobalt border-l-2 border-nexus-cobalt shadow-sm'
            : 'text-nexus-muted hover:text-nexus-text hover:bg-nexus-hover'
        }`}
      >
        <Folder size={16} className={`${currentProjectId === item.id && currentView !== 'monitoring' ? 'text-nexus-cobalt' : 'text-nexus-muted'}`} />
        <span className="truncate max-w-[140px]">{item.name}</span>
        {isShared && (
            <span className="text-[9px] bg-nexus-border px-1 rounded text-nexus-muted ml-auto">
                Shared
            </span>
        )}
      </button>
    </div>
  );

  return (
    <aside className="w-64 h-screen bg-nexus-bg border-r border-nexus-border flex flex-col flex-shrink-0 z-20 transition-colors duration-300">
      <div className="h-16 flex items-center px-6 border-b border-nexus-border">
        <div 
            onClick={() => setView('board')}
            className="flex items-center gap-3 text-nexus-text font-bold tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 bg-nexus-cobalt rounded-sm flex items-center justify-center flex-shrink-0">
             <Sparkles size={16} className="text-white" />
          </div>
          <span className="font-mono text-lg font-bold tracking-tight">LUCKFLOW</span>
        </div>
      </div>

      <div className="flex-1 py-6 px-3 space-y-4 overflow-y-auto">
        
        <div className="space-y-2">
            {/* New Project Button - Only for Admin/Editors ideally, but let's keep unrestricted for structure, controlled by logic */}
            <button 
                onClick={onNewProject} 
                className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-nexus-border rounded hover:border-nexus-cobalt hover:text-nexus-cobalt text-nexus-muted text-xs font-bold uppercase transition-colors"
            >
                <Plus size={14} /> Novo Projeto
            </button>

            {/* Share Current Project Button (Contextual) */}
            {selectedProject && selectedProject.ownerId === user.id && (
                <button 
                    onClick={() => onShareProject(selectedProject)}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-nexus-card border border-nexus-border rounded hover:border-nexus-cobalt hover:text-nexus-cobalt text-nexus-muted text-xs font-bold uppercase transition-colors shadow-sm"
                >
                    <Share2 size={14} /> Compartilhar Projeto
                </button>
            )}
        </div>

        {/* My Projects Section */}
        <div>
            <div className="flex items-center gap-2 px-3 mb-2 text-xs font-mono text-nexus-muted uppercase tracking-widest">
                <UserIcon size={12} />
                <span>Meus Projetos</span>
            </div>
            <div className="space-y-0.5">
                {myProjects.length > 0 ? (
                    myProjects.map(p => renderProjectItem(p, false))
                ) : (
                    <div className="px-5 py-2 text-xs text-nexus-muted italic opacity-50">Vazio</div>
                )}
            </div>
        </div>

        {/* Shared Projects Section */}
        {sharedProjects.length > 0 && (
            <div>
                <div className="flex items-center gap-2 px-3 mb-2 text-xs font-mono text-nexus-muted uppercase tracking-widest">
                    <Users size={12} />
                    <span>Compartilhados</span>
                </div>
                <div className="space-y-0.5">
                    {sharedProjects.map(p => renderProjectItem(p, true))}
                </div>
            </div>
        )}

        <div className="pt-4 mt-4 border-t border-nexus-border/50">
            <div className="px-3 mb-2 text-xs font-mono text-nexus-muted uppercase tracking-widest">SISTEMA</div>
            <button 
                onClick={() => setView('monitoring')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'monitoring' 
                    ? 'bg-nexus-card text-nexus-accent border-l-2 border-nexus-accent' 
                    : 'text-nexus-muted hover:text-nexus-text hover:bg-nexus-hover'
                }`}
            >
            <Activity size={18} />
            <span>Monitoramento</span>
            </button>
        </div>
      </div>

      <div className="p-4 border-t border-nexus-border space-y-4">
        <div className="flex items-center justify-between px-2">
           <span className="text-xs text-nexus-muted font-medium">Tema</span>
           <button 
             onClick={toggleTheme}
             className="p-2 rounded-full bg-nexus-card hover:bg-nexus-hover text-nexus-text border border-nexus-border transition-colors"
           >
             {isDark ? <Sun size={14} /> : <Moon size={14} />}
           </button>
        </div>

        <div 
            onClick={onOpenProfile}
            className="flex items-center gap-3 px-2 pt-2 border-t border-nexus-border cursor-pointer group hover:bg-nexus-card/50 rounded-md p-2 transition-colors"
        >
          <div className="w-8 h-8 rounded bg-gradient-to-br from-nexus-cobalt to-purple-600 flex items-center justify-center text-xs font-bold text-white uppercase relative overflow-hidden">
             {user.avatarUrl ? (
                 <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
             ) : (
                 <>
                    {String(user.username || '').substring(0, 2)}
                    <div className="absolute -bottom-1 -right-1 bg-nexus-card rounded-full p-0.5 border border-nexus-border">
                        <Settings size={8} className="text-nexus-muted" />
                    </div>
                 </>
             )}
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-xs font-medium text-nexus-text truncate">{String(user.username)}</span>
            <span className="text-[9px] text-nexus-muted font-mono flex items-center gap-1">
                {ROLES_CONFIG[user.role].label}
            </span>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onLogout(); }} className="text-nexus-muted hover:text-red-500 transition-colors" title="Sair">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
