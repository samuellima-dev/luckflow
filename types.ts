
export interface User {
  id: string;
  username: string;
  role: 'admin' | 'editor' | 'viewer';
  plan?: 'free' | 'silver' | 'bronze' | 'gold'; // New field for subscription plan
  avatarUrl?: string;
  whatsapp?: string; // New field for notifications
  email?: string; // New field for account recovery
  password?: string; // New field to persist password state locally
}

export interface Project {
  id: string;
  name: string;
  ownerId: string;
  sharedWith: string[]; // List of usernames
}

export type Priority = 'Low' | 'Medium' | 'High';

export type Status = 'backlog' | 'todo' | 'inprogress' | 'review' | 'done';

export type ViewMode = 'board' | 'list' | 'table' | 'gantt' | 'monitoring';

export interface Attachment {
  id: string;
  name: string;
  type: string; // 'image', 'pdf', 'other'
  url: string;
  size?: string;
}

export interface Tag {
  text: string;
  color: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  dueDate?: string; // ISO String for specific date/time
}

export interface Task {
  id: string;
  title: string;
  description: string;
  // Client/Project Specifics (Backlog Intake)
  clientName?: string;
  clientSegment?: string; // New field for segment
  objective?: string;
  websiteUrl?: string;
  
  coverUrl?: string; // New field for Cover Image

  projectId: string; 
  status: Status;
  priority: Priority;
  progress: number; // 0-100
  tags: Tag[]; 
  attachments: Attachment[];
  checklist: ChecklistItem[]; 
  dueDate?: string;
  assignee?: string; // Username of member
  createdAt: string;
  position?: number; // For manual ordering
  scheduledAt?: string; // New field for future scheduling
}

export interface Metric {
  label: string;
  value: string | number;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
}