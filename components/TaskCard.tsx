import React, { useState, useRef } from 'react';
import { Task, Priority } from '../types';
import { Paperclip, MoreHorizontal, Globe, CheckSquare, UserCircle, ImageIcon } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onDropOnTask: (draggedTaskId: string, targetTaskId: string, position: 'before' | 'after') => void;
}

const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const colors = {
    Low: 'bg-neutral-200 text-neutral-600 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700',
    Medium: 'bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30',
    High: 'bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-500 dark:border-amber-900/30',
  };

  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-wider font-bold ${colors[priority]}`}>
      {priority === 'Low' ? 'Baixa' : priority === 'Medium' ? 'Média' : 'Alta'}
    </span>
  );
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDropOnTask }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [dropIndicator, setDropIndicator] = useState<'top' | 'bottom' | null>(null);

  // Determine border color based on priority
  const borderLeftColor = 
    task.priority === 'High' ? 'border-l-nexus-accent' : 
    task.priority === 'Medium' ? 'border-l-nexus-cobalt' : 'border-l-gray-400 dark:border-l-neutral-600';

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const hoverMiddleY = (rect.bottom - rect.top) / 2;
    const hoverClientY = e.clientY - rect.top;

    if (hoverClientY < hoverMiddleY) {
        setDropIndicator('top');
    } else {
        setDropIndicator('bottom');
    }
  };

  const handleDragLeave = () => {
    setDropIndicator(null);
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDropIndicator(null);

      const draggedId = e.dataTransfer.getData('taskId');
      if (draggedId && draggedId !== task.id) {
          onDropOnTask(draggedId, task.id, dropIndicator === 'top' ? 'before' : 'after');
      }
  };

  const checklistTotal = task.checklist ? task.checklist.length : 0;
  const checklistDone = task.checklist ? task.checklist.filter(i => i.checked).length : 0;

  return (
    <div 
      ref={ref}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => onEdit(task)}
      className={`
        group relative bg-nexus-card border border-nexus-border rounded hover:border-nexus-cobalt/50 transition-all duration-200 cursor-grab active:cursor-grabbing overflow-hidden
        border-l-[3px] ${borderLeftColor} mb-3 shadow-sm hover:shadow-md
        ${dropIndicator === 'top' ? 'border-t-2 border-t-nexus-cobalt' : ''}
        ${dropIndicator === 'bottom' ? 'border-b-2 border-b-nexus-cobalt' : ''}
      `}
    >
      {/* Cover Image */}
      {task.coverUrl && (
        <div className="w-full h-32 relative overflow-hidden bg-nexus-bg border-b border-nexus-border">
          <img src={task.coverUrl} alt="Cover" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>
      )}

      <div className="p-3">
        <div className="flex justify-between items-start mb-2">
            <PriorityBadge priority={task.priority} />
            {checklistTotal > 0 && checklistDone === checklistTotal && <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>}
        </div>

        <h3 className="text-sm font-medium text-nexus-text leading-tight mb-2 line-clamp-2 group-hover:text-nexus-cobalt transition-colors">
            {String(task.title)}
        </h3>
        
        {(task.clientName || task.clientSegment) && (
            <div className="flex flex-col mb-2">
                {task.clientName && (
                    <p className="text-[10px] text-nexus-muted font-mono uppercase tracking-wider">
                    {String(task.clientName)}
                    </p>
                )}
                {task.clientSegment && (
                    <p className="text-[9px] text-nexus-cobalt font-medium">
                    {String(task.clientSegment)}
                    </p>
                )}
            </div>
        )}

        {task.tags && task.tags.length > 0 && (
            <div className="flex items-center gap-2 mb-3 flex-wrap">
                {task.tags.slice(0, 4).map((tag, i) => (
                <span 
                    key={i} 
                    className="text-[10px] px-1.5 py-0.5 rounded font-medium border border-transparent"
                    style={{ 
                    backgroundColor: `${tag.color}20`, // 20% opacity
                    color: tag.color,
                    borderColor: `${tag.color}40`
                    }}
                >
                    #{String(tag.text)}
                </span>
                ))}
            </div>
        )}

        {/* Progress Bar - Only if greater than 0 */}
        {task.progress > 0 && (
            <div className="w-full bg-nexus-bg h-1 rounded-full overflow-hidden mb-3">
                <div 
                className={`h-full transition-all duration-500 ${task.priority === 'High' ? 'bg-nexus-accent' : 'bg-nexus-cobalt'}`} 
                style={{ width: `${task.progress}%` }}
                ></div>
            </div>
        )}

        <div className="flex justify-between items-center text-nexus-muted mt-2">
            <div className="flex items-center gap-3 text-[10px]">
            {task.attachments && task.attachments.length > 0 && (
                <div className="flex items-center gap-1">
                <Paperclip size={10} />
                <span>{task.attachments.length}</span>
                </div>
            )}
            {checklistTotal > 0 && (
                <div className={`flex items-center gap-1 ${checklistDone === checklistTotal ? 'text-green-500' : ''}`}>
                <CheckSquare size={10} />
                <span>{checklistDone}/{checklistTotal}</span>
                </div>
            )}
            {task.websiteUrl && (
                <Globe size={10} />
            )}
            {task.coverUrl && !task.attachments.length && (
                 <ImageIcon size={10} />
            )}
            </div>
            
            {task.assignee && typeof task.assignee === 'string' ? (
                <div className="flex items-center gap-1.5 bg-nexus-bg border border-nexus-border pl-1 pr-2 py-0.5 rounded-full max-w-[120px]" title={`Responsável: ${String(task.assignee)}`}>
                    <div className="w-4 h-4 rounded-full bg-nexus-cobalt flex items-center justify-center text-[9px] text-white font-bold flex-shrink-0">
                        {String(task.assignee).substring(0,1).toUpperCase()}
                    </div>
                    <span className="text-[10px] font-medium text-nexus-text truncate">{String(task.assignee)}</span>
                </div>
            ) : (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal size={14} />
                </div>
            )}
        </div>
      </div>
    </div>
  );
};