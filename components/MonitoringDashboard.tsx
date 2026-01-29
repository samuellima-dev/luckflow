import React, { useMemo, useState, useEffect } from 'react';
import { Task, Project } from '../types';
import { BarChart3, PieChart, TrendingUp, CheckCircle, AlertCircle, Clock, Filter, LayoutGrid, BrainCircuit, Tag, ArrowRight, Activity, Zap, Target } from 'lucide-react';
import { STATUS_COLUMNS } from '../constants';

interface MonitoringDashboardProps {
  tasks: Task[]; // All tasks available to the user
  projects: Project[]; // All projects available to the user
  initialProjectId?: string | null;
}

interface PatternGroup {
    id: string;
    label: string;
    reason: string;
    tasks: Task[];
    icon: React.ElementType;
    colorClass: string;
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({ tasks, projects, initialProjectId }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  useEffect(() => {
    if (initialProjectId) {
        setSelectedProjectId(initialProjectId);
    } else {
        setSelectedProjectId('all');
    }
  }, [initialProjectId]);

  const filteredTasks = useMemo(() => {
      if (selectedProjectId === 'all') return tasks;
      return tasks.filter(t => t.projectId === selectedProjectId);
  }, [tasks, selectedProjectId]);

  const currentProject = projects.find(p => p.id === selectedProjectId);

  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const done = filteredTasks.filter(t => t.status === 'done').length;
    const inProgress = filteredTasks.filter(t => t.status === 'inprogress').length;
    const backlog = filteredTasks.filter(t => t.status === 'backlog').length;
    const review = filteredTasks.filter(t => t.status === 'review').length;
    
    const completionRate = total === 0 ? 0 : Math.round((done / total) * 100);
    
    // Priority Distribution
    const high = filteredTasks.filter(t => t.priority === 'High').length;
    const medium = filteredTasks.filter(t => t.priority === 'Medium').length;
    const low = filteredTasks.filter(t => t.priority === 'Low').length;

    // Health Score Algorithm
    // Based on High Priority Pendings vs Completion
    const highPriorityPending = filteredTasks.filter(t => t.priority === 'High' && t.status !== 'done').length;
    const healthScore = Math.max(0, Math.min(100, (completionRate * 1.2) - (highPriorityPending * 5)));

    return { total, done, inProgress, backlog, review, completionRate, high, medium, low, healthScore };
  }, [filteredTasks]);

  const statusCounts = STATUS_COLUMNS.map(col => ({
    label: col.label,
    count: filteredTasks.filter(t => t.status === col.id).length,
    percent: filteredTasks.length ? (filteredTasks.filter(t => t.status === col.id).length / filteredTasks.length) * 100 : 0
  }));

  const patternGroups = useMemo(() => {
    const groups: PatternGroup[] = [];
    const activeTasks = filteredTasks.filter(t => t.status !== 'done');

    const highPri = activeTasks.filter(t => t.priority === 'High');
    if (highPri.length >= 2) {
        groups.push({
            id: 'critical-focus',
            label: 'Foco Crítico',
            reason: `Detectadas ${highPri.length} tarefas de alta prioridade pendentes.`,
            tasks: highPri,
            icon: AlertCircle,
            colorClass: 'text-red-500 border-red-500/20 bg-red-500/5'
        });
    }

    const tagMap = new Map<string, Task[]>();
    activeTasks.forEach(t => {
        t.tags.forEach(tag => {
            if (!tagMap.has(tag.text)) tagMap.set(tag.text, []);
            tagMap.get(tag.text)?.push(t);
        });
    });

    tagMap.forEach((grpTasks, tag) => {
        if (grpTasks.length >= 3) {
             groups.push({
                id: `cluster-${tag}`,
                label: `Cluster: ${tag}`,
                reason: `Agrupamento temático identificado (${grpTasks.length} itens).`,
                tasks: grpTasks,
                icon: Tag,
                colorClass: 'text-nexus-cobalt border-nexus-cobalt/20 bg-nexus-cobalt/5'
            });
        }
    });

    const stalled = activeTasks.filter(t => t.status === 'inprogress' && t.progress < 25);
    if (stalled.length >= 2) {
         groups.push({
            id: 'stalled',
            label: 'Possível Gargalo',
            reason: 'Tarefas em progresso inicial (<25%) indicam possível bloqueio.',
            tasks: stalled,
            icon: Clock,
            colorClass: 'text-orange-500 border-orange-500/20 bg-orange-500/5'
        });
    }

    return groups;
  }, [filteredTasks]);

  if (projects.length === 0) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-nexus-muted">
            <BarChart3 size={48} className="mb-4 opacity-50" />
            <p>Nenhum projeto encontrado.</p>
        </div>
    )
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-nexus-bg space-y-8">
      {/* Header Analytical Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-nexus-border pb-6">
        <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold text-nexus-cobalt uppercase tracking-[0.2em]">
                <Activity size={12} /> Engenharia de Dados & Métricas
            </div>
            <h2 className="text-3xl font-bold text-nexus-text tracking-tight flex items-center gap-3">
                Monitoramento: 
                <span className="text-nexus-muted font-normal">
                    {selectedProjectId === 'all' ? 'Relatório Consolidado' : currentProject?.name}
                </span>
            </h2>
        </div>

        <div className="flex items-center gap-3 bg-nexus-card border border-nexus-border rounded-md px-3 py-2 shadow-sm min-w-[280px]">
            <Filter size={14} className="text-nexus-muted" />
            <div className="flex-1">
                <select 
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-nexus-text outline-none cursor-pointer uppercase tracking-wider"
                >
                    <option value="all">TODOS OS PROJETOS</option>
                    {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>
                    ))}
                </select>
            </div>
        </div>
      </div>

      {/* Primary Analytical Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Project Health Score */}
        <div className="md:col-span-2 bg-nexus-card border border-nexus-border p-6 rounded-lg flex items-center justify-between group hover:border-nexus-cobalt transition-colors">
            <div className="space-y-4 flex-1">
                <div className="flex items-center gap-2">
                    <Target size={18} className="text-nexus-cobalt" />
                    <h3 className="text-xs font-bold text-nexus-muted uppercase tracking-widest">Health Score</h3>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-mono font-bold text-nexus-text tracking-tighter">{Math.round(stats.healthScore)}</span>
                    <span className="text-sm text-nexus-muted font-mono">/100</span>
                </div>
                <p className="text-[10px] text-nexus-muted leading-relaxed max-w-[200px]">
                    Índice calculado com base na vazão de tarefas vs. tickets de alta prioridade.
                </p>
            </div>
            <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-nexus-border" />
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" 
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * stats.healthScore) / 100}
                        className="text-nexus-cobalt transition-all duration-1000"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Activity size={24} className="text-nexus-cobalt animate-pulse" />
                </div>
            </div>
        </div>

        {/* Rapid Metrics */}
        <div className="bg-nexus-card border border-nexus-border p-6 rounded-lg space-y-4">
            <div className="flex items-center gap-2">
                <Zap size={16} className="text-nexus-accent" />
                <h3 className="text-xs font-bold text-nexus-muted uppercase tracking-widest">Conclusão</h3>
            </div>
            <div className="text-3xl font-mono font-bold text-nexus-text">{stats.completionRate}%</div>
            <div className="w-full bg-nexus-bg h-1 rounded-full overflow-hidden">
                <div className="bg-nexus-accent h-full" style={{ width: `${stats.completionRate}%` }}></div>
            </div>
            <p className="text-[9px] text-nexus-muted font-mono uppercase">Evolução do cronograma</p>
        </div>

        <div className="bg-nexus-card border border-nexus-border p-6 rounded-lg space-y-4">
            <div className="flex items-center gap-2 text-red-500">
                <AlertCircle size={16} />
                <h3 className="text-xs font-bold uppercase tracking-widest opacity-80">Critical Path</h3>
            </div>
            <div className="text-3xl font-mono font-bold text-nexus-text">{stats.high}</div>
            <div className="flex gap-1">
                {Array.from({length: 5}).map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${i < stats.high ? 'bg-red-500' : 'bg-nexus-border'}`}></div>
                ))}
            </div>
            <p className="text-[9px] text-nexus-muted font-mono uppercase">Itens de alta prioridade</p>
        </div>
      </div>

      {/* Smart Insights Grid */}
      {patternGroups.length > 0 && (
          <div className="space-y-4">
             <h3 className="text-xs font-bold text-nexus-muted uppercase tracking-[0.2em] flex items-center gap-2">
                <BrainCircuit size={14} className="text-nexus-cobalt" />
                Deteção de Padrões por IA
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {patternGroups.map(group => (
                     <div key={group.id} className={`p-5 rounded-lg border ${group.colorClass} space-y-3 transition-all hover:bg-opacity-10`}>
                         <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                 <group.icon size={16} />
                                 <h4 className="font-bold text-xs uppercase tracking-wider">{group.label}</h4>
                             </div>
                             <span className="text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded">{group.tasks.length}</span>
                         </div>
                         <p className="text-xs opacity-70 leading-relaxed font-medium">{group.reason}</p>
                         <div className="pt-2 border-t border-current border-opacity-10">
                             {group.tasks.slice(0, 2).map(t => (
                                 <div key={t.id} className="text-[9px] truncate opacity-60 flex items-center gap-1 mt-1">
                                     <ArrowRight size={8} /> {t.title}
                                 </div>
                             ))}
                         </div>
                     </div>
                 ))}
             </div>
          </div>
      )}

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-nexus-card border border-nexus-border p-8 rounded-lg">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xs font-bold text-nexus-muted uppercase tracking-[0.2em] flex items-center gap-2">
                    <BarChart3 size={16} /> Status Flow Analysis
                </h3>
                <div className="text-[10px] font-mono text-nexus-muted">TOTAL DE ITENS: {stats.total}</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {statusCounts.map((item, idx) => (
                    <div key={idx} className="space-y-2">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-bold text-nexus-text uppercase tracking-widest">{item.label}</span>
                            <span className="text-xs font-mono text-nexus-cobalt font-bold">{item.count}</span>
                        </div>
                        <div className="w-full bg-nexus-bg h-2 rounded-full overflow-hidden border border-nexus-border/50">
                            <div 
                                className="h-full bg-nexus-cobalt transition-all duration-1000" 
                                style={{ width: `${item.percent}%`, opacity: 0.3 + (idx * 0.15) }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="bg-nexus-card border border-nexus-border p-8 rounded-lg flex flex-col">
             <h3 className="text-xs font-bold text-nexus-muted uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                <PieChart size={16} /> Workload Balance
            </h3>
            
            <div className="flex-1 flex flex-col justify-center space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <span className="text-xs font-medium text-nexus-muted">Alta Prioridade</span>
                        </div>
                        <span className="text-sm font-mono font-bold text-nexus-text">{stats.high}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-nexus-cobalt"></div>
                            <span className="text-xs font-medium text-nexus-muted">Média Prioridade</span>
                        </div>
                        <span className="text-sm font-mono font-bold text-nexus-text">{stats.medium}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-neutral-600"></div>
                            <span className="text-xs font-medium text-nexus-muted">Baixa Prioridade</span>
                        </div>
                        <span className="text-sm font-mono font-bold text-nexus-text">{stats.low}</span>
                    </div>
                </div>

                <div className="h-2 flex rounded-full overflow-hidden">
                    <div className="bg-red-500 h-full" style={{ width: `${(stats.high / (stats.total || 1)) * 100}%` }}></div>
                    <div className="bg-nexus-cobalt h-full" style={{ width: `${(stats.medium / (stats.total || 1)) * 100}%` }}></div>
                    <div className="bg-neutral-600 h-full" style={{ width: `${(stats.low / (stats.total || 1)) * 100}%` }}></div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};