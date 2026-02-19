import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { CommentThreadComponent } from './comment-thread.component';
import { AuthPromptDialogComponent } from '../../auth/auth-prompt-dialog.component';
import { AuthGatekeeperService } from '../../auth/auth-gatekeeper.service';
import { WikipediaService } from '../../shared/wikipedia.service';
import { PlantDetailsDialogComponent } from '../garden/plant-details-dialog.component';
import { ToastService } from '../../core/toast.service'; // Add this
import { Post } from './feed.service'; // Use shared interface
import { ReportService } from '../../core/services/report.service'; // Add this

import { AvatarComponent } from '../../shared/components/avatar/avatar.component';

import { HoverCardComponent } from '../../shared/components/hover-card/hover-card.component';
import { LinkifyPipe } from '../../shared/pipes/linkify.pipe';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CommentThreadComponent, PlantDetailsDialogComponent, AvatarComponent, HoverCardComponent, LinkifyPipe],
  template: `
    <article class="post-card" [class.repost-card]="!!post.originalPost" *ngIf="!postHidden()">
      
      <!-- Repost Header -->
      <div *ngIf="post.originalPost" class="repost-header">
         <i class="pi pi-sync" style="font-size: 0.8rem; transform: rotate(90deg)"></i>
         <span>Reposted by {{ post.authorUsername }}</span>
      </div>

      <!-- Header (If repost, show ORIGINAL author) -->
      <div class="post-card__header">
        <div class="avatar-wrapper" (mouseenter)="onAvatarMouseEnter()" (mouseleave)="onAvatarMouseLeave()">
            <a (click)="visitProfile(displayPost.authorUsername)" class="post-card__avatar-link">
            <app-avatar 
                [imageUrl]="resolveImageUrl(displayPost.authorProfilePictureUrl || '')" 
                [name]="displayPost.authorName" 
                [size]="42">
            </app-avatar>
            </a>
            
            <!-- Hover Card Overlay -->
            <div *ngIf="hoverCardVisible()" class="hover-card-popup" (mouseenter)="onCardMouseEnter()" (mouseleave)="onCardMouseLeave()">
                <app-hover-card [username]="displayPost.authorUsername" [userId]="displayPost.authorId"></app-hover-card>
            </div>
        </div>
        <div class="post-card__meta">
          <a (click)="visitProfile(displayPost.authorUsername)" class="post-card__author">{{ displayPost.authorName }}</a>
          <span class="post-card__dot">·</span>
          <a [routerLink]="['/post', displayPost.id]" class="post-card__time" title="View post">{{ formatTime(displayPost.createdAt) }}</a>
          
          <!-- Plant Badge (from garden) -->
          <span *ngIf="displayPost.plantNickname" class="post-card__plant-badge" (click)="openPlantDetails($event)">
            🌿 {{ displayPost.plantNickname }}
          </span>

          <!-- Plant Tag Badge (free-text, clickable) -->
          <span *ngIf="displayPost.plantTag" class="post-card__plant-tag" (click)="onTagClick($event)">
            🏷️ {{ displayPost.plantTag }}
          </span>
        </div>

        <!-- Owner Menu (Only for direct posts, or if I own the repost itself?? 
             Actually if I reposted it, I can delete my repost.
             If it's a repost, 'post' is the repost wrapper. 'displayPost' is original.
             The menu should control the WRAPPER (post) generally.
        -->
        <div class="post-card__menu-wrap">
          <button class="menu-trigger" (click)="toggleMenu($event)" title="Post options">
            <i class="pi pi-ellipsis-v"></i>
          </button>
          <div *ngIf="menuOpen()" class="dropdown-menu">
            <!-- Cannot edit reposts, only delete -->
            <button *ngIf="!post.originalPost && isOwner()" class="dropdown-item" (click)="startEdit()">
              <i class="pi pi-pencil"></i> Edit
            </button>
            <button *ngIf="isOwner()" class="dropdown-item dropdown-item--danger" (click)="confirmDelete()">
              <i class="pi pi-trash"></i> Delete
            </button>
            
            <button *ngIf="!isOwner()" class="dropdown-item dropdown-item--danger" (click)="openReportDialog()">
                <i class="pi pi-flag"></i> Report
            </button>
          </div>
        </div>
      </div>

      <!-- Content: Normal -->
      <div class="post-card__content" *ngIf="!isEditing()">
        <p [innerHTML]="displayPost.content | linkify"></p>
      </div>

      <!-- Content: Edit mode (Only for original posts) -->
      <div class="post-card__edit" *ngIf="isEditing()">
        <textarea
          class="edit-textarea"
          [(ngModel)]="editContent"
          rows="3"
          (keydown.escape)="cancelEdit()"
        ></textarea>
        <div class="edit-tag-row">
          <input
            class="edit-tag-input"
            [(ngModel)]="editTag"
            placeholder="🌿 Plant tag (optional)"
            (input)="onEditTagSearch()"
            (focus)="editTagFocused = true"
            (blur)="onEditTagBlur()"
            autocomplete="off"
          />
          <button *ngIf="editTag" class="edit-tag-clear" (click)="editTag = ''">&times;</button>
          <div *ngIf="editTagSuggestions().length > 0 && editTagFocused" class="edit-tag-suggestions">
            <button
              *ngFor="let s of editTagSuggestions()"
              class="edit-tag-suggestion-item"
              (mousedown)="selectEditTag(s)"
            >
              🌿 {{ s }}
            </button>
          </div>
        </div>
        <div class="edit-actions">
          <button class="edit-btn edit-btn--save" [disabled]="!editContent.trim()" (click)="saveEdit()">Save</button>
          <button class="edit-btn edit-btn--cancel" (click)="cancelEdit()">Cancel</button>
        </div>
      </div>

      <!-- Image -->
      <div *ngIf="displayPost.imageUrl" class="post-card__media" (click)="openLightbox()">
        <img [src]="resolveImageUrl(displayPost.imageUrl)" alt="Plant photo" loading="lazy" />
      </div>

      <!-- Actions -->
      <div class="post-card__actions">
        <!-- Like (Likes the ORIGINAL post if repost?) 
             Typically X/Reddit: liking a repost likes the ORIGINAL post. 
             So we use displayPost.id
        -->
        <button class="action-btn like-btn" 
                [class.liked]="displayPost.likedByCurrentUser" 
                [class.like-pop]="likeAnimating()"
                (click)="toggleLike()">
          <span class="like-icon-wrap">
            <i class="pi" [ngClass]="displayPost.likedByCurrentUser ? 'pi-heart-fill' : 'pi-heart'"></i>
          </span>
          <span *ngIf="displayPost.likesCount > 0">{{ displayPost.likesCount }}</span>
        </button>
        
        <button class="action-btn" [class.active-comments]="isCommentsOpen()" (click)="toggleComments()">
          <i class="pi pi-comment"></i>
          <span *ngIf="displayPost.commentCount > 0">{{ displayPost.commentCount }}</span>
        </button>
        
        <!-- Repost Button -->
        <button class="action-btn" [class.reposted]="isRepostedByMe()" (click)="repost($event)" title="Repost">
            <i class="pi" [ngClass]="isRepostedByMe() ? 'pi-sync' : 'pi-sync'" [style.color]="isRepostedByMe() ? 'var(--trellis-green)' : ''" style="transform: rotate(90deg)"></i>
            <span *ngIf="displayPost.repostCount > 0" [style.color]="isRepostedByMe() ? 'var(--trellis-green)' : ''">{{ displayPost.repostCount }}</span>
        </button>

        <button class="action-btn" (click)="sharePost($event)" title="Share link">
          <i class="pi pi-share-alt"></i>
        </button>
      </div>

      <!-- Comment Thread (lazy loaded) -->
      <app-comment-thread
        *ngIf="isCommentsOpen()"
        [postId]="post.id"
      ></app-comment-thread>
    </article>

    <!-- ===== LIGHTBOX ===== -->
    <div *ngIf="lightboxOpen()" class="lightbox-overlay" (click)="closeLightbox()">
      <button class="lightbox-close" (click)="closeLightbox()">&times;</button>
      <img class="lightbox-image" [src]="resolveImageUrl(post.imageUrl!)" alt="Full size" (click)="$event.stopPropagation()" />
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

    <!-- ===== PLANT DETAILS DIALOG ===== -->
    <app-plant-details-dialog
      *ngIf="showPlantDetails() && selectedPlantId()"
      [plantId]="selectedPlantId()!"
      (close)="closePlantDetails()"
    ></app-plant-details-dialog>
    <!-- ===== REPORT DIALOG ===== -->
    <div *ngIf="reportDialogOpen()" class="confirm-overlay" (click)="reportDialogOpen.set(false)">
      <div class="confirm-dialog report-dialog" (click)="$event.stopPropagation()">
        <h3>Report Post</h3>
        <p>Why are you reporting this post?</p>
        
        <div class="report-form">
            <div class="form-group">
                <label>Reason</label>
                <select [ngModel]="reportReason()" (ngModelChange)="reportReason.set($event)" class="form-select">
                    <option *ngFor="let r of reportReasons" [value]="r.value">{{ r.label }}</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Description (Optional)</label>
                <textarea 
                    [ngModel]="reportDescription()" 
                    (ngModelChange)="reportDescription.set($event)"
                    class="form-input" 
                    rows="3" 
                    placeholder="Please provide more details...">
                </textarea>
            </div>

            <div class="form-group block-user-row">
                <label class="block-checkbox-label">
                    <input type="checkbox" [ngModel]="blockUser()" (ngModelChange)="blockUser.set($event)" />
                    <span>Also block this user</span>
                </label>
                <small class="block-hint">You won't see their posts or messages anymore.</small>
            </div>
        </div>

        <div class="confirm-actions">
          <button class="confirm-btn confirm-btn--delete" (click)="submitReport()" [disabled]="isReporting()">
            <span *ngIf="!isReporting()">Submit Report</span>
            <span *ngIf="isReporting()">Submitting...</span>
          </button>
          <button class="confirm-btn confirm-btn--cancel" (click)="reportDialogOpen.set(false)">Cancel</button>
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
    
    .repost-header {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--trellis-text-secondary);
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .repost-header i {
        font-size: 0.9rem;
    }

    /* ---------- Header ---------- */
    .post-card__header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
      position: relative;
    }
    .post-card__avatar-link {
      display: inline-block;
      text-decoration: none;
      cursor: pointer;
      flex-shrink: 0;
      transition: opacity 0.15s ease;
    }
    .post-card__avatar-link:hover {
      opacity: 0.85;
    }
    .post-card__meta {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 1;
      min-width: 0;
    }
    
    .avatar-wrapper {
        position: relative;
    }

    .hover-card-popup {
        position: absolute;
        top: 100%;
        left: 0;
        z-index: 1000;
        padding-top: 10px; /* Spacer to bridge the gap for mouseover */
    }
    .post-card__author {
      font-weight: 600;
      color: var(--trellis-text);
      font-size: 0.95rem;
      text-decoration: none;
      cursor: pointer;
    }
    .post-card__author:hover {
      text-decoration: underline;
    }
    .post-card__dot {
      color: var(--trellis-text-hint);
      font-size: 0.8rem;
    }
    .post-card__time {
      font-size: 0.82rem;
      color: var(--trellis-text-hint);
      text-decoration: none;
      transition: color 0.15s ease;
    }
    .post-card__time:hover {
      color: var(--trellis-text-secondary);
      text-decoration: underline;
    }
    .post-card__plant-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--trellis-green-dark);
      background: var(--trellis-green-ghost);
      padding: 2px 8px;
      border-radius: 12px;
      margin-left: 4px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .post-card__plant-badge:hover {
      background: var(--trellis-green-pale);
      color: var(--trellis-green-dark);
    }

    /* Report Dialog Styles */
    .report-dialog {
        width: 100%;
        max-width: 500px;
    }
    .report-form {
        margin: 20px 0;
        text-align: left;
    }
    .form-group {
        margin-bottom: 16px;
    }
    .form-group label {
        display: block;
        font-weight: 600;
        margin-bottom: 8px;
        color: var(--trellis-text);
        font-size: 0.9rem;
    }
    .form-select, .form-input {
        width: 100%;
        padding: 10px;
        border: 1px solid var(--trellis-border);
        border-radius: 8px;
        font-family: inherit;
        font-size: 0.95rem;
        background: var(--trellis-bg-secondary);
        color: var(--trellis-text);
        transition: border-color 0.2s, box-shadow 0.2s;
    }
    .form-select:focus, .form-input:focus {
        border-color: var(--trellis-green);
        outline: none;
        box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.1);
        background: var(--trellis-white);
    }
    .form-input {
        resize: vertical;
        min-height: 80px;
    }

    .post-card__plant-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
      font-weight: 600;
      color: #fff;
      background: var(--trellis-green);
      padding: 2px 10px;
      border-radius: 12px;
      margin-left: 4px;
      cursor: pointer;
      transition: background 0.15s ease, transform 0.1s ease;
    }
    .post-card__plant-tag:hover {
      background: var(--trellis-green-dark);
      transform: scale(1.05);
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
      white-space: pre-wrap;
    }

    /* Interactive Links - Need ::ng-deep because they are injected via innerHTML */
    ::ng-deep .link-mention, ::ng-deep .link-hashtag {
      text-decoration: none;
      font-weight: 500;
      cursor: pointer;
    }
    ::ng-deep .link-mention { color: var(--trellis-green); }
    ::ng-deep .link-mention:hover { text-decoration: underline; color: var(--trellis-green-dark); }
    
    ::ng-deep .link-hashtag { color: #3182ce; } /* Blue for tags */
    ::ng-deep .link-hashtag:hover { text-decoration: underline; color: #2b6cb0; }


    /* ---------- Edit Mode ---------- */
    .post-card__edit { margin-bottom: 8px; }
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
    .edit-btn--save { background: var(--trellis-green); color: #fff; }
    .edit-btn--save:hover:not(:disabled) { background: var(--trellis-green-dark); }
    .edit-btn--save:disabled { opacity: 0.5; cursor: not-allowed; }
    .edit-btn--cancel { background: var(--trellis-border-light); color: var(--trellis-text-secondary); }
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
    .post-card__media:hover img { filter: brightness(0.92); }

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

    /* Heart — red when liked */
    .action-btn.liked { color: #E53E3E; }
    .action-btn.liked:hover { background: #FFF5F5; color: #C53030; }

    /* ===== Like Bounce + Particle Animation ===== */
    .like-btn {
      overflow: visible !important;
      position: relative;
    }
    .like-icon-wrap {
      display: inline-flex;
      position: relative;
      overflow: visible;
      z-index: 1;
    }

    /* Bounce on the heart icon */
    .like-btn.like-pop .like-icon-wrap i {
      animation: like-bounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }

    /* Particle ring using box-shadow dots */
    .like-btn.like-pop.liked .like-icon-wrap::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 4px;
      height: 4px;
      margin: -2px 0 0 -2px;
      border-radius: 50%;
      z-index: 10;
      pointer-events: none;
      box-shadow:
        0 -14px 0 0 #ff6b6b,
        10px -10px 0 0 #ffa502,
        14px 0 0 0 #ff4757,
        10px 10px 0 0 #ff6348,
        0 14px 0 0 #ee5a24,
        -10px 10px 0 0 #f368e0,
        -14px 0 0 0 #ff9ff3,
        -10px -10px 0 0 #ffc048;
      animation: like-particles 0.6s ease-out forwards;
    }

    /* Expanding ring behind heart */
    .like-btn.like-pop.liked .like-icon-wrap::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 30px;
      height: 30px;
      margin: -15px 0 0 -15px;
      border-radius: 50%;
      border: 2px solid rgba(229, 62, 62, 0.4);
      z-index: 0;
      pointer-events: none;
      animation: like-ring 0.5s ease-out forwards;
    }

    @keyframes like-bounce {
      0%   { transform: scale(1); }
      15%  { transform: scale(0.7); }
      40%  { transform: scale(1.5); }
      65%  { transform: scale(0.9); }
      85%  { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    @keyframes like-particles {
      0%   { transform: scale(0.3); opacity: 1; }
      40%  { transform: scale(1.2); opacity: 1; }
      100% { transform: scale(1.8); opacity: 0; }
    }

    @keyframes like-ring {
      0%   { transform: scale(0.3); opacity: 0.8; }
      100% { transform: scale(2.2); opacity: 0; }
    }

    /* Comment icon — highlighted when thread open */
    .action-btn.active-comments { color: var(--trellis-green); }

    /* Button press-down effect for all action buttons */
    .action-btn:active {
      transform: scale(0.9);
      transition: transform 0.08s ease;
    }

    /* ===== LIGHTBOX ===== */
    .lightbox-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.85);
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
    .lightbox-close:hover { background: rgba(255,255,255,0.3); }

    /* ===== DELETE CONFIRMATION ===== */
    .confirm-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.4);
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
    .confirm-dialog h3 { margin: 0 0 8px; font-size: 1.15rem; font-weight: 700; color: var(--trellis-text); }
    .confirm-dialog p { margin: 0 0 20px; font-size: 0.9rem; color: var(--trellis-text-secondary); line-height: 1.4; }
    .confirm-actions { display: flex; gap: 10px; justify-content: center; }
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

    /* Report Dialog Specifics */
    .report-dialog {
        text-align: left;
        width: 400px;
        max-width: 90vw;
    }
    .report-form {
        margin-bottom: 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    .report-select {
        width: 100%;
        padding: 10px;
        border: 1px solid var(--trellis-border-light);
        border-radius: 8px;
        font-family: 'Inter', sans-serif;
        font-size: 0.9rem;
        outline: none;
    }
    .report-textarea {
        width: 100%;
        padding: 10px;
        border: 1px solid var(--trellis-border-light);
        border-radius: 8px;
        font-family: 'Inter', sans-serif;
        font-size: 0.9rem;
        resize: vertical;
        outline: none;
    }
    .report-textarea:focus, .report-select:focus {
        border-color: var(--trellis-green);
    }

    /* ===== EDIT MODE ===== */
    .post-card__edit { padding: 0 20px 12px; }
    .edit-textarea {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--trellis-border-light);
      border-radius: 8px;
      font-family: 'Inter', sans-serif;
      font-size: 0.92rem;
      resize: vertical;
      outline: none;
      transition: border-color 0.15s ease;
    }
    .edit-textarea:focus { border-color: var(--trellis-green); }
    .edit-tag-row {
      position: relative;
      margin-top: 8px;
      display: flex;
      align-items: center;
    }
    .edit-tag-input {
      flex: 1;
      padding: 8px 32px 8px 12px;
      border: 1px solid var(--trellis-border-light);
      border-radius: 8px;
      font-family: 'Inter', sans-serif;
      font-size: 0.85rem;
      outline: none;
      background: transparent;
    }
    .edit-tag-input:focus { border-color: var(--trellis-green); }
    .edit-tag-input::placeholder { color: var(--trellis-text-hint); }
    .edit-tag-clear {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      font-size: 1.1rem;
      color: var(--trellis-text-hint);
      cursor: pointer;
      padding: 0 4px;
    }
    .edit-tag-clear:hover { color: #E53E3E; }
    .edit-tag-suggestions {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--trellis-white);
      border: 1px solid var(--trellis-border-light);
      border-radius: 0 0 8px 8px;
      box-shadow: var(--trellis-shadow-lg);
      z-index: 100;
      max-height: 150px;
      overflow-y: auto;
    }
    .edit-tag-suggestion-item {
      display: block;
      width: 100%;
      padding: 8px 12px;
      border: none;
      background: none;
      text-align: left;
      font-family: 'Inter', sans-serif;
      font-size: 0.85rem;
      color: var(--trellis-text);
      cursor: pointer;
      transition: background 0.1s ease;
    }
    .edit-tag-suggestion-item:hover { background: var(--trellis-green-ghost); }
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
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .edit-btn--save { background: var(--trellis-green); color: #fff; }
    .edit-btn--save:hover { background: var(--trellis-green-dark); }
    .edit-btn--save:disabled { opacity: 0.5; cursor: not-allowed; }
    .edit-btn--cancel { background: var(--trellis-border-light); color: var(--trellis-text-secondary); }
    .edit-btn--cancel:hover { background: #e0e0e0; }

    /* Block checkbox in Report Dialog */
    .block-user-row {
      margin-top: 4px;
      padding-top: 12px;
      border-top: 1px solid var(--trellis-border-light);
    }
    .block-checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--trellis-text);
    }
    .block-checkbox-label input[type="checkbox"] {
      width: 16px;
      height: 16px;
      accent-color: var(--trellis-green);
      cursor: pointer;
    }
    .block-hint {
      display: block;
      margin-top: 4px;
      margin-left: 24px;
      font-size: 0.78rem;
      color: var(--trellis-text-hint);
    }
  `]
})
export class PostCardComponent {
  @Input({ required: true }) post!: Post;
  @Output() onLike = new EventEmitter<Post>();
  @Output() onDelete = new EventEmitter<string>();
  @Output() onEdit = new EventEmitter<{ id: string; content: string; plantTag?: string | null }>();
  @Output() onRepost = new EventEmitter<string>(); // Emit postId


