import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommentService, CommentData } from './comment.service';
import { AuthService } from '../../auth/auth.service';
import { AuthGatekeeperService } from '../../auth/auth-gatekeeper.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';

@Component({
  selector: 'app-comment-thread',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarComponent],
  template: `
    <div class="thread">
      <!-- New comment input -->
      <div class="thread__compose">
        <div class="thread__compose-avatar-wrap">
          <app-avatar 
            [imageUrl]="resolveImageUrl(authService.currentUser()?.profilePictureUrl || '')" 
            [name]="authService.currentUser()?.fullName || authService.currentUser()?.username || 'User'" 
            [size]="32">
          </app-avatar>
        </div>
        <div class="thread__compose-input-wrap">
          <textarea
            class="thread__compose-input"
            [(ngModel)]="newCommentText"
            placeholder="Post your reply..."
            rows="1"
            (keydown.enter)="$event.preventDefault(); submitComment()"
            (input)="autoGrow($event)"
          ></textarea>
          <button
            class="thread__compose-btn"
            [disabled]="!newCommentText.trim()"
            (click)="submitComment()"
          >
            Reply
          </button>
        </div>
      </div>

      <!-- Comment List -->
      <div class="thread__list">
        <div *ngFor="let comment of comments()" class="comment">
          <div class="comment__line" *ngIf="comment._replies && comment._replies.length > 0"></div>
          <div class="comment__avatar-wrap">
            <app-avatar 
              [imageUrl]="resolveImageUrl(comment.authorProfilePictureUrl || '')" 
              [name]="comment.authorName" 
              [size]="32">
            </app-avatar>
          </div>
          <div class="comment__body">
            <div class="comment__header">
              <span class="comment__author">{{ comment.authorName }}</span>
              <span class="comment__time">{{ formatTime(comment.createdAt) }}</span>
            </div>
            <p class="comment__text">{{ comment.content }}</p>
            <div class="comment__actions">
              <button
                class="comment__action-btn"
                (click)="toggleReplyInput(comment)"
              >
                <i class="pi pi-corner-down-right"></i> Reply
              </button>
              <span *ngIf="comment.replyCount > 0 && !comment._repliesLoaded" class="comment__view-replies">
                <button class="comment__action-btn" (click)="loadReplies(comment)">
                  <i class="pi pi-chevron-down"></i> View {{ comment.replyCount }} {{ comment.replyCount === 1 ? 'reply' : 'replies' }}
                </button>
              </span>
              <span *ngIf="comment._repliesLoaded && comment._replies && comment._replies.length > 0" class="comment__view-replies">
                <button class="comment__action-btn" (click)="hideReplies(comment)">
                  <i class="pi pi-chevron-up"></i> Hide replies
                </button>
              </span>
            </div>

            <!-- Inline Reply Input -->
            <div *ngIf="comment._showReplyInput" class="comment__reply-compose">
              <textarea
                class="comment__reply-input"
                [(ngModel)]="comment._replyText"
                placeholder="Write a reply..."
                rows="1"
                (keydown.enter)="$event.preventDefault(); submitReply(comment)"
                (input)="autoGrow($event)"
              ></textarea>
              <div class="comment__reply-actions">
                <button
                  class="comment__reply-btn"
                  [disabled]="!comment._replyText.trim()"
                  (click)="submitReply(comment)"
                >Reply</button>
                <button class="comment__reply-cancel" (click)="comment._showReplyInput = false">Cancel</button>
              </div>
            </div>

            <!-- Nested Replies -->
            <div *ngIf="comment._replies && comment._replies.length > 0" class="comment__replies">
              <div *ngFor="let reply of comment._replies" class="comment comment--reply">
                <div class="comment__avatar-wrap">
                  <app-avatar 
                    [imageUrl]="resolveImageUrl(reply.authorProfilePictureUrl || '')" 
                    [name]="reply.authorName" 
                    [size]="26">
                  </app-avatar>
                </div>
                <div class="comment__body">
                  <div class="comment__header">
                    <span class="comment__author">{{ reply.authorName }}</span>
                    <span class="comment__time">{{ formatTime(reply.createdAt) }}</span>
                  </div>
                  <p class="comment__text">{{ reply.content }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="comments().length === 0 && !loading()" class="thread__empty">
        <span>No comments yet. Start the conversation!</span>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="thread__loading">
        <i class="pi pi-spin pi-spinner"></i>
      </div>
    </div>
  `,
  styles: [`
    .thread {
      border-top: 1px solid var(--trellis-border-light);
      padding: 12px 0 4px;
    }

    /* ---- Compose ---- */
    .thread__compose {
      display: flex;
      gap: 10px;
      padding: 0 0 12px;
      align-items: flex-start;
    }

    .thread__compose-avatar-wrap {
      flex-shrink: 0;
    }

    .thread__compose-input-wrap {
      flex: 1;
      display: flex;
      gap: 8px;
      align-items: flex-end;
    }

    .thread__compose-input {
      flex: 1;
      border: 1px solid var(--trellis-border-light);
      border-radius: 20px;
      padding: 8px 14px;
      font-family: 'Inter', sans-serif;
      font-size: 0.88rem;
      resize: none;
      outline: none;
      line-height: 1.4;
      max-height: 120px;
      overflow-y: auto;
      transition: border-color 0.2s ease;
    }
    .thread__compose-input:focus {
      border-color: var(--trellis-green);
    }

    .thread__compose-btn {
      padding: 8px 16px;
      background: var(--trellis-green);
      color: #fff;
      border: none;
      border-radius: 20px;
      font-family: 'Inter', sans-serif;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      flex-shrink: 0;
      transition: all 0.15s ease;
    }
    .thread__compose-btn:hover:not(:disabled) { background: var(--trellis-green-dark); }
    .thread__compose-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ---- Comment List ---- */
    .thread__list {
      display: flex;
      flex-direction: column;
    }

    .comment {
      display: flex;
      gap: 10px;
      padding: 8px 0;
      position: relative;
    }

    .comment__avatar-wrap {
      flex-shrink: 0;
      z-index: 1; /* Above connecting line */
    }

    .comment__body {
      flex: 1;
      min-width: 0;
    }

    .comment__header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 2px;
    }

    .comment__author {
      font-weight: 600;
      font-size: 0.85rem;
      color: var(--trellis-text);
    }

    .comment__time {
      font-size: 0.78rem;
      color: var(--trellis-text-hint);
    }

    .comment__text {
      margin: 0;
      font-size: 0.9rem;
      line-height: 1.45;
      color: var(--trellis-text);
      word-wrap: break-word;
    }

    .comment__actions {
      display: flex;
      gap: 12px;
      margin-top: 4px;
      align-items: center;
    }

    .comment__action-btn {
      background: none;
      border: none;
      padding: 2px 4px;
      font-family: 'Inter', sans-serif;
      font-size: 0.78rem;
      color: var(--trellis-text-hint);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: color 0.15s ease;
    }
    .comment__action-btn:hover {
      color: var(--trellis-green-dark);
    }

    /* ---- Reply Input Inline ---- */
    .comment__reply-compose {
      margin-top: 8px;
      padding-left: 0;
    }

    .comment__reply-input {
      width: 100%;
      border: 1px solid var(--trellis-border-light);
      border-radius: 16px;
      padding: 8px 12px;
      font-family: 'Inter', sans-serif;
      font-size: 0.85rem;
      resize: none;
      outline: none;
      line-height: 1.4;
      max-height: 80px;
      box-sizing: border-box;
      transition: border-color 0.2s ease;
    }
    .comment__reply-input:focus {
      border-color: var(--trellis-green);
    }

    .comment__reply-actions {
      display: flex;
      gap: 8px;
      margin-top: 6px;
      justify-content: flex-end;
    }

    .comment__reply-btn {
      padding: 4px 14px;
      background: var(--trellis-green);
      color: #fff;
      border: none;
      border-radius: 14px;
      font-family: 'Inter', sans-serif;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .comment__reply-btn:hover:not(:disabled) { background: var(--trellis-green-dark); }
    .comment__reply-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .comment__reply-cancel {
      padding: 4px 10px;
      background: none;
      border: none;
      font-family: 'Inter', sans-serif;
      font-size: 0.78rem;
      color: var(--trellis-text-hint);
      cursor: pointer;
    }

    /* ---- Nested Replies with connecting line ---- */
    .comment__replies {
      margin-top: 4px;
      margin-left: 0;
      padding-left: 16px;
      border-left: 2px solid var(--trellis-border-light);
    }

    .comment--reply {
      padding: 6px 0;
    }

    /* ---- Empty / Loading ---- */
    .thread__empty {
      text-align: center;
      padding: 16px 0 8px;
      font-size: 0.85rem;
      color: var(--trellis-text-hint);
    }

    .thread__loading {
      text-align: center;
      padding: 12px 0;
      color: var(--trellis-green);
      font-size: 1.2rem;
    }
  `]
})
export class CommentThreadComponent {
  @Input({ required: true }) postId!: string;

