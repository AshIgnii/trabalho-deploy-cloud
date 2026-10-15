import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Icon } from '../../shared/icon';
import {
  Attachment,
  formatFileSize,
  formatNoteDate,
  maxAttachmentSize,
  Note,
  NoteColor,
  noteColors,
  NoteInput,
} from '../note';
import { NotesApi } from '../notes-api';

export interface NoteEditorResult {
  input: NoteInput;
  newFiles: File[];
  removedAttachmentIds: number[];
}

@Component({
  selector: 'app-note-editor',
  imports: [Icon],
  templateUrl: './note-editor.html',
  styleUrl: './note-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoteEditor {
  private readonly api = inject(NotesApi);

  readonly note = input<Note | null>(null);

  readonly saved = output<NoteEditorResult>();
  readonly removed = output<void>();
  readonly closed = output<void>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly titleInput = viewChild.required<ElementRef<HTMLInputElement>>('titleInput');

  protected readonly colors = noteColors;
  protected readonly formatFileSize = formatFileSize;
  protected readonly title = linkedSignal(() => this.note()?.title ?? '');
  protected readonly content = linkedSignal(() => this.note()?.content ?? '');
  protected readonly color = linkedSignal<NoteColor>(() => this.note()?.color ?? 'default');
  protected readonly pinned = linkedSignal(() => this.note()?.pinned ?? false);
  protected readonly showColors = signal(false);
  protected readonly pendingFiles = signal<File[]>([]);
  protected readonly removedAttachmentIds = signal<number[]>([]);
  protected readonly fileError = signal('');
  protected readonly isDragging = signal(false);

  protected readonly attachments = computed(() => {
    const removed = this.removedAttachmentIds();
    return (this.note()?.attachments ?? []).filter(attachment => !removed.includes(attachment.id));
  });

  protected readonly hasAttachments = computed(() => this.attachments().length > 0 || this.pendingFiles().length > 0);

  protected readonly dateLabel = computed(() => {
    const note = this.note();
    return note ? `Editada · ${formatNoteDate(note.updatedAt)}` : 'Nova nota';
  });

  private readonly isDirty = computed(() => {
    const note = this.note();
    if (!note || this.pendingFiles().length || this.removedAttachmentIds().length) {
      return true;
    }
    return note.title !== this.title().trim()
      || note.content !== this.content()
      || note.color !== this.color()
      || note.pinned !== this.pinned();
  });

  constructor() {
    afterNextRender(() => {
      this.dialog().nativeElement.showModal();
      if (!this.note()) {
        this.titleInput().nativeElement.focus();
      }
    });
  }

  protected close(): void {
    const input: NoteInput = {
      title: this.title().trim(),
      content: this.content(),
      color: this.color(),
      pinned: this.pinned(),
    };
    const isEmpty = !input.title && !input.content.trim() && !this.hasAttachments();
    if (this.isDirty() && !(isEmpty && !this.note())) {
      this.saved.emit({
        input,
        newFiles: this.pendingFiles(),
        removedAttachmentIds: this.removedAttachmentIds(),
      });
    }
    this.closed.emit();
  }

  protected onCancel(event: Event): void {
    event.preventDefault();
    this.close();
  }

  protected onDialogClick(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) {
      this.close();
    }
  }

  protected onFilesSelected(fileInput: HTMLInputElement): void {
    if (fileInput.files) {
      this.addFiles(fileInput.files);
    }
    fileInput.value = '';
  }

  protected onDragOver(event: DragEvent): void {
    if (event.dataTransfer?.types.includes('Files')) {
      event.preventDefault();
      this.isDragging.set(true);
    }
  }

  protected onDragLeave(event: DragEvent): void {
    const related = event.relatedTarget;
    if (!(related instanceof Node) || !this.dialog().nativeElement.contains(related)) {
      this.isDragging.set(false);
    }
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    if (event.dataTransfer?.files.length) {
      this.addFiles(event.dataTransfer.files);
    }
  }

  protected removePendingFile(file: File): void {
    this.pendingFiles.update(files => files.filter(item => item !== file));
  }

  protected removeAttachment(attachment: Attachment): void {
    this.removedAttachmentIds.update(ids => [...ids, attachment.id]);
  }

  protected downloadUrl(attachment: Attachment): string {
    return this.api.attachmentDownloadUrl(attachment.id);
  }

  protected isImage(contentType: string): boolean {
    return contentType.startsWith('image/');
  }

  private addFiles(fileList: FileList): void {
    const files = Array.from(fileList);
    const accepted = files.filter(file => file.size > 0 && file.size <= maxAttachmentSize);
    const rejected = files.length - accepted.length;
    this.fileError.set(
      rejected
        ? `${rejected === 1 ? '1 arquivo ignorado' : `${rejected} arquivos ignorados`}: o limite é ${formatFileSize(maxAttachmentSize)} por arquivo.`
        : '',
    );
    this.pendingFiles.update(current => [...current, ...accepted]);
  }
}
