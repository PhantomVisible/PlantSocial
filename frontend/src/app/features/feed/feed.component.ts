import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DialogModule } from 'primeng/dialog';
import { FeedService, Post } from './feed.service';

@Component({
    selector: 'app-feed',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, CardModule, InputTextareaModule, DialogModule],
    template: `
    <div class="card flex justify-content-center p-5">
        <div class="flex flex-column gap-3 w-full" style="max-width: 800px">
            <h1 class="text-center">Social Feed</h1>
            
            <!-- Create Post -->
            <p-card styleClass="mb-3">
                <div class="flex flex-column gap-2">
                    <textarea 
                        pInputTextarea 
                        [(ngModel)]="newPostContent" 
                        [rows]="3" 
                        placeholder="What's growing on?" 
                        class="w-full"
                        style="resize: none">
                    </textarea>
                    <div class="flex justify-content-end">
                        <p-button label="Post" (onClick)="createPost()" [disabled]="!newPostContent.trim()" [loading]="posting()"></p-button>
                    </div>
                </div>
            </p-card>

            <!-- Post List -->
            <div *ngFor="let post of posts()">
                <p-card [header]="post.authorName" [subheader]="post.createdAt" [style]="{ width: '100%' }" styleClass="mb-3">
                    <ng-template pTemplate="content">
                        <p>{{ post.content }}</p>
                        <img *ngIf="post.imageUrl" [src]="post.imageUrl" alt="Post Request" style="width: 100%; border-radius: 8px; margin-top: 10px;" />
                    </ng-template>
                    <ng-template pTemplate="footer">
                        <div class="flex gap-3 mt-1 align-items-center">
                            <p-button 
                                [label]="post.likesCount + ''" 
                                [icon]="post.likedByCurrentUser ? 'pi pi-heart-fill' : 'pi pi-heart'" 
                                [severity]="post.likedByCurrentUser ? 'danger' : 'secondary'" 
                                [text]="true"
                                (onClick)="toggleLike(post)">
                            </p-button>
                            <p-button label="Comment" icon="pi pi-comments" severity="secondary" [text]="true" (onClick)="openCommentDialog(post)"></p-button>
                        </div>
                    </ng-template>
                </p-card>
            </div>
            
            <div *ngIf="posts().length === 0" class="text-center text-500">
                No posts yet. Be the first to share!
            </div>
        </div>
    </div>

    <!-- Comment Dialog -->
    <p-dialog header="Add Comment" [(visible)]="commentDialogVisible" [modal]="true" [style]="{ width: '50vw' }" [draggable]="false" [resizable]="false">
        <div class="flex flex-column gap-2">
            <textarea pInputTextarea [(ngModel)]="commentContent" [rows]="3" placeholder="Write a comment..." class="w-full" style="resize: none; width: 100%"></textarea>
        </div>
        <ng-template pTemplate="footer">
            <p-button label="Cancel" (onClick)="commentDialogVisible = false" [text]="true" severity="secondary"></p-button>
            <p-button label="Post Comment" (onClick)="submitComment()" [disabled]="!commentContent.trim()" [loading]="commenting()"></p-button>
        </ng-template>
    </p-dialog>
  `,
    styles: [`
    :host {
        display: block;
        min-height: 100vh;
        background-color: var(--surface-ground);
    }
  `]
})
export class FeedComponent implements OnInit {
    private feedService = inject(FeedService);

    posts = signal<Post[]>([]);
    newPostContent = '';
    posting = signal(false);

    // Comment state
    commentDialogVisible = false;
    selectedPost: Post | null = null;
    commentContent = '';
    commenting = signal(false);

    ngOnInit() {
        this.loadFeed();
    }

    loadFeed() {
        this.feedService.getFeed().subscribe({
            next: (response) => {
                this.posts.set(response.content);
            },
            error: (err) => console.error('Failed to load feed', err)
        });
    }

    createPost() {
        if (!this.newPostContent.trim()) return;

        this.posting.set(true);
        this.feedService.createPost({ content: this.newPostContent }).subscribe({
            next: (post) => {
                this.posts.update(current => [post, ...current]);
                this.newPostContent = '';
                this.posting.set(false);
            },
            error: (err) => {
                console.error('Failed to create post', err);
                this.posting.set(false);
            }
        });
    }

    toggleLike(post: Post) {
        // Optimistic update
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
                // Revert on error
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

        this.commenting.set(true);
        this.feedService.commentOnPost(this.selectedPost.id, { content: this.commentContent }).subscribe({
            next: () => {
                this.commenting.set(false);
                this.commentDialogVisible = false;
            },
            error: (err) => {
                console.error('Failed to comment', err);
                this.commenting.set(false);
            }
        });
    }
}