  private authService = inject(AuthService);
  private gatekeeper = inject(AuthGatekeeperService);
  private router = inject(Router);
  private wikiService = inject(WikipediaService);
  private toastService = inject(ToastService); // Add this

  // Computed / Getter for displayPost (helps switch between Repost and Original)
  get displayPost(): Post {
    return this.post.originalPost || this.post;
  }

  menuOpen = signal(false);
  lightboxOpen = signal(false);
  deleteConfirmOpen = signal(false);
  isEditing = signal(false);
  isCommentsOpen = signal(false);

  // ---- Share ----
  sharePost(event: Event) {
    event.stopPropagation();
    const url = `${window.location.origin}/post/${this.post.id}`;
    navigator.clipboard.writeText(url).then(() => {
      this.toastService.showSuccess('Link copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy link', err);
      this.toastService.showError('Failed to copy link.');
    });
  }
  // Plant Details
  showPlantDetails = signal(false);
  selectedPlantId = signal<string | null>(null);

  editContent = '';
  editTag = '';
  editTagFocused = false;
  editTagSuggestions = signal<string[]>([]);

  // ---- Hover Card ----
  hoverCardVisible = signal(false);
  hoverCardUsername = signal<string | null>(null);
  private hoverTimeout: any;

  onAvatarMouseEnter() {
    const currentUser = this.authService.currentUser();
    // Debug logging
    console.log('Avatar Hover:', {
      currentUserId: currentUser?.id,
      authorId: this.post.authorId,
      match: currentUser?.id === this.post.authorId
    });

    if (currentUser && currentUser.id === this.post.authorId) {
      return;
    }

    this.hoverTimeout = setTimeout(() => {
      this.hoverCardVisible.set(true);
    }, 500);
  }

