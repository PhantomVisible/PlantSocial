import { Component, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-add-plant-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="dialog-overlay" (click)="close.emit()">
      <div class="dialog" (click)="$event.stopPropagation()">
        <div class="dialog__header">
          <h2>Add a New Plant 🌱</h2>
          <button class="dialog__close" (click)="close.emit()">&times;</button>
        </div>

        <div class="dialog__body">
          <!-- Image Upload -->
          <div
            class="upload-zone"
            [class.has-image]="previewUrl()"
            (click)="fileInput.click()"
          >
            <img *ngIf="previewUrl()" [src]="previewUrl()" alt="Plant preview" />
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

          <!-- Nickname -->
          <div class="field">
            <label>Nickname *</label>
            <input
              type="text"
              [(ngModel)]="nickname"
              placeholder="e.g., Mr. Prickles"
              maxlength="100"
            />
          </div>

          <!-- Species -->
          <div class="field">
            <label>Species</label>
            <input
              type="text"
              [(ngModel)]="species"
              placeholder="e.g., Cactus, Monstera"
              maxlength="200"
            />
          </div>
        </div>

        <div class="dialog__footer">
          <button class="btn btn--cancel" (click)="close.emit()">Cancel</button>
          <button
            class="btn btn--save"
            [disabled]="!nickname.trim()"
            (click)="submit()"
          >
            Add to Garden
          </button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .dialog-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fade-in 0.15s ease;
    }
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .dialog {
      background: var(--trellis-white);
      border-radius: var(--trellis-radius-lg);
      width: 90%;
      max-width: 440px;
      box-shadow: 0 16px 48px rgba(0,0,0,0.2);
      animation: slide-up 0.2s ease;
    }
    @keyframes slide-up {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .dialog__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px 0;
    }
    .dialog__header h2 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--trellis-text);
    }
    .dialog__close {
      width: 32px; height: 32px;
      border: none; background: none;
      font-size: 1.4rem;
      color: var(--trellis-text-hint);
      cursor: pointer;
      border-radius: 50%;
      transition: all 0.15s ease;
    }
    .dialog__close:hover {
      background: var(--trellis-green-pale);
      color: var(--trellis-text);
    }

    .dialog__body {
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* Upload */
    .upload-zone {
      width: 100%;
      aspect-ratio: 16/10;
      border: 2px dashed var(--trellis-border-light);
      border-radius: var(--trellis-radius-md);
      overflow: hidden;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .upload-zone:hover {
      border-color: var(--trellis-green);
      background: var(--trellis-green-ghost);
    }
    .upload-zone.has-image {
      border-style: solid;
    }
    .upload-zone img {
      width: 100%; height: 100%;
      object-fit: cover;
    }
    .upload-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      color: var(--trellis-text-hint);
    }
    .upload-placeholder i { font-size: 1.5rem; }
    .upload-placeholder span { font-size: 0.85rem; }

    /* Fields */
    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .field label {
      font-weight: 600;
      font-size: 0.82rem;
      color: var(--trellis-text-secondary);
    }
    .field input {
      padding: 10px 14px;
      border: 1px solid var(--trellis-border-light);
      border-radius: var(--trellis-radius-md);
      font-family: 'Inter', sans-serif;
      font-size: 0.95rem;
      color: var(--trellis-text);
      outline: none;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .field input:focus {
      border-color: var(--trellis-green);
      box-shadow: 0 0 0 3px rgba(56,142,60,0.1);
    }

    /* Footer */
    .dialog__footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 0 24px 20px;
    }
    .btn {
      padding: 9px 20px;
      border: none;
      border-radius: 20px;
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      font-size: 0.88rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn--cancel {
      background: var(--trellis-border-light);
      color: var(--trellis-text-secondary);
    }
    .btn--cancel:hover { background: #e0e0e0; }
    .btn--save {
      background: var(--trellis-green);
      color: #fff;
    }
    .btn--save:hover:not(:disabled) { background: var(--trellis-green-dark); }
    .btn--save:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class AddPlantDialogComponent {
    @Output() close = new EventEmitter<void>();
    @Output() plantAdded = new EventEmitter<{ nickname: string; species: string; image?: File }>();

    nickname = '';
    species = '';
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
        if (!this.nickname.trim()) return;
        this.plantAdded.emit({
            nickname: this.nickname.trim(),
            species: this.species.trim(),
            image: this.selectedFile || undefined
        });
    }
}
