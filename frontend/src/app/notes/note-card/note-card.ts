import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Icon } from '../../shared/icon';
import { formatNoteDate, Note } from '../note';

@Component({
  selector: 'app-note-card',
  imports: [Icon],
  templateUrl: './note-card.html',
  styleUrl: './note-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoteCard {
  readonly note = input.required<Note>();

  readonly opened = output<void>();
  readonly pinToggled = output<void>();
  readonly removed = output<void>();

  protected readonly date = computed(() => formatNoteDate(this.note().updatedAt));
}
