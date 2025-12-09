
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { MetricsHeader } from './components/MetricsHeader';
import { TaskCard } from './components/TaskCard';
import { TaskModal } from './components/TaskModal';
import { AuthScreen } from './components/AuthScreen';
import { ProjectModal } from './components/ProjectModal';
import { MonitoringDashboard } from './components/MonitoringDashboard';
import { ProfileModal } from './components/ProfileModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { ListView, TableView } from './components/ProjectViews';
import { Task, Status, User, Project, Tag, ViewMode } from './types';
import { STATUS_COLUMNS, PRESET_TAGS } from './constants';
import { Plus, X, Loader2, CheckCircle2, WifiOff, EyeOff, Zap, MessageCircle, Clock } from 'lucide-react';
import { supabase } from './supabaseClient';

// --- MOCK DATA FOR OFFLINE MODE ---
// Fixed positions to prevent initial collision
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
    { id: 't5', title: 'Otimização de Banco de Dados', description: 'Indexação de tabelas críticas', status: 'review', priority: 'Medium', progress: 90, tags: [{text: 'Limpeza/ETL', color: '#06b6d4'}], attachments: [], checklist: [], projectId: 'proj-1', createdAt: new Date(Date.now() - 2000).toISOString(), assignee: 'demo', position: 4000 },
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  
  // Data State
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
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
  
  // Column Visibility State
  const [hiddenColumns, setHiddenColumns] = useState<Status[]>([]);

  // Filter State
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);

  // Toast State
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'automation' | 'whatsapp' | 'schedule' } | null>(null);

  // Quick Add State
  const [quickAddColumn, setQuickAddColumn] = useState<Status | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState('');

  // 1. Check for persisted user session and data
  useEffect(() => {
    const activeUsername = localStorage.getItem('luck_active_user');

    if (activeUsername) {
       // Retrieve user-specific data from LocalStorage for speed, but Supabase sync happens in AuthScreen on login usually.
       // Here we just restore session.
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
           // Password is NOT stored in localStorage for security, fetched on load
       });
    }
  }, []);

  // 2. Fetch Data from Supabase when user is logged in
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Reset filter when project changes
  useEffect(() => {
    setAssigneeFilter(null);
  }, [currentProjectId]);

  // Toast Timer
  useEffect(() => {
    if (toast?.visible) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000); // Slightly longer for automation reading
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
          // 0. Sync Profile Data (Ensure we have the latest email/password columns)
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('username', user.username)
            .single();
            
          if (!profileError && profileData) {
              const syncedUser: User = {
                  ...user,
                  role: profileData.role || user.role,
                  plan: profileData.plan || user.plan || 'free', // Sync Plan
                  email: profileData.email || user.email,
                  whatsapp: profileData.whatsapp || user.whatsapp,
                  avatarUrl: profileData.avatar_url || user.avatarUrl,
                  password: profileData.password || user.password // IMPORTANT: Sync password so state doesn't revert
              };
              // Only update state if something changed to avoid loop (simple check)
              // We check specific fields to be safe
              if (
                  syncedUser.role !== user.role || 
                  syncedUser.plan !== user.plan ||
                  syncedUser.email !== user.email || 
                  syncedUser.password !== user.password ||
                  syncedUser.avatarUrl !== user.avatarUrl
              ) {
                  setUser(syncedUser);
                  // Update local storage to match DB
                  if (syncedUser.email) localStorage.setItem(`luck_email_${user.username}`, syncedUser.email);
                  if (syncedUser.whatsapp) localStorage.setItem(`luck_whatsapp_${user.username}`, syncedUser.whatsapp);
                  if (syncedUser.role) localStorage.setItem(`luck_role_${user.username}`, syncedUser.role);
                  if (syncedUser.plan) localStorage.setItem(`luck_plan_${user.username}`, syncedUser.plan);
                  if (syncedUser.avatarUrl) localStorage.setItem(`luck_avatar_${user.username}`, syncedUser.avatarUrl);
              }
          }

          // A. Fetch Tags
          const { data: tagsData, error: tagsError } = await supabase.from('tags').select('*');
          
          if (tagsError) throw tagsError; // Force catch if DB fails

          if (tagsData && tagsData.length > 0) {
              setSystemTags(tagsData);
          } else {
             await supabase.from('tags').insert(PRESET_TAGS).then(({error}) => {
                 if(!error) setSystemTags(PRESET_TAGS);
                 else setSystemTags(PRESET_TAGS);
             }); 
          }

          // B. Fetch Projects
          const { data: allProjects, error: projectsError } = await supabase.from('projects').select('*');
          
          if (projectsError) throw projectsError;

          if (allProjects) {
            // Robust check for string array containment
            const myProjects = allProjects.filter((p: any) => 
                p.owner_id === user.id || 
                (Array.isArray(p.shared_with) && p.shared_with.includes(user.username))
            ).map((p: any) => ({
                id: p.id,
                name: p.name,
                ownerId: p.owner_id,
                sharedWith: Array.isArray(p.shared_with) 
                    ? p.shared_with.filter((s: any) => typeof s === 'string') 
                    : []
            }));

            setProjects(myProjects);

            if (myProjects.length > 0) {
                 let activeProject = currentProjectId;
                 if (!activeProject || !myProjects.find(p => p.id === activeProject)) {
                     activeProject = myProjects[0].id;
                     setCurrentProjectId(activeProject);
                 }
                 
                 // C. Fetch Tasks
                 const projectIds = myProjects.map(p => p.id);
                 const { data: tasksData, error: tasksError } = await supabase
                    .from('tasks')
                    .select('*')
                    .in('project_id', projectIds);
                
                if (tasksError) throw tasksError;
                
                if (tasksData) {
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
                        assignee: typeof t.assignee === 'string' ? t.assignee : undefined,
                        createdAt: t.created_at,
                        // Ensure distinct positions on load if missing or 0
                        position: t.position || (index + 1) * 1000,
                        coverUrl: t.cover_url,
                        scheduledAt: t.scheduled_at
                    }));
                    setTasks(mappedTasks);
                }
            } else {
                setTasks([]);
                setCurrentProjectId(null);
            }
          }

      } catch (error) {
          console.error("Error fetching data, falling back to local mode:", error);
          loadMockData();
          showToast("Modo Offline: Dados de exemplo carregados", "error");
      } finally {
          setIsLoading(false);
      }
  };

  const handleLogin = (loggedInUser: User) => {
    // Check for saved data specific to this user
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
        email: savedEmail || loggedInUser.email,
        password: loggedInUser.password // Keep password if passed (e.g. from fetch)
    };

    setUser(userWithRole);
    localStorage.setItem('luck_active_user', userWithRole.username);
    
    // Ensure we save the role/plan if it was passed during registration/login to keep it consistent
    if (userWithRole.role) localStorage.setItem(`luck_role_${userWithRole.username}`, userWithRole.role);
    if (userWithRole.plan) localStorage.setItem(`luck_plan_${userWithRole.username}`, userWithRole.plan);
    if (userWithRole.whatsapp) localStorage.setItem(`luck_whatsapp_${userWithRole.username}`, userWithRole.whatsapp);
    if (userWithRole.avatarUrl) localStorage.setItem(`luck_avatar_${userWithRole.username}`, userWithRole.avatarUrl);
    if (userWithRole.email) localStorage.setItem(`luck_email_${userWithRole.username}`, userWithRole.email);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('luck_active_user');
    // NOTE: We do NOT remove luck_role_* or luck_avatar_* so they persist for next login
    setCurrentProjectId(null);
    setProjects([]);
    setTasks([]);
    setIsOfflineMode(false);
  };

  const handleUpdateProfile = async (updates: Partial<User> & { password?: string }) => {
      if (!user) return;
      
      // 1. Update Local State (Immediate Feedback & Persistence in Session)
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      
      // 2. Persist to local storage with user-specific keys
      if (updates.role) localStorage.setItem(`luck_role_${user.username}`, updates.role);
      if (updates.plan) localStorage.setItem(`luck_plan_${user.username}`, updates.plan);
      if (updates.avatarUrl !== undefined) localStorage.setItem(`luck_avatar_${user.username}`, updates.avatarUrl);
      if (updates.whatsapp !== undefined) localStorage.setItem(`luck_whatsapp_${user.username}`, updates.whatsapp);
      if (updates.email !== undefined) localStorage.setItem(`luck_email_${user.username}`, updates.email);
      
      // 3. Persist to Supabase
      if (!isOfflineMode) {
          const dbUpdates: any = {};
          
          // Clearly map fields
          if (updates.password) dbUpdates.password = updates.password;
          if (updates.role) dbUpdates.role = updates.role;
          if (updates.plan) dbUpdates.plan = updates.plan;
          if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
          if (updates.whatsapp !== undefined) dbUpdates.whatsapp = updates.whatsapp;
          if (updates.email !== undefined) dbUpdates.email = updates.email;
          
          if (Object.keys(dbUpdates).length > 0) {
            try {
                const { error } = await supabase
                    .from('profiles')
                    .update(dbUpdates)
                    .eq('username', user.username);
                
                if (error) throw error;
                showToast(`Perfil sincronizado com o servidor!`);
            } catch (err: any) {
                const errorMessage = err.message || JSON.stringify(err);
                const isSchemaError = err.code === '42703' || 
                                     (errorMessage && (errorMessage.includes('column') || errorMessage.includes('schema') || errorMessage.includes('role')));

                if (isSchemaError) {
                    console.warn("Schema mismatch. Missing columns in DB.");
                    // Attempt fallback save for fields we know usually exist
                    try {
                        const safeUpdates: any = {};
                        if (dbUpdates.avatar_url) safeUpdates.avatar_url = dbUpdates.avatar_url;
                        if (Object.keys(safeUpdates).length > 0) {
                             await supabase.from('profiles').update(safeUpdates).eq('username', user.username);
                        }
                        showToast("Salvo localmente! (DB: Colunas ausentes)", "success");
                        console.log("SQL NECESSÁRIO: ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text; ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text; ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan text;");
                        return;
                    } catch (retryErr) { console.error(retryErr); }
                }
                showToast(`Erro ao salvar no banco: ${errorMessage}`, "error");
            }
          }
      } else {
          showToast(`Perfil salvo (Modo Offline)!`);
      }
  };

  const handleUpgradePlan = async (plan: 'silver' | 'bronze' | 'gold') => {
      // Simulate Payment Process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update User
      handleUpdateProfile({ plan });
      showToast(`Plano ${plan.toUpperCase()} ativado com sucesso!`, 'success');
      setIsSubscriptionModalOpen(false);
  };

  const handleCancelPlan = async () => {
    // Simulate API/Payment cancellation
    // setIsLoading(true); // You could enable a loading state if desired
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    handleUpdateProfile({ plan: 'free' });
    showToast("Assinatura cancelada com sucesso. Você voltou ao plano Gratuito.", "success");
    setIsSubscriptionModalOpen(false);
  };

  const handleManageTags = async (action: 'add' | 'edit' | 'delete', tag: Tag, oldText?: string) => {
      if (user?.role === 'viewer') {
          showToast("Visualizadores não podem gerenciar etiquetas", "error");
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
        if (action === 'add') {
           await supabase.from('tags').insert(tag);
        } else if (action === 'edit' && oldText) {
            await supabase.from('tags').update({ text: tag.text, color: tag.color }).eq('text', oldText);
        } else if (action === 'delete') {
            await supabase.from('tags').delete().eq('text', tag.text);
        }
      } catch (e) {
          console.error("Error managing tags", e);
      }
  };

  const handleCreateProject = async (name: string) => {
    if (!user) return;
    if (user.role === 'viewer') {
        showToast("Visualizadores não podem criar projetos", "error");
        return;
    }
    const newProject = {
      id: crypto.randomUUID(),
      name,
      owner_id: user.id,
      shared_with: []
    };
    
    const mappedProject: Project = {
        id: newProject.id,
        name: newProject.name,
        ownerId: newProject.owner_id,
        sharedWith: newProject.shared_with
    };
    setProjects([...projects, mappedProject]);
    setCurrentProjectId(mappedProject.id);
    setCurrentView('board');
    showToast("Projeto criado com sucesso!");
    
    if (isOfflineMode) return;

    const { error } = await supabase.from('projects').insert(newProject);
    if (error) console.error(error);
  };

  const handleShareProject = async (usernameInput: string, taskId?: string) => {
    if (!projectToShare) return;
    if (user?.role === 'viewer') {
        showToast("Permissão negada para compartilhar", "error");
        return;
    }
    
    // IMPORTANT: Trim whitespace to prevent matching errors
    const username = usernameInput.trim();

    if (!username) {
        showToast("Digite um nome de usuário válido", "error");
        return;
    }
    
    let updatedSharedWith = projectToShare.sharedWith || [];
    if (!updatedSharedWith.includes(username)) {
        updatedSharedWith = [...updatedSharedWith, username];
        const updatedProject = { ...projectToShare, sharedWith: updatedSharedWith };
        setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
    }
    if (taskId) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assignee: username } : t));
    }
    showToast(`Projeto compartilhado com ${username}`, "success");

    if (isOfflineMode) return;

    try {
        const { error: projectError } = await supabase
            .from('projects')
            .update({ shared_with: updatedSharedWith })
            .eq('id', projectToShare.id);
        if (projectError) throw projectError;
        
        if (taskId) {
            const { error: taskError } = await supabase
                .from('tasks')
                .update({ assignee: username })
                .eq('id', taskId);
            if (taskError) throw taskError;
        }
    } catch (error) {
        console.error(error);
        showToast("Erro ao sincronizar compartilhamento", "error");
    }
  };

  const handleReorderProjects = (reorderedProjects: Project[]) => {
     setProjects(reorderedProjects);
  };

  const QA_CHECKLIST_ITEMS = [
    "Descrição completa?",
    "Arquivos anexados?",
    "Responsável validou?"
  ];

  // --- AUTOMATION ENGINE ---
  const runAutomations = (task: Task): { task: Task, automationLog: string | null } => {
      let updatedTask = { ...task };
      let appliedRule = null;
      
      // 1. Progress Normalization Rule (User Request)
      // 0% = não iniciado (todo)
      // 1–60% = em andamento (inprogress)
      // 61–99% = quase concluído (review)
      // 100% = concluído (done)
      
      const p = updatedTask.progress;
      let targetStatus: Status | null = null;
      let ruleName = '';

      if (p === 0) {
          // If 0%, allow 'backlog' to stay 'backlog', otherwise 'todo'
          if (updatedTask.status !== 'backlog' && updatedTask.status !== 'todo') {
              targetStatus = 'todo';
              ruleName = '0% → Não Iniciado';
          }
      } else if (p > 0 && p <= 60) {
          if (updatedTask.status !== 'inprogress') {
              targetStatus = 'inprogress';
              ruleName = '1-60% → Em Andamento';
          }
      } else if (p > 60 && p < 100) {
          if (updatedTask.status !== 'review') {
              targetStatus = 'review';
              ruleName = '61-99% → Quase Concluído';
          }
      } else if (p === 100) {
          if (updatedTask.status !== 'done') {
              targetStatus = 'done';
              ruleName = '100% → Concluído';
          }
      }

      if (targetStatus) {
          updatedTask.status = targetStatus;
          appliedRule = ruleName;
      }

      // 2. QA Validation on 'done' (Blocker Rule - Overrides Progress Rule if needed)
      if (updatedTask.status === 'done') {
          const currentChecklist = updatedTask.checklist || [];
          const missingItems: any[] = [];
          
          QA_CHECKLIST_ITEMS.forEach(text => {
              if (!currentChecklist.some(i => i.text === text)) {
                  missingItems.push({
                      id: crypto.randomUUID(),
                      text: text,
                      checked: false
                  });
              }
          });

          if (missingItems.length > 0) {
              updatedTask.checklist = [...currentChecklist, ...missingItems];
              updatedTask.status = 'review'; // Fallback to review
              appliedRule = 'Bloqueio QA: Checklist Obrigatório gerado.';
          } else {
              const allQaChecked = updatedTask.checklist
                  .filter(i => QA_CHECKLIST_ITEMS.includes(i.text))
                  .every(i => i.checked);
              
              if (!allQaChecked) {
                  updatedTask.status = 'review'; // Fallback to review
                  appliedRule = 'Bloqueio QA: Complete a verificação.';
              }
          }
      }

      return { task: updatedTask, automationLog: appliedRule };
  };

  const handleSaveTask = async (taskData: Task) => {
    if (!user) return;
    if (user.role === 'viewer') {
        showToast("Visualizadores não podem editar tarefas", "error");
        return;
    }

    // Check for future schedule
    if (taskData.scheduledAt) {
        // Simple logic: if scheduledAt exists and is in future, we toast differently
        const scheduledTime = new Date(taskData.scheduledAt);
        if (scheduledTime > new Date()) {
             showToast(`Tarefa agendada para ${scheduledTime.toLocaleString()}`, 'schedule');
        }
    }

    // Run Automations BEFORE saving
    const { task: processedTask, automationLog } = runAutomations(taskData);
    
    // --- MANAGER NOTIFICATION LOGIC ---
    // Rule: If user is Editor (Manager) and edits a task assigned to someone else
    if (user.role === 'editor' && processedTask.assignee && processedTask.assignee !== user.username) {
        // Trigger notification simulation
        // In a real app, this would be a backend call sending the payload to WhatsApp API
        showToast(`Notificação enviada para ${processedTask.assignee} via WhatsApp`, 'whatsapp');
    }

    // Optimistic Update
    if (selectedTask) {
        setTasks(tasks.map(t => t.id === processedTask.id ? processedTask : t));
    } else {
        setTasks([...tasks, processedTask]);
    }
    setIsTaskModalOpen(false);

    if (automationLog) {
        showToast(`${automationLog}`, 'automation');
    }

    if (isOfflineMode) return;

    const dbTask = {
        id: processedTask.id,
        project_id: processedTask.projectId,
        title: processedTask.title,
        description: processedTask.description,
        client_name: processedTask.clientName,
        client_segment: processedTask.clientSegment,
        objective: processedTask.objective,
        website_url: processedTask.websiteUrl,
        status: processedTask.status,
        priority: processedTask.priority,
        progress: processedTask.progress,
        tags: processedTask.tags,
        attachments: processedTask.attachments,
        checklist: processedTask.checklist,
        due_date: processedTask.dueDate,
        assignee: processedTask.assignee,
        created_at: processedTask.createdAt,
        position: processedTask.position,
        cover_url: processedTask.coverUrl,
        scheduled_at: processedTask.scheduledAt
    };

    // Attempt to save fully
    const { error } = await supabase.from('tasks').upsert(dbTask);
    
    if (error) {
        console.error("Error saving task details:", error.message, error.code);
        
        if (error.code === '42703' || error.code === 'PGRST204' || error.message.includes('column') || error.message.includes('position')) {
            console.warn("Schema mismatch detected. Retrying with minimal fields...");
            const minimalTask = {
                id: dbTask.id,
                project_id: dbTask.project_id,
                title: dbTask.title,
                description: dbTask.description,
                status: dbTask.status,
                priority: dbTask.priority // Priority is required by DB (not null)
            };
            
            const { error: retryError } = await supabase.from('tasks').upsert(minimalTask);
            if (retryError) {
                console.error("Retry failed:", retryError.message);
                showToast(`Erro ao salvar no servidor: ${retryError.message} (Apenas local)`, "error");
            } else {
                showToast("Salvo! (Aviso: Colunas do DB pendentes)", "automation");
                console.log("SQL NECESSÁRIO: ALTER TABLE tasks ADD COLUMN IF NOT EXISTS scheduled_at text;");
            }
        } else {
            showToast(`Erro ao salvar: ${error.message}`, "error");
        }
    }
  };

  const handleQuickAdd = async () => {
      if (!quickAddTitle.trim() || !currentProjectId || !quickAddColumn) return;
      if (user?.role === 'viewer') {
          showToast("Visualizadores não podem adicionar tarefas", "error");
          return;
      }
      
      const newId = crypto.randomUUID();
      const columnTasks = tasks.filter(t => t.status === quickAddColumn && t.projectId === currentProjectId);
      const maxPos = columnTasks.length > 0 ? Math.max(...columnTasks.map(t => t.position || 0)) : 0;

      const newTask: Task = {
        id: newId,
        title: quickAddTitle,
        description: '',
        status: quickAddColumn,
        priority: 'Medium',
        progress: 0,
        tags: [],
        attachments: [],
        checklist: [],
        projectId: currentProjectId,
        createdAt: new Date().toISOString(),
        position: maxPos + 1000
      };
      
      setTasks([...tasks, newTask]);
      setQuickAddTitle('');
      setQuickAddColumn(null); 
      
      if (isOfflineMode) return;

      const dbTask = {
        id: newTask.id,
        project_id: newTask.projectId,
        title: newTask.title,
        status: newTask.status,
        priority: newTask.priority,
        created_at: newTask.createdAt,
        position: newTask.position
      };

      const { error } = await supabase.from('tasks').insert(dbTask);
      if (error) {
          console.error("Error quick adding:", error.message);
          // Try minimal insert if quick add fails due to position/etc
          if (error.code === '42703' || error.code === 'PGRST204') {
             const minimalDbTask = {
                 id: dbTask.id,
                 project_id: dbTask.project_id,
                 title: dbTask.title,
                 status: dbTask.status,
                 priority: dbTask.priority // Priority is required
             };
             await supabase.from('tasks').insert(minimalDbTask);
             showToast("Criado (Fallback - Coluna position ausente)", "automation");
          } else {
             showToast("Erro ao criar cartão rápido", "error");
          }
      }
  };

  const handleDeleteTask = async (id: string) => {
    if (user?.role !== 'admin') {
        showToast("Apenas administradores podem excluir tarefas", "error");
        return;
    }

    setTasks(tasks.filter(t => t.id !== id));
    setIsTaskModalOpen(false);

    if (isOfflineMode) return;
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) console.error(error);
  };

  const toggleColumnVisibility = (status: Status) => {
      setHiddenColumns(prev => 
          prev.includes(status) 
          ? prev.filter(s => s !== status) 
          : [...prev, status]
      );
  };

  // --- DRAG AND DROP REORDERING ---
  const handleTaskDrop = async (draggedTaskId: string, targetId: string | null, targetStatus: Status, positionOnTarget: 'before' | 'after' = 'after') => {
      if (!currentProjectId) return;
      if (user?.role === 'viewer') {
          showToast("Modo Visualização: Movimentação bloqueada", "error");
          return;
      }

      const draggedTask = tasks.find(t => t.id === draggedTaskId);
      if (!draggedTask) return;

      // Create temp task with new status to check automations
      const tempTaskForAutomation = { ...draggedTask, status: targetStatus };
      const { task: automatedTask, automationLog } = runAutomations(tempTaskForAutomation);
      
      // If automation changed the status (e.g. from what we dropped it to something else), respect automation
      const finalStatus = automatedTask.status;

      // 1. Clean list excluding dragged task
      const otherTasks = tasks.filter(t => t.id !== draggedTaskId);

      // 2. Get target column tasks sorted strictly
      const targetColumnTasks = otherTasks
            .filter(t => t.projectId === currentProjectId && t.status === finalStatus)
            .sort((a, b) => {
                const posA = a.position || 0;
                const posB = b.position || 0;
                if (posA !== posB) return posA - posB;
                return a.createdAt.localeCompare(b.createdAt);
            });

      let newPosition = 0;

      if (!targetId && finalStatus === targetStatus) {
           // Normal drop (no automation override or automation matches drop target)
          const lastTask = targetColumnTasks[targetColumnTasks.length - 1];
          newPosition = lastTask ? (lastTask.position || 0) + 1000 : 1000;
      } else if (targetId && finalStatus === targetStatus) {
           // Drop relative to specific task
          const targetIndex = targetColumnTasks.findIndex(t => t.id === targetId);
          if (targetIndex !== -1) {
              const targetTask = targetColumnTasks[targetIndex];
              const targetTaskPos = targetTask.position || 0;

              if (positionOnTarget === 'before') {
                  const prevTask = targetColumnTasks[targetIndex - 1];
                  const prevPos = prevTask ? (prevTask.position || 0) : 0;
                  newPosition = !prevTask ? targetTaskPos / 2 : (targetTaskPos + prevPos) / 2;
              } else {
                  const nextTask = targetColumnTasks[targetIndex + 1];
                  const nextPos = nextTask ? (nextTask.position || 0) : targetTaskPos + 1000;
                  newPosition = (targetTaskPos + nextPos) / 2;
              }
          } else {
              newPosition = 1000;
          }
      } else {
          // Automation moved it to a different column than the user dropped
          // Append to end of the automated column
           const lastTask = targetColumnTasks[targetColumnTasks.length - 1];
           newPosition = lastTask ? (lastTask.position || 0) + 1000 : 1000;
      }

      // 3. Update State
      const updatedTask = { ...automatedTask, position: newPosition };
      setTasks([...otherTasks, updatedTask]);

      if (automationLog) {
          showToast(`${automationLog}`, 'automation');
      }

      // 4. Update Database
      if (!isOfflineMode) {
          // Use full object update if automation changed progress or just regular update
          if (updatedTask.progress !== draggedTask.progress || updatedTask.checklist?.length !== draggedTask.checklist?.length) {
             const dbTask = {
                 id: draggedTaskId,
                 status: updatedTask.status, 
                 position: newPosition,
                 progress: updatedTask.progress,
                 checklist: updatedTask.checklist // Save generated checklist
             };

             const { error } = await supabase.from('tasks').update(dbTask).eq('id', draggedTaskId);
             
             if (error) {
                 console.error("Error updating automated task", error);
                 if (error.code === '42703' || error.code === 'PGRST204') {
                     // Fallback without position if that's the cause
                     await supabase.from('tasks').update({ 
                        status: updatedTask.status, 
                        progress: updatedTask.progress,
                        checklist: updatedTask.checklist
                    }).eq('id', draggedTaskId);
                 }
             }

          } else {
              const { error } = await supabase.from('tasks').update({ status: finalStatus, position: newPosition }).eq('id', draggedTaskId);
              if (error && (error.code === '42703' || error.code === 'PGRST204')) {
                  // Fallback: update status only
                  await supabase.from('tasks').update({ status: finalStatus }).eq('id', draggedTaskId);
                  showToast("Movido (Sem ordem - Coluna position ausente)", "automation");
              }
          }
      }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDropColumn = (e: React.DragEvent, status: Status) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    handleTaskDrop(taskId, null, status);
  };

  const onDropTask = (draggedId: string, targetId: string, position: 'before' | 'after') => {
      const targetTask = tasks.find(t => t.id === targetId);
      if (targetTask) {
          handleTaskDrop(draggedId, targetId, targetTask.status, position);
      }
  };

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    setIsDark(!isDark);
  };

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  const currentProject = projects.find(p => p.id === currentProjectId);
  const contextTasks = tasks.filter(t => t.projectId === currentProjectId);
  
  const uniqueAssignees = Array.from(new Set(
      contextTasks
        .map(t => t.assignee)
        .filter((a): a is string => typeof a === 'string' && a.length > 0)
  ));
  
  const filteredTasks = assigneeFilter 
      ? contextTasks.filter(t => t.assignee === assigneeFilter) 
      : contextTasks;

  return (
    <div className="flex h-screen w-screen bg-nexus-bg text-nexus-text font-sans overflow-hidden selection:bg-nexus-cobalt selection:text-white transition-colors duration-300">
      <Sidebar 
        projects={projects}
        currentProjectId={currentProjectId}
        setProjectId={setCurrentProjectId}
        onNewProject={() => { setProjectModalMode('create'); setIsProjectModalOpen(true); }}
        onShareProject={(p) => { setProjectToShare(p); setProjectModalMode('share'); setIsProjectModalOpen(true); }}
        onReorderProjects={handleReorderProjects}
        user={user}
        onLogout={handleLogout}
        isDark={isDark}
        toggleTheme={toggleTheme}
        currentView={currentView}
        setView={setCurrentView}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {isOfflineMode && (
             <div className="bg-red-500/10 border-b border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest py-1 text-center flex items-center justify-center gap-2">
                 <WifiOff size={10} /> Modo Offline / Demonstração
             </div>
        )}

        {isLoading && (
            <div className="absolute inset-0 bg-nexus-bg/80 z-50 flex items-center justify-center backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 size={32} className="animate-spin text-nexus-cobalt" />
                    <span className="text-xs font-mono text-nexus-muted">Sincronizando...</span>
                </div>
            </div>
        )}

        {currentView !== 'monitoring' && (
            <MetricsHeader 
                tasks={filteredTasks} 
                project={currentProject} 
                availableAssignees={uniqueAssignees}
                currentFilter={assigneeFilter}
                onFilterChange={setAssigneeFilter}
                hiddenColumns={hiddenColumns}
                onToggleColumn={toggleColumnVisibility}
                currentView={currentView}
                onViewChange={setCurrentView}
            />
        )}

        <main className="flex-1 overflow-x-auto overflow-y-hidden flex flex-col">
           {currentView === 'monitoring' ? (
             <MonitoringDashboard 
                tasks={tasks} 
                projects={projects} 
                initialProjectId={currentProjectId}
             />
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
                    {STATUS_COLUMNS
                        .filter(col => !hiddenColumns.includes(col.id))
                        .map(col => {
                        // Stable Sort: Position ASC, then CreatedAt ASC
                        const colTasks = filteredTasks
                            .filter(t => t.status === col.id)
                            .sort((a, b) => {
                                const posA = a.position || 0;
                                const posB = b.position || 0;
                                if (posA !== posB) return posA - posB;
                                // Secondary sort for stability
                                return a.createdAt.localeCompare(b.createdAt);
                            });
                        
                        return (
                            <div 
                            key={col.id} 
                            className="flex-1 min-w-[280px] flex flex-col h-full rounded-lg bg-nexus-bg/50 border border-transparent transition-colors"
                            onDragOver={onDragOver}
                            onDrop={(e) => onDropColumn(e, col.id)}
                            >
                            <div className="flex items-center justify-between mb-2 pb-2 border-b border-nexus-border px-1 group">
                                <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-widest text-nexus-text">
                                    {col.label}
                                </span>
                                <span className="text-[10px] text-nexus-muted bg-nexus-card px-1.5 py-0.5 rounded font-mono border border-nexus-border">
                                    {colTasks.length}
                                </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => toggleColumnVisibility(col.id)}
                                        className="opacity-0 group-hover:opacity-100 text-nexus-muted hover:text-nexus-cobalt transition-all"
                                        title="Ocultar coluna"
                                    >
                                        <EyeOff size={14} />
                                    </button>
                                    <div className="h-1 w-1 rounded-full bg-nexus-border"></div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                {colTasks.map(task => (
                                    <TaskCard 
                                    key={task.id} 
                                    task={task} 
                                    onEdit={(t) => { setSelectedTask(t); setIsTaskModalOpen(true); }} 
                                    onDelete={handleDeleteTask}
                                    onDropOnTask={onDropTask}
                                    />
                                ))}
                                
                                {quickAddColumn === col.id ? (
                                    <div className="bg-nexus-card border border-nexus-border rounded p-2 mb-3 shadow-lg animate-in fade-in zoom-in-95 duration-200">
                                        <textarea
                                            autoFocus 
                                            value={quickAddTitle}
                                            onChange={(e) => setQuickAddTitle(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleQuickAdd();
                                                }
                                            }}
                                            placeholder="Insira um título para o cartão..."
                                            className="w-full bg-transparent text-sm resize-none outline-none mb-2 placeholder-nexus-muted text-nexus-text h-16"
                                        />
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={handleQuickAdd}
                                                className="px-3 py-1.5 bg-nexus-cobalt hover:bg-blue-600 text-white text-xs font-bold rounded transition-colors"
                                            >
                                                Adicionar Cartão
                                            </button>
                                            <button 
                                                onClick={() => { setQuickAddColumn(null); setQuickAddTitle(''); }}
                                                className="p-1.5 text-nexus-muted hover:text-nexus-text transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setQuickAddColumn(col.id)}
                                        className={`w-full flex items-center gap-2 p-2 rounded hover:bg-nexus-border/50 text-nexus-muted hover:text-nexus-text transition-colors text-xs font-medium mt-1 ${user?.role === 'viewer' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        disabled={user?.role === 'viewer'}
                                        title={user?.role === 'viewer' ? 'Visualizadores não podem criar tarefas' : ''}
                                    >
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
                 {projects.length === 0 ? "Crie seu primeiro projeto para começar." : "Selecione um projeto."}
             </div>
           )}
        </main>
      </div>

      <TaskModal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)}
        task={selectedTask}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        currentProjectId={currentProjectId || ''}
        availableTags={systemTags}
        onManageTags={handleManageTags}
        userRole={user.role}
      />

      <ProjectModal 
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSave={handleCreateProject}
        onShare={handleShareProject}
        mode={projectModalMode}
        projectToShare={projectToShare}
        tasks={contextTasks}
      />

      <ProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onUpdateProfile={handleUpdateProfile}
        onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
      />

      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        currentUser={user}
        onUpgrade={handleUpgradePlan}
        onCancelPlan={handleCancelPlan}
      />

      {toast?.visible && (
        <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-md shadow-lg border border-transparent ${
            toast.type === 'automation'
                ? 'bg-nexus-accent/10 border-nexus-accent/20 text-nexus-accent'
                : toast.type === 'whatsapp'
                    ? 'bg-green-500/10 border-green-500/20 text-green-500'
                    : toast.type === 'schedule'
                        ? 'bg-purple-500/10 border-purple-500/20 text-purple-500'
                        : toast.type === 'success' 
                            ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' 
                            : 'bg-red-500/10 border-red-500/20 text-red-500'
          } backdrop-blur-md`}>
            {toast.type === 'success' && <CheckCircle2 size={18} />}
            {toast.type === 'automation' && <Zap size={18} className="fill-current" />}
            {toast.type === 'whatsapp' && <MessageCircle size={18} />}
            {toast.type === 'schedule' && <Clock size={18} />}
            {toast.type === 'error' && <X size={18} />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;