  onAvatarMouseLeave() {
    clearTimeout(this.hoverTimeout);
    // Add a small delay for moving mouse to the card itself if needed, 
    // but for now strict leave closes it unless we handle "enter card" too.
    // To keep it simple: close immediately or short delay.
    this.hoverTimeout = setTimeout(() => {
      this.hoverCardVisible.set(false);
    }, 300);
  }

  // If we want the card to stay open when hovering the card itself,
  // we need to handle events on the card wrapper too.
  onCardMouseEnter() {
    clearTimeout(this.hoverTimeout);
  }

  onCardMouseLeave() {
    this.onAvatarMouseLeave();
  }

  // ---- Comments ----
  toggleComments() {
    this.isCommentsOpen.update(v => !v);
  }

  // ---- Menu ----
  toggleMenu(event: Event) {
    event.stopPropagation();
    this.menuOpen.update(v => !v);
  }

  visitProfile(username: string) {
    this.gatekeeper.run(() => {
      this.router.navigate(['/profile', username]);
    });
  }

  isOwner(): boolean {
    const user = this.authService.currentUser();
    return !!user && user.id === this.post.authorId;
  }

  likeAnimating = signal(false);

  toggleLike() {
    this.gatekeeper.run(() => {
      // Trigger bounce animation
      this.likeAnimating.set(true);
      setTimeout(() => this.likeAnimating.set(false), 500);
      // Emit the CONTENT post (original), not the repost wrapper
      this.onLike.emit(this.displayPost);
    });
  }

