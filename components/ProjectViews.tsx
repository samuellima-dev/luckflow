
import React from 'react';
import { Task, Status } from '../types';
import { STATUS_COLUMNS } from '../constants';
import { Calendar, User, AlignLeft, CheckSquare, MoreHorizontal } from 'lucide-react';

interface ViewProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange?: (task: Task, newStatus: Status) => void;
}

export const ListView: React.FC<ViewProps> = ({ tasks, onEdit }) => {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
      {STATUS_COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id);
        if (colTasks.length === 0) return null;

        return (
          <div key={col.id} className="bg-nexus-card border border-nexus-border rounded-lg overflow-hidden">
            <div className="bg-nexus-bg/50 px-4 py-3 border-b border-nexus-border flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-widest text-nexus-text">{col.label}</h3>
              <span className="text-[10px] bg-nexus-border px-2 py-0.5 rounded-full text-nexus-muted font-mono">
                {colTasks.length}
              </span>
            </div>
            <div className="divide-y divide-nexus-border">
              {colTasks.map(task => (
                <div 
                  key={task.id} 
                  onClick={() => onEdit(task)}
                  className="p-3 hover:bg-nexus-bg transition-colors flex items-center gap-4 cursor-pointer group"
                >
                  <div className={`w-1 h-8 rounded-full ${
                    task.priority === 'High' ? 'bg-nexus-accent' : 
                    task.priority === 'Medium' ? 'bg-nexus-cobalt' : 'bg-neutral-300'
                  }`}></div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-nexus-text truncate">{task.title}</span>
                      {task.tags.map(tag => (
                        <span key={tag.text} className="text-[9px] px-1.5 rounded" style={{color: tag.color, backgroundColor: `${tag.color}15`}}>
                          {tag.text}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-nexus-muted text-[11px]">
                       {task.clientName && <span>{task.clientName}</span>}
                       {task.dueDate && (
                         <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(task.dueDate).toLocaleDateString()}</span>
                       )}
                       {task.checklist.length > 0 && (
                         <span className="flex items-center gap-1"><CheckSquare size={10} /> {task.checklist.filter(i=>i.checked).length}/{task.checklist.length}</span>
                       )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                     {task.assignee && (
                        <div className="flex items-center gap-1 text-nexus-text text-xs border border-nexus-border px-2 py-1 rounded-full bg-nexus-bg">
                            <User size={10} /> {task.assignee}
                        </div>
                     )}
                     <button className="p-1 text-nexus-muted hover:text-nexus-cobalt opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal size={16} />
                     </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  );
};

export const TableView: React.FC<ViewProps> = ({ tasks, onEdit }) => {
  return (
    <div className="p-6 w-full overflow-auto">
      <div className="bg-nexus-card border border-nexus-border rounded-lg overflow-hidden min-w-[900px]">
        <table className="w-full text-left text-xs">
          <thead className="bg-nexus-bg/50 border-b border-nexus-border text-nexus-muted font-bold uppercase tracking-wider">
            <tr>
              <th className="p-3 w-8">Prio</th>
              <th className="p-3 w-1/3">Tarefa</th>
              <th className="p-3">Status</th>
              <th className="p-3">Responsável</th>
              <th className="p-3">Entrega</th>
              <th className="p-3">Progresso</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-nexus-border">
            {tasks.map(task => (
              <tr key={task.id} className="hover:bg-nexus-bg transition-colors group cursor-pointer" onClick={() => onEdit(task)}>
                <td className="p-3">
                   <div className={`w-2 h-2 rounded-full mx-auto ${
                      task.priority === 'High' ? 'bg-nexus-accent shadow-[0_0_5px_rgba(234,179,8,0.5)]' : 
                      task.priority === 'Medium' ? 'bg-nexus-cobalt' : 'bg-neutral-300'
                   }`} title={task.priority}></div>
                </td>
                <td className="p-3">
                  <div className="font-medium text-nexus-text">{task.title}</div>
                  {task.clientName && <div className="text-[10px] text-nexus-muted">{task.clientName}</div>}
                </td>
                <td className="p-3">
                  <span className="px-2 py-1 rounded-md bg-nexus-bg border border-nexus-border text-[10px] font-mono">
                    {STATUS_COLUMNS.find(c => c.id === task.status)?.label}
                  </span>
                </td>
                <td className="p-3">
                  {task.assignee ? (
                    <span className="flex items-center gap-1.5">
                       <div className="w-4 h-4 rounded-full bg-nexus-cobalt text-[8px] flex items-center justify-center text-white">{task.assignee.charAt(0)}</div>
                       <span className="text-nexus-text">{task.assignee}</span>
                    </span>
                  ) : <span className="text-nexus-muted opacity-50">-</span>}
                </td>
                <td className="p-3 font-mono text-nexus-muted">
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                </td>
                <td className="p-3">
                   <div className="flex items-center gap-2">
                     <div className="w-16 h-1.5 bg-nexus-bg rounded-full overflow-hidden border border-nexus-border">
                       <div className="h-full bg-nexus-cobalt" style={{width: `${task.progress}%`}}></div>
                     </div>
                     <span className="text-[10px]">{task.progress}%</span>
                   </div>
                </td>
                <td className="p-3 text-right">
                    <button className="text-nexus-muted hover:text-nexus-text opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal size={14} />
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
