import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';

export interface PostCardData {
  id: string;
  authorName: string;
  authorId: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  likesCount: number;
  likedByCurrentUser: boolean;
}

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <article class="post-card">
      <!-- Header -->
      <div class="post-card__header">
        <div class="post-card__avatar">
          {{ getInitials(post.authorName) }}
        </div>
        <div class="post-card__meta">
          <span class="post-card__author">{{ post.authorName }}</span>
          <span class="post-card__dot">·</span>
          <span class="post-card__time">{{ formatTime(post.createdAt) }}</span>
        </div>

        <!-- Owner Menu (only for post author) -->
        <div *ngIf="isOwner()" class="post-card__menu-wrap">
          <button class="menu-trigger" (click)="toggleMenu($event)" title="Post options">
            <i class="pi pi-ellipsis-v"></i>
          </button>
          <div *ngIf="menuOpen()" class="dropdown-menu">
            <button class="dropdown-item" (click)="startEdit()">
              <i class="pi pi-pencil"></i> Edit
            </button>
            <button class="dropdown-item dropdown-item--danger" (click)="confirmDelete()">
              <i class="pi pi-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Content: Normal view -->
      <div class="post-card__content" *ngIf="!isEditing()">
        <p>{{ post.content }}</p>
      </div>

      <!-- Content: Edit mode -->
      <div class="post-card__edit" *ngIf="isEditing()">
        <textarea
          class="edit-textarea"
          [(ngModel)]="editContent"
          rows="3"
          (keydown.escape)="cancelEdit()"
        ></textarea>
        <div class="edit-actions">
          <button class="edit-btn edit-btn--save" [disabled]="!editContent.trim()" (click)="saveEdit()">Save</button>
          <button class="edit-btn edit-btn--cancel" (click)="cancelEdit()">Cancel</button>
        </div>
      </div>

      <!-- Image -->
      <div *ngIf="post.imageUrl" class="post-card__media" (click)="openLightbox()">
        <img [src]="resolveImageUrl(post.imageUrl)" alt="Plant photo" loading="lazy" />
      </div>

      <!-- Actions Row -->
      <div class="post-card__actions">
        <button
          class="action-btn"
          [class.liked]="post.likedByCurrentUser"
          (click)="onLike.emit(post)"
        >
          <i class="pi" [ngClass]="post.likedByCurrentUser ? 'pi-heart-fill' : 'pi-heart'"></i>
          <span *ngIf="post.likesCount > 0">{{ post.likesCount }}</span>
        </button>
        <button class="action-btn" (click)="onComment.emit(post)">
          <i class="pi pi-comment"></i>
        </button>
        <button class="action-btn">
          <i class="pi pi-share-alt"></i>
        </button>
      </div>
    </article>

    <!-- ===== IMAGE LIGHTBOX ===== -->
    <div *ngIf="lightboxOpen()" class="lightbox-overlay" (click)="closeLightbox()">
      <button class="lightbox-close" (click)="closeLightbox()">&times;</button>
      <img
        class="lightbox-image"
        [src]="resolveImageUrl(post.imageUrl!)"
        alt="Full size"
        (click)="$event.stopPropagation()"
      />
    </div>

    <!-- ===== DELETE CONFIRMATION ===== -->
    <div *ngIf="deleteConfirmOpen()" class="confirm-overlay" (click)="deleteConfirmOpen.set(false)">
      <div class="confirm-dialog" (click)="$event.stopPropagation()">
        <h3>Delete Post?</h3>
        <p>This can't be undone and it will be removed from your profile.</p>
        <div class="confirm-actions">
          <button class="confirm-btn confirm-btn--delete" (click)="doDelete()">Delete</button>
          <button class="confirm-btn confirm-btn--cancel" (click)="deleteConfirmOpen.set(false)">Cancel</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ===========================
       POST CARD
       =========================== */
    .post-card {
      background: var(--trellis-white);
      border-bottom: 1px solid var(--trellis-border-light);
      padding: 16px 20px;
      transition: background 0.15s ease;
    }
    .post-card:hover {
      background: var(--trellis-green-ghost);
    }

    /* ---------- Header ---------- */
    .post-card__header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
      position: relative;
    }

    .post-card__avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--trellis-green), var(--trellis-green-dark));
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.8rem;
      flex-shrink: 0;
      letter-spacing: 0.5px;
    }

    .post-card__meta {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 1;
      min-width: 0;
    }

    .post-card__author {
      font-weight: 600;
      color: var(--trellis-text);
      font-size: 0.95rem;
    }

    .post-card__dot {
      color: var(--trellis-text-hint);
      font-size: 0.8rem;
    }

    .post-card__time {
      font-size: 0.82rem;
      color: var(--trellis-text-hint);
    }

    /* ---------- Owner Menu ---------- */
    .post-card__menu-wrap {
      position: relative;
      margin-left: auto;
    }

    .menu-trigger {
      width: 32px;
      height: 32px;
      border: none;
      background: none;
      border-radius: 50%;
      cursor: pointer;
      color: var(--trellis-text-hint);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }
    .menu-trigger:hover {
      background: var(--trellis-green-pale);
      color: var(--trellis-green-dark);
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      background: var(--trellis-white);
      border: 1px solid var(--trellis-border-light);
      border-radius: var(--trellis-radius-md);
      box-shadow: var(--trellis-shadow-lg);
      min-width: 140px;
      z-index: 200;
      overflow: hidden;
      animation: dropdown-in 0.12s ease;
    }

    @keyframes dropdown-in {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 10px 14px;
      border: none;
      background: none;
      font-family: 'Inter', sans-serif;
      font-size: 0.88rem;
      color: var(--trellis-text);
      cursor: pointer;
      transition: background 0.12s ease;
    }
    .dropdown-item:hover { background: var(--trellis-green-pale); }
    .dropdown-item--danger { color: #E53E3E; }
    .dropdown-item--danger:hover { background: #FFF5F5; }

    /* ---------- Content ---------- */
    .post-card__content p {
      margin: 0;
      font-size: 0.95rem;
      line-height: 1.55;
      color: var(--trellis-text);
      word-wrap: break-word;
    }

    /* ---------- Edit Mode ---------- */
    .post-card__edit {
      margin-bottom: 8px;
    }

    .edit-textarea {
      width: 100%;
      border: 2px solid var(--trellis-border-light);
      border-radius: var(--trellis-radius-md);
      padding: 10px 12px;
      font-family: 'Inter', sans-serif;
      font-size: 0.95rem;
      line-height: 1.55;
      color: var(--trellis-text);
      background: var(--trellis-white);
      resize: none;
      outline: none;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      box-sizing: border-box;
    }
    .edit-textarea:focus {
      border-color: var(--trellis-green);
      box-shadow: 0 0 0 3px rgba(56, 142, 60, 0.12);
    }

    .edit-actions {
      display: flex;
      gap: 8px;
      margin-top: 8px;
      justify-content: flex-end;
    }

    .edit-btn {
      padding: 6px 18px;
      border: none;
      border-radius: 16px;
      font-family: 'Inter', sans-serif;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .edit-btn--save {
      background: var(--trellis-green);
      color: #fff;
    }
    .edit-btn--save:hover:not(:disabled) { background: var(--trellis-green-dark); }
    .edit-btn--save:disabled { opacity: 0.5; cursor: not-allowed; }
    .edit-btn--cancel {
      background: var(--trellis-border-light);
      color: var(--trellis-text-secondary);
    }
    .edit-btn--cancel:hover { background: #e0e0e0; }

    /* ---------- Media ---------- */
    .post-card__media {
      margin-top: 12px;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid var(--trellis-border-light);
      cursor: pointer;
    }

    .post-card__media img {
      width: 100%;
      display: block;
      object-fit: cover;
      max-height: 500px;
      transition: filter 0.2s ease;
    }
    .post-card__media:hover img {
      filter: brightness(0.92);
    }

    /* ---------- Actions ---------- */
    .post-card__actions {
      display: flex;
      gap: 4px;
      margin-top: 10px;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border: none;
      background: none;
      border-radius: 20px;
      font-size: 0.85rem;
      color: var(--trellis-text-secondary);
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: 'Inter', sans-serif;
    }
    .action-btn:hover {
      background: var(--trellis-green-pale);
      color: var(--trellis-green-dark);
    }
    .action-btn i { font-size: 1.05rem; }

    /* ❤️ Liked state — RED filled heart */
    .action-btn.liked {
      color: #E53E3E;
    }
    .action-btn.liked:hover {
      background: #FFF5F5;
      color: #C53030;
    }

    /* ===========================
       LIGHTBOX (z-index: 9999)
       =========================== */
    .lightbox-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      cursor: pointer;
      animation: lightbox-fade 0.2s ease;
    }

    @keyframes lightbox-fade {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .lightbox-image {
      max-width: 90vw;
      max-height: 90vh;
      object-fit: contain;
      border-radius: 8px;
      cursor: default;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    }

    .lightbox-close {
      position: absolute;
      top: 16px;
      right: 20px;
      width: 40px;
      height: 40px;
      border: none;
      background: rgba(255,255,255,0.15);
      color: #fff;
      font-size: 1.6rem;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s ease;
      z-index: 10000;
    }
    .lightbox-close:hover {
      background: rgba(255,255,255,0.3);
    }

    /* ===========================
       DELETE CONFIRMATION
       =========================== */
    .confirm-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
    }

    .confirm-dialog {
      background: var(--trellis-white);
      border-radius: var(--trellis-radius-lg);
      padding: 28px 32px;
      min-width: 320px;
      max-width: 380px;
      box-shadow: var(--trellis-shadow-lg);
      text-align: center;
      animation: dialog-in 0.2s ease;
    }

    @keyframes dialog-in {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }

    .confirm-dialog h3 {
      margin: 0 0 8px;
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--trellis-text);
    }

    .confirm-dialog p {
      margin: 0 0 20px;
      font-size: 0.9rem;
      color: var(--trellis-text-secondary);
      line-height: 1.4;
    }

    .confirm-actions {
      display: flex;
      gap: 10px;
      justify-content: center;
    }

    .confirm-btn {
      padding: 8px 24px;
      border: none;
      border-radius: 20px;
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .confirm-btn--delete { background: #E53E3E; color: #fff; }
    .confirm-btn--delete:hover { background: #C53030; }
    .confirm-btn--cancel { background: var(--trellis-border-light); color: var(--trellis-text-secondary); }
    .confirm-btn--cancel:hover { background: #e0e0e0; }
  `]
})
export class PostCardComponent {
  @Input({ required: true }) post!: PostCardData;
  @Output() onLike = new EventEmitter<PostCardData>();
  @Output() onComment = new EventEmitter<PostCardData>();
  @Output() onDelete = new EventEmitter<string>();
  @Output() onEdit = new EventEmitter<{ id: string; content: string }>();

  private authService = inject(AuthService);

  // Signals for UI state
  menuOpen = signal(false);
  lightboxOpen = signal(false);
  deleteConfirmOpen = signal(false);
  isEditing = signal(false);
  editContent = '';

  /** Show owner menu only if current user authored this post */
  isOwner(): boolean {
    const user = this.authService.currentUser();
    return !!user && user.id === this.post.authorId;
  }

  // ---- Menu ----
  toggleMenu(event: Event) {
    event.stopPropagation();
    this.menuOpen.update(v => !v);
  }

  // ---- Edit ----
  startEdit() {
    this.editContent = this.post.content;
    this.isEditing.set(true);
    this.menuOpen.set(false);
  }

  cancelEdit() {
    this.isEditing.set(false);
  }

  saveEdit() {
    if (this.editContent.trim()) {
      this.onEdit.emit({ id: this.post.id, content: this.editContent });
      this.isEditing.set(false);
    }
  }

  // ---- Delete ----
  confirmDelete() {
    this.menuOpen.set(false);
    this.deleteConfirmOpen.set(true);
  }

  doDelete() {
    this.deleteConfirmOpen.set(false);
    this.onDelete.emit(this.post.id);
  }

  // ---- Lightbox ----
  openLightbox() {
    this.lightboxOpen.set(true);
  }

  closeLightbox() {
    this.lightboxOpen.set(false);
  }

  // ---- Helpers ----
  resolveImageUrl(url: string): string {
    if (url.startsWith('http')) return url;
    return 'http://localhost:8080' + url;
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'now';
    if (diffMin < 60) return diffMin + 'm';
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return diffHr + 'h';
    const diffDay = Math.floor(diffHr / 24);
    return diffDay + 'd';
  }
}
