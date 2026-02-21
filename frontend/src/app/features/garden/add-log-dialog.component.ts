import { Component, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-log-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dialog-overlay" (click)="close.emit()">
      <div class="dialog" (click)="$event.stopPropagation()">
        <div class="dialog__header">
          <h2>Add Growth Log 📝</h2>
          <button class="dialog__close" (click)="close.emit()">&times;</button>
        </div>

        <div class="dialog__body">
          <!-- Image Upload -->
          <div
            class="upload-zone"
            [class.has-image]="previewUrl()"
            (click)="fileInput.click()"
          >
            <img *ngIf="previewUrl()" [src]="previewUrl()" alt="Log preview" />
            <div *ngIf="!previewUrl()" class="upload-placeholder">
              <i class="pi pi-camera"></i>
              <span>Add a photo</span>
            </div>
          </div>
          <input
            #fileInput
            type="file"
            accept="image/*"
            (change)="onFileSelected($event)"
            style="display: none"
          />

          <!-- Date -->
          <div class="field">
            <label>Date</label>
            <input type="date" [(ngModel)]="logDate" />
          </div>

          <!-- Notes -->
          <div class="field">
            <label>Notes</label>
            <textarea
              [(ngModel)]="notes"
              placeholder="e.g., First new leaf appears! Re-potted into larger pot."
              rows="4"
            ></textarea>
          </div>
        </div>

        <div class="dialog__footer">
          <button class="btn btn--cancel" (click)="close.emit()">Cancel</button>
          <button
            class="btn btn--save"
            [disabled]="!notes && !selectedFile"
            (click)="submit()"
          >
            Save Log
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      backdrop-filter: blur(4px); z-index: 10001;
      display: flex; align-items: center; justify-content: center;
      animation: fade-in 0.15s ease;
    }
    .dialog {
      background: var(--surface-card); width: 90%; max-width: 400px;
      border-radius: 16px; box-shadow: 0 16px 48px rgba(0,0,0,0.2);
      animation: slide-up 0.2s ease; overflow: hidden;
    }
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slide-up { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    .dialog__header {
      padding: 16px 20px; display: flex; justify-content: space-between; align-items: center;
      border-bottom: 1px solid var(--surface-border);
    }
    .dialog__header h2 { margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--text-color); }
    .dialog__close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-color-secondary); }
    
    .dialog__body { padding: 20px; display: flex; flex-direction: column; gap: 16px; }

    .upload-zone {
      width: 100%; aspect-ratio: 16/9;
      border: 2px dashed var(--surface-border); border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; overflow: hidden; background: var(--surface-ground);
    }
    .upload-zone.has-image { border-style: solid; }
    .upload-zone img { width: 100%; height: 100%; object-fit: cover; }
    .upload-placeholder { display: flex; flex-direction: column; align-items: center; gap: 4px; color: var(--text-color-secondary); }
    
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { font-size: 0.8rem; font-weight: 600; color: var(--text-color-secondary); }
    .field input, .field textarea {
      padding: 10px; border: 1px solid var(--surface-border); border-radius: 8px;
      font-family: inherit; font-size: 0.9rem;
      background: var(--surface-ground); color: var(--text-color);
    }
    .field input:focus, .field textarea:focus { border-color: var(--primary-color); outline: none; }

    .dialog__footer { padding: 16px 20px; display: flex; justify-content: flex-end; gap: 10px; background: var(--surface-ground); border-top: 1px solid var(--surface-border); }
    .btn { padding: 8px 16px; border-radius: 20px; border: none; font-weight: 600; cursor: pointer; }
    .btn--cancel { background: var(--surface-border); color: var(--text-color); }
    .btn--save { background: var(--primary-color); color: #fff; }
    .btn--save:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class AddLogDialogComponent {
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{ notes: string; logDate: string; image?: File }>();

  notes = '';
  logDate = new Date().toISOString().split('T')[0];
  selectedFile: File | null = null;
  previewUrl = signal<string | null>(null);

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => this.previewUrl.set(e.target?.result as string);
      reader.readAsDataURL(this.selectedFile);
    }
  }

  submit() {
    this.save.emit({
      notes: this.notes,
      logDate: this.logDate,
      image: this.selectedFile || undefined
    });
  }
}
