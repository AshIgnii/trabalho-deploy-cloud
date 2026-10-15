import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { Note, NoteInput } from './notes/note';
import { NoteCard } from './notes/note-card/note-card';
import { NoteEditor, NoteEditorResult } from './notes/note-editor/note-editor';
import { NotesApi } from './notes/notes-api';
import { Icon } from './shared/icon';

type Layout = 'grid' | 'list';

interface Toast {
  message: string;
  undo?: () => void;
}

const layoutStorageKey = 'notas.layout';

function readLayout(): Layout {
  try {
    return localStorage.getItem(layoutStorageKey) === 'list' ? 'list' : 'grid';
  } catch {
    return 'grid';
  }
}

function byUpdatedAtDesc(a: Note, b: Note): number {
  return b.updatedAt.localeCompare(a.updatedAt);
}

@Component({
  selector: 'app-root',
  imports: [Icon, NoteCard, NoteEditor],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly api = inject(NotesApi);
  private toastTimer?: ReturnType<typeof setTimeout>;

  protected readonly query = signal('');
  private readonly search = toSignal(
    toObservable(this.query).pipe(debounceTime(250), map(query => query.trim()), distinctUntilChanged()),
    { initialValue: '' },
  );

  protected readonly notes = this.api.list(this.search);
  protected readonly pinnedNotes = computed(() => this.notes.value().filter(note => note.pinned).sort(byUpdatedAtDesc));
  protected readonly otherNotes = computed(() => this.notes.value().filter(note => !note.pinned).sort(byUpdatedAtDesc));
  protected readonly isFirstLoad = computed(() => this.notes.isLoading() && this.notes.value().length === 0);

  protected readonly layout = signal<Layout>(readLayout());
  protected readonly editorOpen = signal(false);
  protected readonly editingNote = signal<Note | null>(null);
  protected readonly toast = signal<Toast | null>(null);

  constructor() {
    effect(() => {
      const layout = this.layout();
      try {
        localStorage.setItem(layoutStorageKey, layout);
      } catch {
        return;
      }
    });
  }

  protected toggleLayout(): void {
    this.layout.update(layout => (layout === 'grid' ? 'list' : 'grid'));
  }

  protected openNew(): void {
    this.editingNote.set(null);
    this.editorOpen.set(true);
  }

  protected open(note: Note): void {
    this.editingNote.set(note);
    this.editorOpen.set(true);
  }

  protected closeEditor(): void {
    this.editorOpen.set(false);
    this.editingNote.set(null);
  }

  protected save({ input, newFiles, removedAttachmentIds }: NoteEditorResult): void {
    const note = this.editingNote();
    const request = note ? this.api.update(note.id, input) : this.api.create(input);
    request.pipe(
      switchMap(saved => {
        const operations: Observable<unknown>[] = [
          ...removedAttachmentIds.map(id => this.api.deleteAttachment(id)),
          ...newFiles.map(file => this.api.uploadAttachment(saved.id, file)),
        ];
        return operations.length ? forkJoin(operations).pipe(switchMap(() => this.api.get(saved.id))) : of(saved);
      }),
    ).subscribe({
      next: saved => this.upsert(saved),
      error: () => {
        this.showToast({ message: 'Não foi possível salvar a nota ou seus anexos' });
        this.notes.reload();
      },
    });
  }

  protected togglePin(note: Note): void {
    this.api.update(note.id, { ...this.toInput(note), pinned: !note.pinned }).subscribe({
      next: saved => this.upsert(saved),
      error: () => this.showToast({ message: 'Não foi possível atualizar a nota' }),
    });
  }

  protected removeFromEditor(): void {
    const note = this.editingNote();
    this.closeEditor();
    if (note) {
      this.remove(note);
    }
  }

  protected remove(note: Note): void {
    this.api.delete(note.id).subscribe({
      next: () => {
        this.notes.value.update(notes => notes.filter(item => item.id !== note.id));
        this.showToast(note.attachments.length
          ? { message: 'Nota e anexos excluídos' }
          : { message: 'Nota excluída', undo: () => this.restore(note) });
      },
      error: () => this.showToast({ message: 'Não foi possível excluir a nota' }),
    });
  }

  protected runUndo(toast: Toast): void {
    this.dismissToast();
    toast.undo?.();
  }

  protected dismissToast(): void {
    clearTimeout(this.toastTimer);
    this.toast.set(null);
  }

  private restore(note: Note): void {
    this.api.create(this.toInput(note)).subscribe({
      next: saved => this.upsert(saved),
      error: () => this.showToast({ message: 'Não foi possível restaurar a nota' }),
    });
  }

  private upsert(saved: Note): void {
    this.notes.value.update(notes => [...notes.filter(note => note.id !== saved.id), saved]);
  }

  private toInput(note: Note): NoteInput {
    return { title: note.title, content: note.content, color: note.color, pinned: note.pinned };
  }

  private showToast(toast: Toast): void {
    clearTimeout(this.toastTimer);
    this.toast.set(toast);
    this.toastTimer = setTimeout(() => this.toast.set(null), 5000);
  }
}
