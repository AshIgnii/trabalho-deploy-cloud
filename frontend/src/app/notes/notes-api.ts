import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Injectable, Signal } from '@angular/core';
import { Attachment, Note, NoteInput } from './note';

@Injectable({ providedIn: 'root' })
export class NotesApi {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/notes';

  list(search: Signal<string>) {
    return httpResource<Note[]>(() => {
      const params: Record<string, string> = {};
      if (search()) {
        params['search'] = search();
      }
      return { url: this.url, params };
    }, { defaultValue: [] });
  }

  get(id: number) {
    return this.http.get<Note>(`${this.url}/${id}`);
  }

  create(input: NoteInput) {
    return this.http.post<Note>(this.url, input);
  }

  update(id: number, input: NoteInput) {
    return this.http.put<Note>(`${this.url}/${id}`, input);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  uploadAttachment(noteId: number, file: File) {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<Attachment>(`${this.url}/${noteId}/attachments`, body);
  }

  deleteAttachment(id: number) {
    return this.http.delete<void>(`/api/attachments/${id}`);
  }

  attachmentDownloadUrl(id: number): string {
    return `/api/attachments/${id}/download`;
  }
}
