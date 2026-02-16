import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FeedService, Post } from './feed.service';
import { PostCardComponent } from './post-card.component';
import { switchMap } from 'rxjs/operators';

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
            <app-post-card [post]="p"></app-post-card>
            
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
    private feedService = inject(FeedService);

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
}