  onTagClick(event: Event) {
    event.stopPropagation();
    if (this.post.plantTag) {
      this.router.navigate([], { queryParams: { plant: this.post.plantTag } });
    }
  }

  openPlantDetails(event: Event) {
    event.stopPropagation();
    if (this.post.plantId) {
      this.selectedPlantId.set(this.post.plantId);
      this.showPlantDetails.set(true);
    }
  }

  // ---- REPORTING ----
  reportDialogOpen = signal(false);
  reportReason = signal<string>('SPAM');
  reportDescription = signal('');
  isReporting = signal(false);
  blockUser = signal(false);
  postHidden = signal(false);

  reportReasons = [
    { label: 'Spam', value: 'SPAM' },
    { label: 'Hate Speech', value: 'HATE_SPEECH' },
    { label: 'Harassment', value: 'HARASSMENT' },
    { label: 'Misinformation', value: 'MISINFORMATION' },
    { label: 'Other', value: 'OTHER' }
  ];

  private reportService = inject(ReportService);

  openReportDialog() {
    this.menuOpen.set(false);
    this.reportReason.set('SPAM');
    this.reportDescription.set('');
    this.blockUser.set(false);
    this.reportDialogOpen.set(true);
  }

  submitReport() {
    if (this.isReporting()) return;

    this.isReporting.set(true);
    this.reportService.reportPost(this.displayPost.id, this.reportReason(), this.reportDescription(), this.blockUser())
      .subscribe({
        next: () => {
          const msg = this.blockUser()
            ? 'Report submitted and user blocked.'
            : 'Report submitted. Thank you for keeping our community safe.';
          this.toastService.showSuccess(msg);
          this.reportDialogOpen.set(false);
          this.isReporting.set(false);
          this.postHidden.set(true);
        },
        error: (err) => {
          console.error('Report error', err);
          this.toastService.showError('Failed to submit report. You may have already reported this post.');
          this.isReporting.set(false);
        }
      });
  }

