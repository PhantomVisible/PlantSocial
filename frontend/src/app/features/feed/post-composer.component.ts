import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-post-composer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="composer">
      <div class="composer__avatar">
        <i class="pi pi-user"></i>
      </div>
      <div class="composer__body">
        <textarea
          class="composer__input"
          [(ngModel)]="content"
          placeholder="What's growing on?"
          rows="2"
          (input)="autoResize($event)"
        ></textarea>

        <!-- Image Preview -->
        <div *ngIf="previewUrl" class="composer__preview">
          <img [src]="previewUrl" alt="Attached image" />
          <button class="preview-remove" (click)="removeFile()">&times;</button>
        </div>

        <div class="composer__toolbar">
          <div class="composer__icons">
            <button class="icon-btn" title="Add image" (click)="fileInput.click()">
              <i class="pi pi-image"></i>
            </button>
            <button class="icon-btn" title="Add location">
              <i class="pi pi-map-marker"></i>
            </button>
          </div>
          <button
            class="composer__post-btn"
            [disabled]="!content.trim()"
            (click)="submitPost()"
          >
            Post
          </button>
        </div>
      </div>
    </div>

    <!-- Hidden file input -->
    <input
      #fileInput
      type="file"
      accept="image/*"
      (change)="onFileSelected($event)"
      style="display: none"
    />
  `,
  styles: [`
    .composer {
      display: flex;
      gap: 12px;
      padding: 16px 20px;
      background: var(--trellis-white);
      border-bottom: 1px solid var(--trellis-border-light);
    }

    .composer__avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: var(--trellis-green-pale);
      color: var(--trellis-green-dark);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .composer__body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .composer__input {
      width: 100%;
      border: none;
      outline: none;
      resize: none;
      font-family: 'Inter', sans-serif;
      font-size: 1.05rem;
      line-height: 1.5;
      color: var(--trellis-text);
      background: transparent;
      padding: 8px 0;
      min-height: 52px;
    }

    .composer__input::placeholder {
      color: var(--trellis-text-hint);
    }

    /* Image Preview */
    .composer__preview {
      position: relative;
      border-radius: var(--trellis-radius-lg);
      overflow: hidden;
      border: 1px solid var(--trellis-border-light);
      max-height: 200px;
    }

    .composer__preview img {
      width: 100%;
      display: block;
      object-fit: cover;
      max-height: 200px;
    }

    .preview-remove {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: none;
      background: rgba(0,0,0,0.6);
      color: #fff;
      font-size: 1.1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      transition: background 0.15s ease;
    }

    .preview-remove:hover {
      background: rgba(0,0,0,0.8);
    }

    .composer__toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--trellis-border-light);
      padding-top: 12px;
    }

    .composer__icons {
      display: flex;
      gap: 4px;
    }

    .icon-btn {
      width: 34px;
      height: 34px;
      border: none;
      background: none;
      border-radius: 50%;
      color: var(--trellis-green);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      transition: all 0.15s ease;
    }

    .icon-btn:hover {
      background: var(--trellis-green-pale);
    }

    .composer__post-btn {
      padding: 8px 24px;
      border: none;
      border-radius: 20px;
      background: var(--trellis-green);
      color: #fff;
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .composer__post-btn:hover:not(:disabled) {
      background: var(--trellis-green-dark);
    }

    .composer__post-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class PostComposerComponent {
  content = '';
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  @Output() postCreated = new EventEmitter<{ content: string; file?: File }>();

  autoResize(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      // Generate preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  removeFile() {
    this.selectedFile = null;
    this.previewUrl = null;
  }

  submitPost() {
    if (this.content.trim()) {
      this.postCreated.emit({
        content: this.content,
        file: this.selectedFile || undefined
      });
      this.content = '';
      this.selectedFile = null;
      this.previewUrl = null;
    }
  }
}
