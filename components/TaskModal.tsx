
import React, { useState, useEffect } from 'react';
import { Task, Status, Priority, Attachment, Tag, ChecklistItem, User } from '../types';
import { X, Upload, FileText, Trash2, Save, Tag as TagIcon, Globe, Briefcase, Target, Calendar, CheckSquare, User as UserIcon, Edit2, Clock, Lock, AlertCircle, CalendarClock } from 'lucide-react';
import { STATUS_COLUMNS, PRESET_SEGMENTS } from '../constants';
import { ImageGalleryModal } from './ImageGalleryModal';

interface TaskModalProps {
  task?: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete: (id: string) => void;
  currentProjectId: string;
  availableTags: Tag[];
  onManageTags: (action: 'add' | 'edit' | 'delete', tag: Tag, oldText?: string) => void;
  userRole: User['role'];
}

const TAG_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow/Amber
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#737373', // Grey
];

export const TaskModal: React.FC<TaskModalProps> = ({ 
    task, 
    isOpen, 
    onClose, 
    onSave, 
    onDelete, 
    currentProjectId, 
    availableTags,
    onManageTags,
    userRole
}) => {
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    clientName: '',
    clientSegment: '',
    objective: '',
    websiteUrl: '',
    status: 'backlog',
    priority: 'Medium',
    progress: 0,
    tags: [],
    attachments: [],
    checklist: [],
    dueDate: '',
    scheduledAt: '',
    assignee: '',
    coverUrl: ''
  });
  
  const [tagInput, setTagInput] = useState('');
  const [selectedTagColor, setSelectedTagColor] = useState(TAG_COLORS[5]); 
  const [checklistInput, setChecklistInput] = useState('');
  
  // State for editing tags mode
  const [editingTag, setEditingTag] = useState<string | null>(null);
  
  // Validation state
  const [tagError, setTagError] = useState<string | null>(null);

  // Gallery State
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);

  // PERMISSION CHECK
  const isReadOnly = userRole === 'viewer';
  const canDelete = userRole === 'admin';

  // Auto-calculate progress whenever checklist changes
  useEffect(() => {
    if (formData.checklist) {
        const total = formData.checklist.length;
        const checked = formData.checklist.filter(i => i.checked).length;
        const newProgress = total === 0 ? 0 : Math.round((checked / total) * 100);
        
        if (newProgress !== formData.progress) {
            setFormData(prev => ({ ...prev, progress: newProgress }));
        }
    }
  }, [formData.checklist]);

  useEffect(() => {
    if (task) {
      setFormData(task);
    } else {
      setFormData({
        title: '',
        description: '',
        clientName: '',
        clientSegment: '',
        objective: '',
        websiteUrl: '',
        status: 'backlog',
        priority: 'Medium',
        progress: 0,
        tags: [],
        attachments: [],
        checklist: [],
        dueDate: '',
        scheduledAt: '',
        assignee: '',
        projectId: currentProjectId,
        coverUrl: ''
      });
    }
  }, [task, isOpen, currentProjectId]);

  const getProgressLabel = (progress: number) => {
      if (progress === 0) return "Não iniciado";
      if (progress <= 60) return "Em andamento";
      if (progress <= 99) return "Quase concluído";
      return "Concluído";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const newAttachment: Attachment = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type.includes('image') ? 'image' : 'pdf', 
        url: URL.createObjectURL(file),
      };
      setFormData(prev => ({
        ...prev,
        attachments: [...(prev.attachments || []), newAttachment]
      }));
    }
  };

  const removeAttachment = (id: string) => {
    if (isReadOnly) return;
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments?.filter(a => a.id !== id)
    }));
  };

  // Helper to open gallery
  const imageAttachments = formData.attachments?.filter(a => a.type === 'image') || [];
  
  const handleImageClick = (attId: string) => {
      const index = imageAttachments.findIndex(a => a.id === attId);
      if (index !== -1) {
          setGalleryStartIndex(index);
          setIsGalleryOpen(true);
      }
  };

  const addTagToTask = (tag: Tag) => {
      if (isReadOnly) return;
      if (!formData.tags?.find(t => t.text === tag.text)) {
          setFormData(prev => ({
              ...prev,
              tags: [...(prev.tags || []), tag]
          }));
      }
  };

  const createNewTag = () => {
      if (isReadOnly) return;
      const tagName = tagInput.trim();
      
      if (tagName) {
          // Validation: Check for duplicates (case insensitive)
          const isDuplicate = availableTags.some(t => t.text.toLowerCase() === tagName.toLowerCase());
          
          if (isDuplicate) {
              setTagError('Esta etiqueta já existe.');
              return;
          }

          const newTag = { text: tagName, color: selectedTagColor };
          // Add to global list
          onManageTags('add', newTag);
          // Add to this task automatically for convenience
          addTagToTask(newTag);
          setTagInput('');
          setTagError(null);
      }
  };

  const removeTagFromTask = (textToRemove: string) => {
      if (isReadOnly) return;
      setFormData(prev => ({
          ...prev,
          tags: prev.tags?.filter(t => t.text !== textToRemove)
      }));
  };

  const addChecklistItem = () => {
      if (isReadOnly) return;
      if (checklistInput.trim()) {
          const newItem: ChecklistItem = {
              id: Date.now().toString(),
              text: checklistInput.trim(),
              checked: false,
              dueDate: ''
          };
          setFormData(prev => ({
              ...prev,
              checklist: [...(prev.checklist || []), newItem]
          }));
          setChecklistInput('');
      }
  };

  const toggleChecklistItem = (id: string) => {
      if (isReadOnly) return;
      setFormData(prev => ({
          ...prev,
          checklist: prev.checklist?.map(item => 
            item.id === id ? { ...item, checked: !item.checked } : item
          )
      }));
  };

  const updateChecklistItemText = (id: string, newText: string) => {
      if (isReadOnly) return;
      setFormData(prev => ({
          ...prev,
          checklist: prev.checklist?.map(item => 
            item.id === id ? { ...item, text: newText } : item
          )
      }));
  };

  const updateChecklistItemDate = (id: string, date: string) => {
    if (isReadOnly) return;
    setFormData(prev => ({
        ...prev,
        checklist: prev.checklist?.map(item => 
          item.id === id ? { ...item, dueDate: date } : item
        )
    }));
  };

  const deleteChecklistItem = (id: string) => {
      if (isReadOnly) return;
      setFormData(prev => ({
          ...prev,
          checklist: prev.checklist?.filter(item => item.id !== id)
      }));
  };

  if (!isOpen) return null;

  return (
    <>
    {/* Overlay background that handles closing (Click Outside) */}
    <div 
        className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-[1px] animate-in fade-in duration-200"
        onClick={onClose}
    >
      
      {/* Modal Content - Stop propagation to prevent closing when clicking inside the panel */}
      <div 
          className="w-full md:w-1/2 h-full bg-nexus-card border-l border-nexus-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
          onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-nexus-border bg-nexus-bg/50 flex-shrink-0">
          <div className="flex-1 mr-4">
             <input 
                  type="text" 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-transparent border-none text-xl font-bold text-nexus-text focus:ring-0 outline-none p-0 placeholder-nexus-muted"
                  placeholder="Nome do Cartão..."
                  readOnly={isReadOnly}
            />
            <div className="text-xs text-nexus-muted mt-1 flex gap-2">
                <span>em lista <strong>{STATUS_COLUMNS.find(c => c.id === formData.status)?.label}</strong></span>
                {isReadOnly && <span className="flex items-center gap-1 text-nexus-muted border border-nexus-border px-1.5 rounded bg-nexus-bg"><Lock size={10} /> Somente Leitura</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
                onClick={onClose} 
                className="p-2 text-nexus-muted hover:text-nexus-text hover:bg-nexus-bg rounded transition-colors"
                title="Fechar (Esc)"
            >
                <X size={24} />
            </button>
          </div>
        </div>

        {/* Content - Two Column Layout */}
        <div className="flex-1 overflow-y-auto p-6 flex gap-6 custom-scrollbar">
          
          {/* LEFT COLUMN (Main Content) */}
          <div className="flex-1 space-y-8 pb-12">
              
              {/* Description */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-nexus-text uppercase tracking-wide">
                    <FileText size={16} className="text-nexus-cobalt" />
                    <h3>Descrição</h3>
                </div>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={6}
                  className="w-full bg-nexus-bg border border-nexus-border rounded p-3 text-nexus-text focus:border-nexus-cobalt outline-none transition-colors resize-none leading-relaxed text-sm read-only:opacity-60"
                  placeholder="Adicionar descrição detalhada..."
                  readOnly={isReadOnly}
                />
              </div>

              {/* Checklist */}
              <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-nexus-text uppercase tracking-wide justify-between">
                      <div className="flex items-center gap-2">
                        <CheckSquare size={16} className="text-nexus-cobalt" />
                        <h3>Checklist</h3>
                      </div>
                      {/* Normalized Status Label */}
                      {formData.progress !== undefined && (
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-nexus-bg border border-nexus-border rounded text-nexus-muted">
                              {getProgressLabel(formData.progress)}
                          </span>
                      )}
                  </div>
                  
                  {/* Progress Bar */}
                  {formData.checklist && formData.checklist.length > 0 && (
                      <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-nexus-muted w-8 text-right font-mono">
                              {Math.round((formData.checklist.filter(i => i.checked).length / formData.checklist.length) * 100)}%
                          </span>
                          <div className="flex-1 h-1.5 bg-nexus-bg rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-nexus-cobalt transition-all duration-300 ease-out" 
                                style={{ width: `${(formData.checklist.filter(i => i.checked).length / formData.checklist.length) * 100}%` }}
                              ></div>
                          </div>
                      </div>
                  )}

                  <div className="space-y-2">
                      {formData.checklist?.map(item => (
                          <div key={item.id} className="flex flex-col gap-1 border-b border-nexus-border/50 pb-2 mb-2 last:border-0 last:mb-0 last:pb-0 group/item">
                             <div className="flex items-center gap-3">
                                <input 
                                    type="checkbox" 
                                    checked={item.checked} 
                                    onChange={() => toggleChecklistItem(item.id)}
                                    className="w-4 h-4 rounded border-nexus-border bg-nexus-bg checked:bg-nexus-cobalt cursor-pointer flex-shrink-0 disabled:opacity-50"
                                    disabled={isReadOnly}
                                />
                                <input 
                                    type="text"
                                    value={item.text}
                                    onChange={(e) => updateChecklistItemText(item.id, e.target.value)}
                                    className={`flex-1 text-sm bg-transparent outline-none border-b border-transparent focus:border-nexus-cobalt transition-all ${item.checked ? 'line-through text-nexus-muted' : 'text-nexus-text'}`}
                                    readOnly={isReadOnly}
                                />
                                {!isReadOnly && (
                                    <button onClick={() => deleteChecklistItem(item.id)} className="opacity-0 group-hover/item:opacity-100 text-nexus-muted hover:text-red-500 transition-opacity p-1">
                                        <X size={14} />
                                    </button>
                                )}
                             </div>
                             
                             {/* Date for checklist item */}
                             <div className="pl-7">
                                <input 
                                    type="datetime-local" 
                                    value={item.dueDate || ''}
                                    onChange={(e) => updateChecklistItemDate(item.id, e.target.value)}
                                    className="text-[10px] bg-transparent text-nexus-muted border-none hover:bg-nexus-bg rounded px-1.5 py-0.5 outline-none focus:text-nexus-cobalt transition-colors cursor-pointer disabled:opacity-50"
                                    disabled={isReadOnly}
                                />
                             </div>
                          </div>
                      ))}
                      {!isReadOnly && (
                          <div className="flex gap-2 mt-2 pl-7">
                              <input 
                                type="text" 
                                value={checklistInput}
                                onChange={(e) => setChecklistInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
                                className="flex-1 bg-nexus-bg border border-nexus-border rounded px-3 py-1.5 text-sm outline-none focus:border-nexus-cobalt transition-colors"
                                placeholder="Adicionar item..."
                              />
                              <button onClick={addChecklistItem} className="bg-nexus-card hover:bg-nexus-border text-nexus-text border border-nexus-border rounded px-3 py-1 text-xs font-medium transition-colors">Add</button>
                          </div>
                      )}
                  </div>
              </div>

               {/* Attachments */}
               <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-nexus-text uppercase tracking-wide">
                      <FileText size={16} className="text-nexus-cobalt" />
                      <h3>Anexos</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    {formData.attachments?.map(att => (
                        <div key={att.id} className="flex items-center gap-3 p-3 bg-nexus-bg border border-nexus-border rounded hover:border-nexus-cobalt transition-colors group">
                        {att.type === 'image' ? (
                            <img 
                                src={att.url} 
                                alt="prev" 
                                onClick={() => handleImageClick(att.id)}
                                className="w-10 h-10 object-cover rounded bg-nexus-card cursor-pointer hover:opacity-80 transition-opacity" 
                            />
                        ) : (
                            <div className="w-10 h-10 bg-nexus-card flex items-center justify-center rounded text-nexus-text border border-nexus-border"><FileText size={16} /></div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p 
                                className={`text-xs font-medium truncate text-nexus-text ${att.type === 'image' ? 'cursor-pointer hover:text-nexus-cobalt' : ''}`}
                                onClick={() => att.type === 'image' && handleImageClick(att.id)}
                            >
                                {att.name}
                            </p>
                            <a href={att.url} target="_blank" rel="noreferrer" className="text-[10px] text-nexus-cobalt hover:underline">Visualizar / Baixar</a>
                        </div>
                        {!isReadOnly && (
                            <button onClick={() => removeAttachment(att.id)} className="text-nexus-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                        )}
                        </div>
                    ))}
                  </div>
                   {!isReadOnly && (
                       <div className="relative group">
                        <input 
                            type="file" 
                            onChange={handleFileChange} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                        />
                        <button className="flex items-center justify-center gap-2 text-sm text-nexus-muted bg-nexus-bg/50 hover:bg-nexus-bg px-3 py-3 rounded w-full border border-nexus-border border-dashed transition-all group-hover:border-nexus-cobalt group-hover:text-nexus-cobalt">
                            <Upload size={14} /> Adicionar anexo
                        </button>
                       </div>
                   )}
               </div>
               
               {/* Client Info (Backlog) */}
               {formData.status === 'backlog' && (
                   <div className="bg-gradient-to-br from-nexus-bg to-nexus-card border border-nexus-border rounded p-5 space-y-4">
                       <h4 className="text-xs font-bold uppercase text-nexus-text tracking-wider flex items-center gap-2 border-b border-nexus-border pb-2">
                           <Briefcase size={14} className="text-nexus-accent" /> Dados do Cliente
                       </h4>
                       <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                               <label className="text-[10px] uppercase text-nexus-muted font-bold">Nome do Cliente</label>
                               <input 
                                    type="text" 
                                    value={formData.clientName} 
                                    onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                                    className="w-full bg-nexus-card border border-nexus-border rounded p-2 text-sm outline-none focus:border-nexus-cobalt transition-colors"
                                    placeholder="Empresa Ltda"
                                    readOnly={isReadOnly}
                                />
                           </div>
                            
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase text-nexus-muted font-bold">Segmento</label>
                                <div className="relative">
                                    <input 
                                        list="segment-options"
                                        type="text" 
                                        value={formData.clientSegment} 
                                        onChange={(e) => setFormData({...formData, clientSegment: e.target.value})}
                                        className="w-full bg-nexus-card border border-nexus-border rounded p-2 text-sm outline-none focus:border-nexus-cobalt transition-colors"
                                        placeholder="Selecione..."
                                        readOnly={isReadOnly}
                                    />
                                    <datalist id="segment-options">
                                        {PRESET_SEGMENTS.map(seg => (
                                            <option key={seg} value={seg} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>
                       </div>
                       
                       <div className="space-y-1">
                           <label className="text-[10px] uppercase text-nexus-muted font-bold">Website / Links</label>
                           <div className="relative">
                               <Globe size={14} className="absolute left-2.5 top-2.5 text-nexus-muted" />
                               <input 
                                    type="text" 
                                    value={formData.websiteUrl} 
                                    onChange={(e) => setFormData({...formData, websiteUrl: e.target.value})}
                                    className="w-full bg-nexus-card border border-nexus-border rounded p-2 pl-8 text-sm outline-none focus:border-nexus-cobalt transition-colors"
                                    placeholder="https://..."
                                    readOnly={isReadOnly}
                                />
                           </div>
                       </div>
                       
                       <div className="space-y-1">
                           <label className="text-[10px] uppercase text-nexus-muted font-bold">Objetivo Principal</label>
                           <div className="relative">
                               <Target size={14} className="absolute left-2.5 top-2.5 text-nexus-muted" />
                               <input 
                                    type="text" 
                                    value={formData.objective} 
                                    onChange={(e) => setFormData({...formData, objective: e.target.value})}
                                    className="w-full bg-nexus-card border border-nexus-border rounded p-2 pl-8 text-sm outline-none focus:border-nexus-cobalt transition-colors"
                                    placeholder="Ex: Aumentar leads em 20%..."
                                    readOnly={isReadOnly}
                                />
                           </div>
                       </div>
                   </div>
               )}

          </div>

          {/* RIGHT COLUMN (Metadata Sidebar) */}
          <div className="w-72 space-y-6 pt-1">
              
              {/* Properties Panel */}
              <div className="bg-nexus-bg/30 border border-nexus-border rounded-lg p-4 space-y-4">
                  <div className="text-xs font-bold text-nexus-muted uppercase tracking-wider mb-2">Propriedades</div>
                  
                  {/* Status */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-nexus-muted">Status</label>
                    <select 
                        value={formData.status} 
                        onChange={(e) => setFormData({...formData, status: e.target.value as Status})}
                        className="w-full bg-nexus-card border border-nexus-border rounded px-2 py-2 text-xs font-medium outline-none focus:border-nexus-cobalt disabled:opacity-70"
                        disabled={isReadOnly}
                    >
                        {STATUS_COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>

                  {/* Priority */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-nexus-muted">Prioridade</label>
                    <select 
                        value={formData.priority} 
                        onChange={(e) => setFormData({...formData, priority: e.target.value as Priority})}
                        className="w-full bg-nexus-card border border-nexus-border rounded px-2 py-2 text-xs font-medium outline-none focus:border-nexus-cobalt disabled:opacity-70"
                        disabled={isReadOnly}
                    >
                        <option value="Low">Baixa</option>
                        <option value="Medium">Média</option>
                        <option value="High">Alta</option>
                    </select>
                  </div>

                   {/* Assignee */}
                  <div className="space-y-1">
                      <label className="text-[10px] text-nexus-muted">Responsável</label>
                      <div className="relative">
                          <UserIcon size={14} className="absolute left-2 top-2.5 text-nexus-muted" />
                          <input 
                            type="text" 
                            value={formData.assignee}
                            onChange={(e) => setFormData({...formData, assignee: e.target.value})}
                            className="w-full bg-nexus-card border border-nexus-border rounded pl-7 py-2 text-xs outline-none focus:border-nexus-cobalt"
                            placeholder="Nome do usuário..."
                            readOnly={isReadOnly}
                          />
                      </div>
                  </div>

                  {/* Due Date */}
                  <div className="space-y-1">
                      <label className="text-[10px] text-nexus-muted">Data de Entrega</label>
                      <div className="relative">
                          <Calendar size={14} className="absolute left-2 top-2.5 text-nexus-muted" />
                          <input 
                            type="date"
                            value={formData.dueDate}
                            onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                            className="w-full bg-nexus-card border border-nexus-border rounded pl-7 py-2 text-xs outline-none focus:border-nexus-cobalt text-nexus-text disabled:opacity-70" 
                            disabled={isReadOnly}
                          />
                      </div>
                  </div>

                  {/* Scheduled For (Create At) */}
                  <div className="space-y-1">
                      <label className="text-[10px] text-nexus-muted flex items-center gap-1">
                         <CalendarClock size={10} /> Agendar Criação
                      </label>
                      <div className="relative">
                          <input 
                            type="datetime-local"
                            value={formData.scheduledAt || ''}
                            onChange={(e) => setFormData({...formData, scheduledAt: e.target.value})}
                            className="w-full bg-nexus-card border border-nexus-border rounded px-2 py-2 text-xs outline-none focus:border-nexus-cobalt text-nexus-text disabled:opacity-70" 
                            disabled={isReadOnly}
                            min={new Date().toISOString().slice(0, 16)}
                          />
                      </div>
                      {formData.scheduledAt && (
                          <div className="text-[9px] text-nexus-accent flex items-center gap-1 mt-1">
                              <Clock size={8} /> Agendado para ativar no futuro
                          </div>
                      )}
                  </div>
              </div>

              {/* Tags Section */}
              <div className="space-y-3">
                   <div className="flex items-center gap-2 text-xs font-bold text-nexus-muted uppercase tracking-wider">
                       <TagIcon size={12} /> Etiquetas
                   </div>
                   
                   {/* Selected Tags */}
                   <div className="flex flex-wrap gap-1.5 mb-2">
                        {formData.tags?.map(tag => (
                             <div key={tag.text} className="h-6 rounded flex items-center px-2 text-[10px] font-bold text-white relative group cursor-default shadow-sm" style={{ backgroundColor: tag.color }}>
                                 {tag.text}
                                 {!isReadOnly && <button onClick={() => removeTagFromTask(tag.text)} className="ml-1 opacity-50 hover:opacity-100 hover:text-white"><X size={10}/></button>}
                             </div>
                        ))}
                        {(!formData.tags || formData.tags.length === 0) && (
                            <span className="text-xs text-nexus-muted italic">Sem etiquetas</span>
                        )}
                   </div>
                   
                   {/* Tag Manager - Only show if not read only */}
                   {!isReadOnly && (
                       <div className="p-3 bg-nexus-bg/50 border border-nexus-border rounded-lg max-h-60 overflow-y-auto custom-scrollbar">
                            <div className="text-[10px] text-nexus-muted font-bold uppercase mb-2">Adicionar / Criar</div>
                            
                            {/* New Tag Input */}
                            <div className="flex flex-col gap-2 mb-3 bg-nexus-card p-2 rounded border border-nexus-border transition-colors">
                                <input 
                                    type="text" 
                                    value={tagInput} 
                                    onChange={(e) => {
                                        setTagInput(e.target.value);
                                        if (tagError) setTagError(null);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (editingTag) {
                                                onManageTags('edit', { text: tagInput, color: selectedTagColor }, editingTag);
                                                setEditingTag(null);
                                                setTagInput('');
                                                setTagError(null);
                                            } else {
                                                createNewTag();
                                            }
                                        }
                                    }}
                                    className={`w-full bg-transparent border-b text-xs outline-none pb-1 mb-1 focus:border-nexus-cobalt transition-colors ${tagError ? 'border-red-500' : 'border-nexus-border'}`}
                                    placeholder={editingTag ? "Editar nome..." : "Nova etiqueta..."}
                                />
                                {tagError && (
                                    <div className="flex items-center gap-1 mb-1">
                                        <AlertCircle size={8} className="text-red-500" />
                                        <span className="text-[9px] text-red-500 font-medium">{tagError}</span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center">
                                    <div className="flex gap-1">
                                        {TAG_COLORS.slice(0, 5).map(c => (
                                            <button 
                                                key={c}
                                                onClick={() => setSelectedTagColor(c)}
                                                className={`w-3 h-3 rounded-full transition-transform ${selectedTagColor === c ? 'scale-125 ring-1 ring-nexus-text' : 'hover:scale-110'}`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if (editingTag) {
                                                onManageTags('edit', { text: tagInput, color: selectedTagColor }, editingTag);
                                                setEditingTag(null);
                                                setTagInput('');
                                                setTagError(null);
                                            } else {
                                                createNewTag();
                                            }
                                        }} 
                                        className="text-[10px] bg-nexus-cobalt text-white px-2 py-0.5 rounded hover:bg-blue-600 transition-colors"
                                    >
                                        {editingTag ? 'Salvar' : 'Criar'}
                                    </button>
                                </div>
                            </div>

                            {/* Existing Tags List */}
                            <div className="space-y-1">
                                {availableTags.map(tag => {
                                    const isSelected = formData.tags?.find(t => t.text === tag.text);
                                    return (
                                    <div key={tag.text} className="flex items-center gap-1 group/tag">
                                        <button 
                                            onClick={() => addTagToTask(tag)}
                                            className={`flex-1 text-left px-2 py-1.5 rounded text-[10px] font-medium text-white hover:opacity-90 transition-all flex items-center justify-between shadow-sm ${isSelected ? 'ring-1 ring-white ring-offset-1 ring-offset-nexus-bg' : 'opacity-70'}`}
                                            style={{ backgroundColor: tag.color }}
                                            title="Adicionar à tarefa"
                                        >
                                            <span className="truncate">{tag.text}</span>
                                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>}
                                        </button>
                                        
                                        <div className="flex gap-0.5 opacity-0 group-hover/tag:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => { setTagInput(tag.text); setSelectedTagColor(tag.color); setEditingTag(tag.text); setTagError(null); }}
                                                className="p-1 text-nexus-muted hover:text-nexus-cobalt bg-nexus-card rounded border border-nexus-border"
                                                title="Editar etiqueta"
                                            >
                                                <Edit2 size={10} />
                                            </button>
                                            <button 
                                                onClick={() => onManageTags('delete', tag)}
                                                className="p-1 text-nexus-muted hover:text-red-500 bg-nexus-card rounded border border-nexus-border"
                                                title="Excluir etiqueta do sistema"
                                            >
                                                <Trash2 size={10} />
                                            </button>
                                        </div>
                                    </div>
                                )})}
                            </div>
                       </div>
                   )}
              </div>
              
               {/* Metadata Footer */}
               {formData.createdAt && typeof formData.createdAt === 'string' && (
                <div className="pt-4 border-t border-nexus-border text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-nexus-bg rounded-full border border-nexus-border text-[10px] text-nexus-muted">
                        <Clock size={10} />
                        <span>Criado em {new Date(formData.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                </div>
              )}

          </div>

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-nexus-border flex justify-between bg-nexus-bg/50 flex-shrink-0">
          {task && canDelete ? (
            <button 
              onClick={() => onDelete(task.id)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded transition-colors border border-transparent hover:border-red-500/20"
            >
              <Trash2 size={14} /> Excluir Cartão
            </button>
          ) : <div></div>}
          
          <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-nexus-text hover:bg-nexus-border rounded transition-colors"
              >
                Cancelar
              </button>
              {!isReadOnly && (
                <button 
                    onClick={() => onSave(formData as Task)}
                    className={`flex items-center gap-2 px-6 py-2 text-white text-xs font-bold rounded transition-all shadow-lg ${
                        formData.scheduledAt 
                        ? 'bg-nexus-accent text-black hover:bg-amber-400 shadow-amber-900/20' 
                        : 'bg-nexus-cobalt hover:bg-blue-600 shadow-blue-900/20'
                    }`}
                >
                    {formData.scheduledAt ? (
                        <>
                            <CalendarClock size={14} /> Agendar
                        </>
                    ) : (
                        <>
                            <Save size={14} /> Salvar Alterações
                        </>
                    )}
                </button>
              )}
          </div>
        </div>
      </div>
    </div>

    {/* Image Gallery Modal */}
    <ImageGalleryModal 
        isOpen={isGalleryOpen} 
        onClose={() => setIsGalleryOpen(false)} 
        images={imageAttachments} 
        initialIndex={galleryStartIndex} 
    />
    </>
  );
};