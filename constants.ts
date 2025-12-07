import { Status, Tag } from './types';

export const STATUS_COLUMNS: { id: Status; label: string }[] = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'todo', label: 'A Fazer' },
  { id: 'inprogress', label: 'Em Progresso' },
  { id: 'review', label: 'Revisão' },
  { id: 'done', label: 'Concluído' },
];

export const PRESET_TAGS: Tag[] = [
  { text: 'Extração de Dados', color: '#3b82f6' }, // Blue
  { text: 'Limpeza/ETL', color: '#06b6d4' }, // Cyan
  { text: 'Treinamento IA', color: '#a855f7' }, // Purple
  { text: 'Prompt Engineering', color: '#eab308' }, // Yellow
  { text: 'Automação (Make/Zapier)', color: '#f97316' }, // Orange
  { text: 'Integração API', color: '#22c55e' }, // Green
  { text: 'Dashboard', color: '#ec4899' }, // Pink
  { text: 'Infra/Deploy', color: '#ef4444' }, // Red
  { text: 'Documentação', color: '#737373' }, // Grey
];

export const PRESET_SEGMENTS = [
  'Automotivo',
  'Clínica de Estética',
  'E-commerce',
  'Imobiliária',
  'Jurídico',
  'Saúde/Médico',
  'Educação',
  'Financeiro',
  'Varejo',
  'Marketing Agency'
];

export const ROLES_CONFIG = {
  admin: {
    label: 'Administrador',
    permissions: ['ler', 'editar', 'mover', 'excluir']
  },
  editor: {
    label: 'Gerente (Editor)',
    permissions: ['ler', 'editar', 'mover']
  },
  viewer: {
    label: 'Usuário (Visualizador)',
    permissions: ['ler']
  }
};