  private commentService = inject(CommentService);
  public authService = inject(AuthService);
  private gatekeeper = inject(AuthGatekeeperService);

  comments = signal<CommentDataUI[]>([]);
  loading = signal(false);
  newCommentText = '';

  resolveImageUrl(url: string | null): string {
    if (!url) return '';
    return url.startsWith('http') ? url : `http://localhost:8080${url}`;
  }

  /** Extended interface with UI-only fields */
  ngOnInit() {
    this.loadComments();
  }

  loadComments() {
    this.loading.set(true);
    this.commentService.getComments(this.postId).subscribe({
      next: (data) => {
        this.comments.set(data.map(c => ({
          ...c,
          _replies: [],
          _repliesLoaded: false,
          _showReplyInput: false,
          _replyText: ''
        })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  submitComment() {
    this.gatekeeper.run(() => {
      const text = this.newCommentText.trim();
      if (!text) return;
      this.commentService.addComment(this.postId, text).subscribe({
        next: (comment) => {
          this.comments.update(current => [...current, {
            ...comment,
            _replies: [],
            _repliesLoaded: false,
            _showReplyInput: false,
            _replyText: ''
          }]);
          this.newCommentText = '';
        }
      });
    });
  }

  loadReplies(comment: CommentDataUI) {
    this.commentService.getReplies(comment.id).subscribe({
      next: (replies) => {
        comment._replies = replies.map(r => ({
          ...r,
          _replies: [],
          _repliesLoaded: false,
          _showReplyInput: false,
          _replyText: ''
        }));
        comment._repliesLoaded = true;
        this.comments.update(c => [...c]); // trigger signal
      }
    });
  }

  hideReplies(comment: CommentDataUI) {
    comment._replies = [];
    comment._repliesLoaded = false;
    this.comments.update(c => [...c]);
  }

  toggleReplyInput(comment: CommentDataUI) {
    this.gatekeeper.run(() => {
      comment._showReplyInput = !comment._showReplyInput;
      comment._replyText = '';
      this.comments.update(c => [...c]);
    });
  }

  submitReply(comment: CommentDataUI) {
    this.gatekeeper.run(() => {
      const text = (comment._replyText || '').trim();
      if (!text) return;
      this.commentService.addReply(comment.id, text).subscribe({
        next: (reply) => {
          if (!comment._replies) comment._replies = [];
          comment._replies.push({
            ...reply,
            _replies: [],
            _repliesLoaded: false,
            _showReplyInput: false,
            _replyText: ''
          });
          comment._showReplyInput = false;
          comment._replyText = '';
          comment.replyCount++;
          comment._repliesLoaded = true;
          this.comments.update(c => [...c]);
        }
      });
    });
  }

  autoGrow(event: Event) {
    const el = event.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
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

/** Extended CommentData with UI-only fields (not from server) */
interface CommentDataUI extends CommentData {
  _replies: CommentDataUI[];
  _repliesLoaded: boolean;
  _showReplyInput: boolean;
  _replyText: string;
}