  closePlantDetails() {
    this.showPlantDetails.set(false);
    this.selectedPlantId.set(null);
  }

  // ---- Edit ----
  startEdit() {
    this.editContent = this.post.content;
    this.editTag = this.post.plantTag || '';
    this.isEditing.set(true);
    this.menuOpen.set(false);
  }
  cancelEdit() { this.isEditing.set(false); this.editTagSuggestions.set([]); }
  saveEdit() {
    if (this.editContent.trim()) {
      this.onEdit.emit({
        id: this.post.id,
        content: this.editContent,
        plantTag: this.editTag.trim() || null
      });
      this.isEditing.set(false);
      this.editTagSuggestions.set([]);
    }
  }

  isRepostedByMe(): boolean {
    // If this card IS a repost (has originalPost), then I am the reposter
    if (this.post.originalPost) {
      return this.isOwner();
    }
    // Otherwise check the backend flag
    return this.post.isRepostedByCurrentUser;
  }

  repost(event: Event) {
    event.stopPropagation();
    this.gatekeeper.run(() => {
      // Optimistic update
      if (this.post.originalPost) {
        // This card IS a repost — clicking repost again would undo it
        // No optimistic update needed here, just emit
      } else {
        const wasReposted = this.post.isRepostedByCurrentUser;
        this.post.repostCount = wasReposted
          ? Math.max(0, this.post.repostCount - 1)
          : this.post.repostCount + 1;
        this.post.isRepostedByCurrentUser = !wasReposted;
      }
      this.onRepost.emit(this.displayPost.id);
    });
  }

