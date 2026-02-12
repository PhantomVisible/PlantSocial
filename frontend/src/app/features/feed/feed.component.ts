import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostComposerComponent } from './post-composer.component';
import { PostCardComponent, PostCardData } from './post-card.component';
import { FeedService, Post } from './feed.service';
import { AuthService } from '../../auth/auth.service';
import { DialogModule } from 'primeng/dialog';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PostComposerComponent,
    PostCardComponent,
    DialogModule,
    InputTextareaModule,
    ButtonModule
  ],
  template: `
    <!-- ===== Top Nav Bar ===== -->
    <nav class="feed-nav">
      <div class="feed-nav__inner">
        <div class="feed-nav__brand">
          <i class="pi pi-sun brand-icon"></i>
          <span class="brand-name">trellis</span>
        </div>
        <div class="feed-nav__actions">
          <button class="nav-btn" (click)="logout()">
            <i class="pi pi-sign-out"></i>
            <span>Log out</span>
          </button>
        </div>
      </div>
    </nav>

    <!-- ===== Feed Container ===== -->
    <div class="feed-layout">
      <div class="feed-column">

        <!-- Feed Header -->
        <div class="feed-header">
          <h2>Home</h2>
        </div>

        <!-- Composer -->
        <app-post-composer (postCreated)="createPost($event)"></app-post-composer>

        <!-- Post List -->
        <div class="feed-list">
          <app-post-card
            *ngFor="let post of posts()"
            [post]="post"
            (onLike)="toggleLike($event)"
            (onComment)="openCommentDialog($event)"
            (onDelete)="deletePost($event)"
            (onEdit)="editPost($event)"
          ></app-post-card>

          <div *ngIf="posts().length === 0" class="feed-empty">
            <i class="pi pi-sun empty-icon"></i>
            <p>Nothing here yet.</p>
            <span>Share what's growing in your garden!</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Comment Dialog -->
    <p-dialog
      header="Add Comment"
      [(visible)]="commentDialogVisible"
      [modal]="true"
      [style]="{ width: '480px' }"
      [draggable]="false"
      [resizable]="false"
    >
      <div style="margin-top: 12px">
        <textarea
          pInputTextarea
          [(ngModel)]="commentContent"
          [rows]="3"
          placeholder="Write a comment..."
          style="width: 100%; resize: none"
        ></textarea>
      </div>
      <ng-template pTemplate="footer">
        <p-button label="Cancel" (onClick)="commentDialogVisible = false" [text]="true" severity="secondary"></p-button>
        <p-button label="Comment" (onClick)="submitComment()" [disabled]="!commentContent.trim()"></p-button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: var(--trellis-bg);
    }

    /* ===== Nav Bar ===== */
    .feed-nav {
      background: var(--trellis-white);
      border-bottom: 1px solid var(--trellis-border-light);
      position: sticky;
      top: 0;
      z-index: 100;
      height: 53px;
      display: flex;
      align-items: center;
      padding: 0 24px;
    }

    .feed-nav__inner {
      max-width: 600px;
      width: 100%;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .feed-nav__brand {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .brand-icon {
      font-size: 1.3rem;
      color: var(--trellis-green);
    }

    .brand-name {
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--trellis-green-dark);
      letter-spacing: -0.5px;
    }

    .nav-btn {
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

    .nav-btn:hover {
      background: var(--trellis-green-pale);
      color: var(--trellis-green-dark);
    }

    /* ===== Feed Layout ===== */
    .feed-layout {
      display: flex;
      justify-content: center;
    }

    .feed-column {
      width: 100%;
      max-width: 600px;
      min-height: calc(100vh - 53px);
      background: var(--trellis-white);
      border-left: 1px solid var(--trellis-border-light);
      border-right: 1px solid var(--trellis-border-light);
    }

    .feed-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--trellis-border-light);
      position: sticky;
      top: 53px;
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      z-index: 50;
    }

    .feed-header h2 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--trellis-text);
    }

    /* Empty State */
    .feed-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 20px;
      color: var(--trellis-text-hint);
    }

    .empty-icon {
      font-size: 2.5rem;
      color: var(--trellis-green-pale);
      margin-bottom: 12px;
    }

    .feed-empty p {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--trellis-text);
      margin: 0;
    }

    .feed-empty span {
      font-size: 0.9rem;
      margin-top: 4px;
    }
  `]
})
export class FeedComponent implements OnInit {
  private feedService = inject(FeedService);
  private authService = inject(AuthService);

  posts = signal<Post[]>([]);

  // Comment state
  commentDialogVisible = false;
  selectedPost: Post | null = null;
  commentContent = '';

  ngOnInit() {
    this.loadFeed();
  }

  loadFeed() {
    this.feedService.getFeed().subscribe({
      next: (response) => this.posts.set(response.content),
      error: (err) => console.error('Failed to load feed', err)
    });
  }

  createPost(event: { content: string; file?: File }) {
    this.feedService.createPost(event.content, event.file).subscribe({
      next: (post) => this.posts.update(current => [post, ...current]),
      error: (err) => console.error('Failed to create post', err)
    });
  }

  toggleLike(post: Post) {
    this.posts.update(current => current.map(p => {
      if (p.id === post.id) {
        return {
          ...p,
          likedByCurrentUser: !p.likedByCurrentUser,
          likesCount: p.likedByCurrentUser ? p.likesCount - 1 : p.likesCount + 1
        };
      }
      return p;
    }));

    this.feedService.likePost(post.id).subscribe({
      error: () => {
        this.posts.update(current => current.map(p => {
          if (p.id === post.id) {
            return {
              ...p,
              likedByCurrentUser: !p.likedByCurrentUser,
              likesCount: p.likedByCurrentUser ? p.likesCount - 1 : p.likesCount + 1
            };
          }
          return p;
        }));
      }
    });
  }

  openCommentDialog(post: Post) {
    this.selectedPost = post;
    this.commentContent = '';
    this.commentDialogVisible = true;
  }

  submitComment() {
    if (!this.selectedPost || !this.commentContent.trim()) return;
    this.feedService.commentOnPost(this.selectedPost.id, { content: this.commentContent }).subscribe({
      next: () => { this.commentDialogVisible = false; },
      error: (err) => console.error('Failed to comment', err)
    });
  }

  logout() {
    this.authService.logout();
  }

  deletePost(postId: string) {
    this.feedService.deletePost(postId).subscribe({
      next: () => this.posts.update(current => current.filter(p => p.id !== postId)),
      error: (err) => console.error('Failed to delete post', err)
    });
  }

  editPost(event: { id: string; content: string }) {
    this.feedService.editPost(event.id, event.content).subscribe({
      next: (updated) => this.posts.update(current =>
        current.map(p => p.id === updated.id ? updated : p)
      ),
      error: (err) => console.error('Failed to edit post', err)
    });
  }
}
