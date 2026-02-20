import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FeedService, Post } from './feed.service';
import { PostCardComponent } from './post-card.component';
import { switchMap } from 'rxjs/operators';
import { ToastService } from '../../core/toast.service';

@Component({
    selector: 'app-post-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, PostCardComponent],
    template: `
    <div class="post-detail-container">
        <!-- Back Button -->
        <div class="back-nav">
            <a routerLink="/" class="back-link">
                <i class="pi pi-arrow-left"></i> Back to Feed
            </a>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading()" class="loading-state">
            <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
        </div>

        <!-- Error State -->
        <div *ngIf="error()" class="error-state">
            <i class="pi pi-exclamation-circle"></i>
            <p>{{ error() }}</p>
            <a routerLink="/" class="btn-secondary">Return Home</a>
        </div>

        <!-- Post Content -->
        <div *ngIf="post() as p" class="post-content">
            <app-post-card 
              [post]="p"
              (onLike)="toggleLike($event)"
              (onDelete)="deletePost($event)"
              (onEdit)="editPost($event)"
              (onRepost)="repostPost($event)"
            ></app-post-card>
            
            <!-- Future Comment Section Placeholder -->
            <div class="comments-section">
                <!-- Comments will be handled by PostCard's internal comment system for now, 
                     or we can expand this later -->
            </div>
        </div>
    </div>
  `,
    styles: [`
    .post-detail-container {
        max-width: 680px;
        margin: 0 auto;
        padding: 20px 16px;
    }

    .back-nav {
        margin-bottom: 20px;
    }

    .back-link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: #6b7280;
        text-decoration: none;
        font-weight: 500;
        transition: color 0.2s;
    }

    .back-link:hover {
        color: #10b981;
    }

    .loading-state, .error-state {
        text-align: center;
        padding: 40px;
        color: #6b7280;
    }

    .error-state i {
        font-size: 2rem;
        color: #ef4444;
        margin-bottom: 12px;
    }

    .btn-secondary {
        display: inline-block;
        margin-top: 16px;
        padding: 8px 16px;
        background: #f3f4f6;
        color: #374151;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 500;
    }
  `]
})
export class PostDetailComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private feedService = inject(FeedService);
    private toastService = inject(ToastService);

    post = signal<Post | null>(null);
    loading = signal(true);
    error = signal<string | null>(null);

    ngOnInit() {
        this.route.paramMap.pipe(
            switchMap(params => {
                const id = params.get('id');
                if (!id) {
                    throw new Error('No post ID provided');
                }
                this.loading.set(true);
                return this.feedService.getPostById(id);
            })
        ).subscribe({
            next: (post) => {
                this.post.set(post);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Failed to load post', err);
                this.error.set('Post not found or unavailable.');
                this.loading.set(false);
            }
        });
    }

    toggleLike(post: Post) {
        this.feedService.likePost(post.id).subscribe();

        // Optimistic update
        this.post.update(current => {
            if (!current) return current;
            const originalPost = current.originalPost || current;
            const updatedOriginal = {
                ...originalPost,
                likedByCurrentUser: !originalPost.likedByCurrentUser,
                likesCount: originalPost.likedByCurrentUser ? originalPost.likesCount - 1 : originalPost.likesCount + 1
            };

            if (current.originalPost) {
                return { ...current, originalPost: updatedOriginal };
            }
            return updatedOriginal;
        });
    }

    deletePost(postId: string) {
        this.feedService.deletePost(postId).subscribe({
            next: () => {
                this.toastService.showSuccess('Post deleted successfully');
                this.router.navigate(['/']); // Go back to feed
            },
            error: (err) => {
                console.error('Delete failed', err);
                this.toastService.showError('Failed to delete post');
            }
        });
    }

    editPost(event: { id: string, content: string, plantTag?: string | null }) {
        this.feedService.editPost(event.id, event.content, event.plantTag).subscribe({
            next: (updated) => {
                this.toastService.showSuccess('Post updated');
                // Optimistic update to reflect new content in the detail view
                this.post.update(current => {
                    if (!current) return current;
                    if (current.id === updated.id) {
                        return { ...current, content: updated.content, plantTag: updated.plantTag };
                    }
                    if (current.originalPost && current.originalPost.id === updated.id) {
                        return { ...current, originalPost: { ...current.originalPost, content: updated.content, plantTag: updated.plantTag } };
                    }
                    return current;
                });
            },
            error: (err) => {
                console.error('Edit failed', err);
                this.toastService.showError('Failed to update post');
            }
        });
    }

    repostPost(postId: string) {
        const currentPost = this.post();
        if (!currentPost) return;

        const isCurrentlyReposted = currentPost.originalPost
            ? currentPost.isRepostedByCurrentUser
            : currentPost.isRepostedByCurrentUser;

        this.feedService.repostPost(postId).subscribe({
            next: () => {
                if (isCurrentlyReposted) {
                    this.toastService.showInfo('Removed repost');
                    this.updateRepostOptimistically(false);
                } else {
                    this.toastService.showSuccess('Reposted successfully');
                    this.updateRepostOptimistically(true);
                }
            },
            error: (err: any) => {
                console.error('Repost failed', err);
                this.toastService.showError('Failed to update repost status');
            }
        });
    }

    private updateRepostOptimistically(isReposting: boolean) {
        this.post.update(current => {
            if (!current) return current;
            const originalPost = current.originalPost || current;
            const updatedOriginal = {
                ...originalPost,
                repostCount: isReposting ? originalPost.repostCount + 1 : Math.max(0, originalPost.repostCount - 1)
            };

            const updatedPost = {
                ...(current.originalPost ? { ...current, originalPost: updatedOriginal } : updatedOriginal),
                isRepostedByCurrentUser: isReposting
            };

            return updatedPost;
        });
    }
}
