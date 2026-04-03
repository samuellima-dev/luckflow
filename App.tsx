
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { MetricsHeader } from './components/MetricsHeader';
import { TaskCard } from './components/TaskCard';
import { TaskModal } from './components/TaskModal';
import { AuthScreen } from './components/AuthScreen';
import { ProjectModal } from './components/ProjectModal';
import { MonitoringDashboard } from './components/MonitoringDashboard';
import { SalesFunnel } from './components/SalesFunnel';
import { ProfileModal } from './components/ProfileModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { ListView, TableView } from './components/ProjectViews';
import { Task, Status, User, Project, Tag, ViewMode } from './types';
import { Pipeline } from './types/agendor';
import { STATUS_COLUMNS, PRESET_TAGS } from './constants';
import { Plus, X, Loader2, CheckCircle2, WifiOff, EyeOff, Zap, MessageCircle, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from './supabaseClient';
import { pipelineService } from './services/agendorService';

// --- MOCK DATA FOR OFFLINE MODE ---
const MOCK_PROJECTS: Project[] = [
    { id: 'proj-1', name: 'Plataforma E-commerce', ownerId: 'demo', sharedWith: [] },
    { id: 'proj-2', name: 'Automação Marketing', ownerId: 'demo', sharedWith: [] },
    { id: 'proj-3', name: 'App Mobile Delivery', ownerId: 'demo', sharedWith: [] }
];

const MOCK_TASKS: Task[] = [
    { id: 't1', title: 'Integração Gateway de Pagamento', description: 'Configurar Stripe e webhooks', status: 'inprogress', priority: 'High', progress: 65, tags: [{text: 'Integração API', color: '#22c55e'}], attachments: [], checklist: [{id:'1', text: 'Chaves API', checked: true}], projectId: 'proj-1', createdAt: new Date(Date.now() - 10000).toISOString(), assignee: 'demo', position: 1000, coverUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&q=80&w=800' },
    { id: 't2', title: 'Design System v2.0', description: 'Atualizar componentes no Figma', status: 'todo', priority: 'Medium', progress: 0, tags: [{text: 'Dashboard', color: '#ec4899'}], attachments: [], checklist: [], projectId: 'proj-1', createdAt: new Date(Date.now() - 8000).toISOString(), assignee: 'demo', position: 2000 },
    { id: 't3', title: 'Setup de CI/CD', description: 'Pipeline no Github Actions', status: 'done', priority: 'High', progress: 100, tags: [{text: 'Infra/Deploy', color: '#ef4444'}], attachments: [], checklist: [{id:'1', text: 'Build script', checked: true}], projectId: 'proj-1', createdAt: new Date(Date.now() - 6000).toISOString(), assignee: 'demo', position: 3000 },
    { id: 't4', title: 'Fluxo de Automação de Leads', description: 'Conectar Typeform ao CRM via Make', status: 'inprogress', priority: 'High', progress: 40, tags: [{text: 'Automação (Make/Zapier)', color: '#f97316'}], attachments: [], checklist: [], projectId: 'proj-2', createdAt: new Date(Date.now() - 4000).toISOString(), assignee: 'demo', position: 1000 },
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  
  // Data State
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentPipelineId, setCurrentPipelineId] = useState<string | null>(null);
  const [systemTags, setSystemTags] = useState<Tag[]>([]);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState<ViewMode>('board');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  const [projectModalMode, setProjectModalMode] = useState<'create' | 'share'>('create');
  const [projectToShare, setProjectToShare] = useState<Project | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDark, setIsDark] = useState(true);
  
  const [hiddenColumns, setHiddenColumns] = useState<Status[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'automation' | 'whatsapp' | 'schedule' } | null>(null);

  const [quickAddColumn, setQuickAddColumn] = useState<Status | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState('');

  useEffect(() => {
    const activeUsername = localStorage.getItem('luck_active_user');
    if (activeUsername) {
       const savedRole = localStorage.getItem(`luck_role_${activeUsername}`);
       const savedPlan = localStorage.getItem(`luck_plan_${activeUsername}`);
       const savedAvatar = localStorage.getItem(`luck_avatar_${activeUsername}`);
       const savedWhatsapp = localStorage.getItem(`luck_whatsapp_${activeUsername}`);
       const savedEmail = localStorage.getItem(`luck_email_${activeUsername}`);

       setUser({ 
           id: activeUsername, 
           username: activeUsername,
           role: (savedRole as any) || 'admin',
           plan: (savedPlan as any) || 'free',
           avatarUrl: savedAvatar || undefined,
           whatsapp: savedWhatsapp || undefined,
           email: savedEmail || undefined
       });
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    setAssigneeFilter(null);
  }, [currentProjectId]);

  useEffect(() => {
    if (toast?.visible) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error' | 'automation' | 'whatsapp' | 'schedule' = 'success') => {
    setToast({ visible: true, message, type });
  };

  const loadMockData = () => {
    console.log("Loading Mock Data for Offline Mode");
    setIsOfflineMode(true);
    setSystemTags(PRESET_TAGS);
    setProjects(MOCK_PROJECTS);
    setTasks(MOCK_TASKS);
    setCurrentProjectId(MOCK_PROJECTS[0].id);
  };

  const fetchData = async () => {
      if (!user) return;
      setIsLoading(true);
      setIsOfflineMode(false);
      
      try {
          // A. Sync Profile
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('username', user.username)
              .single();
              
            if (!profileError && profileData) {
                const newRole = profileData.role || user.role;
                const newPlan = profileData.plan || user.plan || 'free';
                const newEmail = profileData.email || user.email;
                const newWhatsapp = profileData.whatsapp || user.whatsapp;
                const newAvatar = profileData.avatar_url || user.avatarUrl;

                // Check for changes to avoid infinite loop / screen flickering
                if (
                    user.role !== newRole ||
                    user.plan !== newPlan ||
                    user.email !== newEmail ||
                    user.whatsapp !== newWhatsapp ||
                    user.avatarUrl !== newAvatar
                ) {
                    const syncedUser: User = {
                        ...user,
                        role: newRole,
                        plan: newPlan,
                        email: newEmail,
                        whatsapp: newWhatsapp,
                        avatarUrl: newAvatar,
                    };
                    setUser(syncedUser);
                }
            }
          } catch (e) {
            console.warn("Profile sync skipped or failed (table may not exist yet)");
          }

          // B. Fetch Tags (More resilient)
          const { data: tagsData, error: tagsError } = await supabase.from('tags').select('*');
          if (!tagsError && tagsData && tagsData.length > 0) {
              setSystemTags(tagsData);
          } else {
              setSystemTags(PRESET_TAGS);
          }

          // C. Fetch Projects
          const { data: allProjects, error: projectsError } = await supabase.from('projects').select('*');
          
          if (projectsError) {
              // DETECT NETWORK/FETCH ERRORS GRACEFULLY
              const msg = projectsError.message?.toLowerCase() || '';
              if (msg.includes('fetch') || msg.includes('network') || msg.includes('connection')) {
                  console.warn("Supabase unreachable (Failed to fetch). Switching to offline mode.");
                  loadMockData();
                  showToast("Modo Offline: Servidor indisponível.", "error");
                  return; // Stop here, use mock data
              }

              // Other API errors
              throw new Error(`Projects API Error: ${projectsError.message}`);
          }

          if (allProjects) {
            const myProjects = allProjects.filter((p: any) => 
                p.owner_id === user.id || 
                (Array.isArray(p.shared_with) && p.shared_with.includes(user.username))
            ).map((p: any) => ({
                id: p.id,
                name: p.name,
                ownerId: p.owner_id,
                sharedWith: Array.isArray(p.shared_with) ? p.shared_with : []
            }));

            setProjects(myProjects);

            if (myProjects.length > 0) {
                 let activeProject = currentProjectId;
                 if (!activeProject || !myProjects.find(p => p.id === activeProject)) {
                     activeProject = myProjects[0].id;
                     setCurrentProjectId(activeProject);
                 }
                 
                 // D. Fetch Tasks
                 const projectIds = myProjects.map(p => p.id);
                 const { data: tasksData, error: tasksError } = await supabase
                    .from('tasks')
                    .select('*')
                    .in('project_id', projectIds);
                
                if (!tasksError && tasksData) {
                    const mappedTasks: Task[] = tasksData.map((t: any, index: number) => ({
                        id: t.id,
                        title: t.title,
                        description: t.description || '',
                        clientName: t.client_name,
                        clientSegment: t.client_segment,
                        objective: t.objective,
                        websiteUrl: t.website_url,
                        projectId: t.project_id,
                        status: t.status,
                        priority: t.priority,
                        progress: t.progress || 0,
                        tags: t.tags || [],
                        attachments: t.attachments || [],
                        checklist: t.checklist || [],
                        dueDate: t.due_date,
                        assignee: t.assignee,
                        createdAt: t.created_at,
                        position: t.position || (index + 1) * 1000,
                        coverUrl: t.cover_url,
                        scheduledAt: t.scheduled_at
                    }));
                    setTasks(mappedTasks);
                }

                // E. Fetch Pipelines
                try {
                    const { data: pipelinesData, error: pipelinesError } = await supabase
                        .from('pipelines')
                        .select('*');
                    
                    if (!pipelinesError && pipelinesData) {
                        setPipelines(pipelinesData);
                        if (pipelinesData.length > 0 && !currentPipelineId) {
                            setCurrentPipelineId(pipelinesData[0].id);
                        }
                    }
                } catch (e) {
                    console.warn("Pipelines fetch failed (table may not exist yet)");
                }
            } else {
                setTasks([]);
                setCurrentProjectId(null);
            }
          }

      } catch (error: any) {
          const errorMessage = error.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
          console.error("Fetch Data Critical Error:", errorMessage);
          
          // Se for erro de conexão ou permissão, entra no modo local
          loadMockData();
          showToast(`Erro crítico. Usando modo local.`, "error");
      } finally {
          setIsLoading(false);
      }
  };

  const handleLogin = (loggedInUser: User) => {
    const savedRole = localStorage.getItem(`luck_role_${loggedInUser.username}`);
    const savedPlan = localStorage.getItem(`luck_plan_${loggedInUser.username}`);
    const savedAvatar = localStorage.getItem(`luck_avatar_${loggedInUser.username}`);
    const savedWhatsapp = localStorage.getItem(`luck_whatsapp_${loggedInUser.username}`);
    const savedEmail = localStorage.getItem(`luck_email_${loggedInUser.username}`);

    const userWithRole = { 
        ...loggedInUser, 
        role: (savedRole as any) || loggedInUser.role || 'admin',
        plan: (savedPlan as any) || loggedInUser.plan || 'free',
        avatarUrl: savedAvatar || loggedInUser.avatarUrl,
        whatsapp: savedWhatsapp || loggedInUser.whatsapp,
        email: savedEmail || loggedInUser.email
    };

    setUser(userWithRole);
    localStorage.setItem('luck_active_user', userWithRole.username);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('luck_active_user');
    setCurrentProjectId(null);
    setProjects([]);
    setTasks([]);
    setIsOfflineMode(false);
  };

  const handleUpdateProfile = async (updates: Partial<User> & { password?: string }) => {
      if (!user) return;
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      
      if (updates.role) localStorage.setItem(`luck_role_${user.username}`, updates.role);
      if (updates.plan) localStorage.setItem(`luck_plan_${user.username}`, updates.plan);
      if (updates.avatarUrl !== undefined) localStorage.setItem(`luck_avatar_${user.username}`, updates.avatarUrl);
      if (updates.whatsapp !== undefined) localStorage.setItem(`luck_whatsapp_${user.username}`, updates.whatsapp);
      if (updates.email !== undefined) localStorage.setItem(`luck_email_${user.username}`, updates.email);
      
      if (!isOfflineMode) {
          const dbUpdates: any = {};
          if (updates.password) dbUpdates.password = updates.password;
          if (updates.role) dbUpdates.role = updates.role;
          if (updates.plan) dbUpdates.plan = updates.plan;
          if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
          if (updates.whatsapp !== undefined) dbUpdates.whatsapp = updates.whatsapp;
          if (updates.email !== undefined) dbUpdates.email = updates.email;
          
          try {
              const { error } = await supabase.from('profiles').update(dbUpdates).eq('username', user.username);
              if (error) throw error;
              showToast(`Perfil sincronizado!`);
          } catch (err: any) {
              console.error("Profile Update Error:", err);
              showToast("Salvo localmente (Erro no DB)", "error");
          }
      }
  };

  const handleUpgradePlan = async (plan: 'premium') => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      handleUpdateProfile({ plan });
      showToast(`Plano ${plan.toUpperCase()} ativado!`, 'success');
      setIsSubscriptionModalOpen(false);
  };

  const handleCancelPlan = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    handleUpdateProfile({ plan: 'free' });
    showToast("Assinatura cancelada.", "success");
    setIsSubscriptionModalOpen(false);
  };

  const handleManageTags = async (action: 'add' | 'edit' | 'delete', tag: Tag, oldText?: string) => {
      if (user?.role === 'viewer') {
          showToast("Ação bloqueada", "error");
          return;
      }

      let newTags = [...systemTags];
      if (action === 'add') {
         if (!newTags.find(t => t.text === tag.text)) newTags.push(tag);
      } else if (action === 'edit' && oldText) {
         newTags = newTags.map(t => t.text === oldText ? tag : t);
         setTasks(prev => prev.map(t => ({...t, tags: t.tags.map(tt => tt.text === oldText ? tag : tt)})));
      } else if (action === 'delete') {
         newTags = newTags.filter(t => t.text !== tag.text);
      }
      setSystemTags(newTags);

      if (isOfflineMode) return;

      try {
        if (action === 'add') await supabase.from('tags').insert(tag);
        else if (action === 'edit' && oldText) await supabase.from('tags').update(tag).eq('text', oldText);
        else if (action === 'delete') await supabase.from('tags').delete().eq('text', tag.text);
      } catch (e) {
          console.error("Tag management error", e);
      }
  };

  const handleCreateProject = async (name: string) => {
    if (!user || user.role === 'viewer') return;
    const newId = crypto.randomUUID();
    const mappedProject: Project = { id: newId, name, ownerId: user.id, sharedWith: [] };
    setProjects([...projects, mappedProject]);
    setCurrentProjectId(newId);
    showToast("Projeto criado!");
    
    if (isOfflineMode) return;
    await supabase.from('projects').insert({ id: newId, name, owner_id: user.id });
  };

  const handleShareProject = async (usernameInput: string, taskId?: string) => {
    if (!projectToShare || user?.role === 'viewer') return;
    const username = usernameInput.trim();
    if (!username) return;
    
    let updatedSharedWith = projectToShare.sharedWith || [];
    if (!updatedSharedWith.includes(username)) {
        updatedSharedWith = [...updatedSharedWith, username];
        setProjects(projects.map(p => p.id === projectToShare.id ? { ...p, sharedWith: updatedSharedWith } : p));
    }
    if (taskId) setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assignee: username } : t));
    showToast(`Compartilhado com ${username}`);

    if (isOfflineMode) return;
    await supabase.from('projects').update({ shared_with: updatedSharedWith }).eq('id', projectToShare.id);
    if (taskId) await supabase.from('tasks').update({ assignee: username }).eq('id', taskId);
  };

  const handleReorderProjects = (reorderedProjects: Project[]) => setProjects(reorderedProjects);

  // --- REFACTORED STATUS LOGIC ---
  const handleSaveTask = async (taskData: Task) => {
    if (!user || user.role === 'viewer') return;
    
    let processedTask = { ...taskData };
    
    // Logic to sync Status <-> Progress
    const originalTask = selectedTask || { status: 'backlog', progress: 0 } as Task; 
    
    const statusChanged = processedTask.status !== originalTask.status;
    const progressChanged = processedTask.progress !== originalTask.progress;
    
    // 1. If Status Changed explicitly, update progress to match defaults
    if (statusChanged) {
        if (processedTask.status === 'done') {
            processedTask.progress = 100;
        } else if (processedTask.status === 'review') {
            if (processedTask.progress < 60) processedTask.progress = 75;
            else if (processedTask.progress === 100) processedTask.progress = 90;
        } else if (processedTask.status === 'inprogress') {
             if (processedTask.progress === 0) processedTask.progress = 25;
             else if (processedTask.progress === 100) processedTask.progress = 90;
        } else if (processedTask.status === 'todo' || processedTask.status === 'backlog') {
             processedTask.progress = 0;
        }
    } 
    // 2. If Progress changed manually, update status
    else if (progressChanged) {
        if (processedTask.progress === 100) processedTask.status = 'done';
        else if (processedTask.progress > 60) processedTask.status = 'review';
        else if (processedTask.progress > 0) processedTask.status = 'inprogress';
        else processedTask.status = 'todo';
    }

    if (selectedTask) setTasks(tasks.map(t => t.id === processedTask.id ? processedTask : t));
    else setTasks([...tasks, processedTask]);
    
    setIsTaskModalOpen(false);

    if (isOfflineMode) return;
    const dbTask = {
        id: processedTask.id, project_id: processedTask.projectId, title: processedTask.title,
        description: processedTask.description, status: processedTask.status, priority: processedTask.priority,
        progress: processedTask.progress, tags: processedTask.tags, checklist: processedTask.checklist,
        due_date: processedTask.dueDate, assignee: processedTask.assignee, position: processedTask.position
    };
    await supabase.from('tasks').upsert(dbTask);
  };

  const handleQuickAdd = async () => {
      if (!quickAddTitle.trim() || !currentProjectId || !quickAddColumn || user?.role === 'viewer') return;
      
      // Smart default progress based on column
      let initialProgress = 0;
      if (quickAddColumn === 'done') initialProgress = 100;
      else if (quickAddColumn === 'review') initialProgress = 75;
      else if (quickAddColumn === 'inprogress') initialProgress = 25;

      const newTask: Task = {
        id: crypto.randomUUID(), title: quickAddTitle, description: '', status: quickAddColumn,
        priority: 'Medium', progress: initialProgress, tags: [], attachments: [], checklist: [],
        projectId: currentProjectId, createdAt: new Date().toISOString(), position: Date.now()
      };
      
      setTasks([...tasks, newTask]);
      setQuickAddTitle(''); setQuickAddColumn(null);
      if (isOfflineMode) return;
      await supabase.from('tasks').insert({
          id: newTask.id, project_id: newTask.projectId, title: newTask.title,
          status: newTask.status, priority: newTask.priority, progress: newTask.progress, 
          position: newTask.position
      });
  };

  const handleDeleteTask = async (id: string) => {
    if (user?.role !== 'admin') return;
    setTasks(tasks.filter(t => t.id !== id));
    setIsTaskModalOpen(false);
    if (!isOfflineMode) await supabase.from('tasks').delete().eq('id', id);
  };

  const toggleColumnVisibility = (status: Status) => {
      setHiddenColumns(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
  };

  const handleTaskDrop = async (draggedTaskId: string, targetId: string | null, targetStatus: Status, positionOnTarget: 'before' | 'after' = 'after') => {
      if (!currentProjectId || user?.role === 'viewer') return;
      const draggedTask = tasks.find(t => t.id === draggedTaskId);
      if (!draggedTask) return;
      
      let updatedTask = { ...draggedTask, status: targetStatus };

      // Sync Progress automatically when dropping to new column
      if (draggedTask.status !== targetStatus) {
          if (targetStatus === 'done') updatedTask.progress = 100;
          else if (targetStatus === 'review') updatedTask.progress = 75;
          else if (targetStatus === 'inprogress' && updatedTask.progress === 0) updatedTask.progress = 25;
          else if (targetStatus === 'todo' || targetStatus === 'backlog') updatedTask.progress = 0;
          
          if (targetStatus !== 'done' && updatedTask.progress === 100) updatedTask.progress = 90;
      }
      
      const otherTasks = tasks.filter(t => t.id !== draggedTaskId);
      const targetColTasks = otherTasks.filter(t => t.status === targetStatus && t.projectId === currentProjectId).sort((a,b) => (a.position || 0) - (b.position || 0));
      
      let newPos = Date.now();
      if (targetId) {
          const idx = targetColTasks.findIndex(t => t.id === targetId);
          if (idx !== -1) {
              const targetP = targetColTasks[idx].position || 0;
              if (positionOnTarget === 'before') {
                  const prevP = targetColTasks[idx-1]?.position || 0;
                  newPos = (targetP + prevP) / 2 || targetP - 10;
              } else {
                  const nextP = targetColTasks[idx+1]?.position || targetP + 100;
                  newPos = (targetP + nextP) / 2;
              }
          }
      }
      
      setTasks([...otherTasks, { ...updatedTask, position: newPos }]);
      
      if (!isOfflineMode) {
          await supabase.from('tasks').update({ 
              status: updatedTask.status, 
              progress: updatedTask.progress, 
              position: newPos 
          }).eq('id', draggedTaskId);
      }
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  if (!user) return <AuthScreen onLogin={handleLogin} />;

  const currentProject = projects.find(p => p.id === currentProjectId);
  const contextTasks = tasks.filter(t => t.projectId === currentProjectId);
  const uniqueAssignees = Array.from(new Set(contextTasks.map(t => t.assignee).filter(Boolean) as string[]));
  const filteredTasks = assigneeFilter ? contextTasks.filter(t => t.assignee === assigneeFilter) : contextTasks;

  return (
    <div className="flex h-screen w-screen bg-nexus-bg text-nexus-text font-sans overflow-hidden transition-colors duration-300">
      <Sidebar 
        projects={projects} currentProjectId={currentProjectId} setProjectId={setCurrentProjectId}
        onNewProject={() => { setProjectModalMode('create'); setIsProjectModalOpen(true); }}
        onShareProject={(p) => { setProjectToShare(p); setProjectModalMode('share'); setIsProjectModalOpen(true); }}
        onReorderProjects={handleReorderProjects} user={user} onLogout={handleLogout}
        isDark={isDark} toggleTheme={toggleTheme} currentView={currentView} setView={setCurrentView}
        onOpenProfile={() => setIsProfileModalOpen(true)} onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 relative">
        {isOfflineMode && (
             <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-600 text-[10px] font-bold uppercase py-1 text-center flex items-center justify-center gap-2">
                 <AlertTriangle size={10} /> Modo Local Habilitado (Sincronização Indisponível)
             </div>
        )}

        {isLoading && (
            <div className="absolute inset-0 bg-nexus-bg/80 z-50 flex items-center justify-center backdrop-blur-sm">
                <Loader2 size={32} className="animate-spin text-nexus-cobalt" />
            </div>
        )}

        {currentView !== 'monitoring' && (
            <MetricsHeader 
                tasks={filteredTasks} project={currentProject} availableAssignees={uniqueAssignees}
                currentFilter={assigneeFilter} onFilterChange={setAssigneeFilter}
                hiddenColumns={hiddenColumns} onToggleColumn={toggleColumnVisibility}
                currentView={currentView} onViewChange={setCurrentView}
            />
        )}

        <main className="flex-1 overflow-x-auto overflow-y-hidden flex flex-col">
           {currentView === 'monitoring' ? (
             <MonitoringDashboard tasks={tasks} projects={projects} initialProjectId={currentProjectId} />
           ) : currentView === 'funnel' ? (
             currentPipelineId ? (
               <SalesFunnel pipelineId={currentPipelineId} userId={user.id} />
             ) : (
               <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-nexus-muted">
                 <AlertTriangle className="w-12 h-12 opacity-20" />
                 <p className="font-medium">Nenhum funil de vendas configurado.</p>
                 <button 
                   onClick={() => setIsProjectModalOpen(true)}
                   className="px-4 py-2 bg-nexus-accent text-black rounded-lg font-bold text-sm"
                 >
                   Configurar Primeiro Funil
                 </button>
               </div>
             )
           ) : currentView === 'list' ? (
              <div className="flex-1 overflow-y-auto">
                 <ListView tasks={filteredTasks} onEdit={(t) => { setSelectedTask(t); setIsTaskModalOpen(true); }} onDelete={handleDeleteTask} />
              </div>
           ) : currentView === 'table' ? (
              <div className="flex-1 overflow-y-auto">
                 <TableView tasks={filteredTasks} onEdit={(t) => { setSelectedTask(t); setIsTaskModalOpen(true); }} onDelete={handleDeleteTask} />
              </div>
           ) : currentProjectId ? (
             <div className="flex-1 p-6 overflow-x-auto">
                <div className="flex h-full gap-4 min-w-[1000px]">
                    {STATUS_COLUMNS.filter(col => !hiddenColumns.includes(col.id)).map(col => {
                        const colTasks = filteredTasks.filter(t => t.status === col.id).sort((a, b) => (a.position || 0) - (b.position || 0));
                        return (
                            <div key={col.id} className="flex-1 min-w-[280px] flex flex-col h-full rounded-lg bg-nexus-bg/50" onDragOver={e => e.preventDefault()} onDrop={e => handleTaskDrop(e.dataTransfer.getData('taskId'), null, col.id)}>
                                <div className="flex items-center justify-between mb-2 pb-2 border-b border-nexus-border px-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold uppercase tracking-widest text-nexus-text">{col.label}</span>
                                        <span className="text-[10px] text-nexus-muted bg-nexus-card px-1.5 py-0.5 rounded border border-nexus-border">{colTasks.length}</span>
                                    </div>
                                    <button onClick={() => toggleColumnVisibility(col.id)} className="text-nexus-muted hover:text-nexus-text"><EyeOff size={14} /></button>
                                </div>
                                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                    {colTasks.map(task => (
                                        <TaskCard key={task.id} task={task} onEdit={t => { setSelectedTask(t); setIsTaskModalOpen(true); }} onDelete={handleDeleteTask} onDropOnTask={(d, t, p) => handleTaskDrop(d, t, col.id, p)} />
                                    ))}
                                    {quickAddColumn === col.id ? (
                                        <div className="bg-nexus-card border border-nexus-border rounded p-2 mb-3">
                                            <textarea autoFocus value={quickAddTitle} onChange={e => setQuickAddTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleQuickAdd())} placeholder="Título do cartão..." className="w-full bg-transparent text-sm resize-none outline-none mb-2 text-nexus-text h-16" />
                                            <div className="flex gap-2">
                                                <button onClick={handleQuickAdd} className="px-3 py-1 bg-nexus-cobalt text-white text-xs font-bold rounded">Add</button>
                                                <button onClick={() => setQuickAddColumn(null)} className="p-1 text-nexus-muted"><X size={16} /></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button onClick={() => setQuickAddColumn(col.id)} className="w-full flex items-center gap-2 p-2 rounded hover:bg-nexus-border/50 text-nexus-muted text-xs font-medium mt-1">
                                            <Plus size={14} /> Adicionar cartão
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
             </div>
           ) : (
             <div className="flex items-center justify-center h-full text-nexus-muted">
                 Selecione ou crie um projeto para começar.
             </div>
           )}
        </main>
      </div>

      <TaskModal 
        isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} task={selectedTask}
        onSave={handleSaveTask} onDelete={handleDeleteTask} currentProjectId={currentProjectId || ''}
        availableTags={systemTags} onManageTags={handleManageTags} userRole={user.role}
      />

      <ProjectModal 
        isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} onSave={handleCreateProject}
        onShare={handleShareProject} mode={projectModalMode} projectToShare={projectToShare} tasks={contextTasks}
      />

      <ProfileModal 
        isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} user={user}
        onUpdateProfile={handleUpdateProfile} onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
      />

      <SubscriptionModal
        isOpen={isSubscriptionModalOpen} onClose={() => setIsSubscriptionModalOpen(false)} currentUser={user}
        onUpgrade={handleUpgradePlan} onCancelPlan={handleCancelPlan}
      />

      {toast?.visible && (
        <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-5 duration-300">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-md shadow-lg border backdrop-blur-md ${
            toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-nexus-cobalt/10 border-nexus-cobalt/20 text-nexus-cobalt'
          }`}>
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={() => setToast(null)}><X size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