  // ---- Edit Tag Autocomplete ----
  private editSearchTimeout: any;

  onEditTagSearch() {
    clearTimeout(this.editSearchTimeout);
    if (!this.editTag) {
      this.editTagSuggestions.set([]);
      return;
    }
    this.editSearchTimeout = setTimeout(() => {
      this.wikiService.search(this.editTag).subscribe(results => {
        this.editTagSuggestions.set(results);
      });
    }, 300);
  }

  selectEditTag(tag: string) {
    this.editTag = tag;
    this.editTagSuggestions.set([]);
    this.editTagFocused = false;
  }

  onEditTagBlur() {
    setTimeout(() => {
      this.editTagFocused = false;
    }, 200);
  }

  // ---- Utils ----
  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return date.toLocaleDateString();
  }

  resolveImageUrl(url: string | undefined): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:8080${url}`;
  }

  openLightbox() {
    if (this.post.imageUrl || (this.post.originalPost && this.post.originalPost.imageUrl)) {
      this.lightboxOpen.set(true);
    }
  }
  closeLightbox() {
    this.lightboxOpen.set(false);
  }

  // Delete flow
  confirmDelete() {
    this.menuOpen.set(false);
    this.deleteConfirmOpen.set(true);
  }
  doDelete() {
    this.deleteConfirmOpen.set(false);
    this.onDelete.emit(this.post.id);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
