export type NoteColor = 'default' | 'yellow' | 'orange' | 'red' | 'pink' | 'purple' | 'blue' | 'teal' | 'green';

export interface Attachment {
  id: number;
  noteId: number;
  fileName: string;
  contentType: string;
  size: number;
  createdAt: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  color: NoteColor;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  attachments: Attachment[];
}

export type NoteInput = Pick<Note, 'title' | 'content' | 'color' | 'pinned'>;

export const maxAttachmentSize = 10 * 1024 * 1024;

export const noteColors: readonly { value: NoteColor; label: string }[] = [
  { value: 'default', label: 'Padrão' },
  { value: 'yellow', label: 'Amarelo' },
  { value: 'orange', label: 'Laranja' },
  { value: 'red', label: 'Vermelho' },
  { value: 'pink', label: 'Rosa' },
  { value: 'purple', label: 'Roxo' },
  { value: 'blue', label: 'Azul' },
  { value: 'teal', label: 'Verde-água' },
  { value: 'green', label: 'Verde' },
];

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1).replace('.', ',')} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

export function formatNoteDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (date.toDateString() === now.toDateString()) {
    return `Hoje, ${time}`;
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Ontem, ${time}`;
  }
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  });
}
