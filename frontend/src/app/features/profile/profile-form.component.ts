import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FileUploadModule } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { UserService } from './user.service';
import { UserProfile } from './user.model';
import { ToastService } from '../../core/toast.service';
import { environment } from '../../../environments/environment';

/**
 * Shared profile form used in two contexts:
 *  - mode='edit'        → inside the Edit Profile dialog
 *  - mode='onboarding'  → full-page onboarding wizard (simpler fields, no cover, no cancel)
 */
@Component({
  selector: 'app-profile-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FileUploadModule, InputTextModule, InputTextareaModule, ButtonModule, RippleModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="save()">

      <!-- Cover (edit mode only) -->
      @if (mode === 'edit') {
        <div class="cover-container">
          <div class="cover-wrapper">
            <img *ngIf="(previewCover() || profile.coverPictureUrl) && !coverError()"
                 [src]="previewCover() || resolveUrl(profile.coverPictureUrl)"
                 (error)="coverError.set(true)" alt="Cover" class="cover-img">
            <div *ngIf="(!previewCover() && !profile.coverPictureUrl) || coverError()"
                 class="cover-placeholder"></div>
            <div class="camera-overlay cover-overlay">
              <p-fileUpload mode="basic" chooseLabel=" " chooseIcon="pi pi-camera"
                            name="coverImage" accept="image/*" maxFileSize="2000000"
                            [auto]="true" (onSelect)="onCoverSelect($event)"
                            styleClass="upload-btn">
              </p-fileUpload>
            </div>
          </div>
        </div>
      }

      <!-- Avatar -->
      <div class="avatar-container" [class.avatar-container--onboarding]="mode === 'onboarding'">
        <div class="avatar-wrapper">
          <img *ngIf="(previewAvatar() || profile.profilePictureUrl) && !avatarError()"
               [src]="previewAvatar() || resolveUrl(profile.profilePictureUrl)"
               (error)="avatarError.set(true)" alt="Avatar" class="avatar-img">
          <div *ngIf="(!previewAvatar() && !profile.profilePictureUrl) || avatarError()"
               class="avatar-placeholder">{{ initials() }}</div>
          <div class="camera-overlay">
            <p-fileUpload mode="basic" chooseLabel=" " chooseIcon="pi pi-camera"
                          name="image" accept="image/*" maxFileSize="5000000"
                          [auto]="true" (onSelect)="onAvatarSelect($event)"
                          styleClass="upload-btn">
            </p-fileUpload>
          </div>
        </div>
        @if (mode === 'onboarding') {
          <p class="avatar-hint">Tap the camera to add a photo</p>
        }
      </div>

      <!-- Fields -->
      <div class="fields">
        <!-- Full name (both modes) -->
        <div class="field">
          <label for="pf-fullName">Full Name</label>
          <input pInputText id="pf-fullName" formControlName="fullName" class="w-full"
                 [placeholder]="mode === 'onboarding' ? 'Your display name' : ''">
        </div>

        <!-- Username (edit mode only) -->
        @if (mode === 'edit') {
          <div class="field">
            <label for="pf-username">Username</label>
            <div class="p-inputgroup">
              <span class="p-inputgroup-addon">&#64;</span>
              <input pInputText id="pf-username" formControlName="username">
            </div>
            <small class="p-error" *ngIf="form.get('username')?.invalid && form.get('username')?.touched">
              3-20 alphanumeric characters.
            </small>
          </div>
        }

        <!-- Bio (both modes) -->
        <div class="field">
          <label for="pf-bio">Bio</label>
          <textarea pInputTextarea id="pf-bio" formControlName="bio" rows="3" class="w-full"
                    [placeholder]="mode === 'onboarding' ? 'Tell the community about yourself and your plants 🌱' : ''">
          </textarea>
          <div class="bio-counter">{{ form.get('bio')?.value?.length || 0 }}/500</div>
        </div>

        <!-- Location (both modes) -->
        <div class="field">
          <label for="pf-location">Location</label>
          <input pInputText id="pf-location" formControlName="location" class="w-full"
                 [placeholder]="mode === 'onboarding' ? 'City, Country' : ''">
        </div>
      </div>

      <!-- Actions -->
      <div class="actions" [class.actions--onboarding]="mode === 'onboarding'">
        @if (mode === 'edit') {
          <p-button label="Cancel" styleClass="p-button-text" (onClick)="cancelled.emit()"></p-button>
          <p-button label="Save" type="submit" [loading]="saving()" [disabled]="form.invalid"></p-button>
        } @else {
          <p-button label="Get Started →" type="submit" [loading]="saving()"
                    [disabled]="form.invalid"
                    styleClass="p-button-lg onboarding-submit">
          </p-button>
          <p class="skip-hint" (click)="skipOnboarding()">Skip for now</p>
        }
      </div>

    </form>
  `,
  styles: [`
    /* ─── Cover ───────────────────────────────────────────────────── */
    .cover-container { margin-bottom: -60px; position: relative; }
    .cover-wrapper {
      position: relative; height: 120px;
      background: linear-gradient(135deg, #ddd, #eee);
      border-radius: 8px; overflow: hidden;
    }
    .cover-img { width: 100%; height: 100%; object-fit: cover; }
    .cover-placeholder { width: 100%; height: 100%; background: linear-gradient(135deg, #2E7D32 0%, #66BB6A 100%); }
    .cover-overlay { bottom: 8px !important; right: 8px !important;
      background: rgba(0,0,0,0.4) !important;
      backdrop-filter: blur(4px);
      border: 1px solid rgba(255,255,255,0.3) !important; }

    /* ─── Avatar ──────────────────────────────────────────────────── */
    .avatar-container {
      display: flex; flex-direction: column; align-items: flex-start;
      padding-left: 20px; margin-bottom: 1.5rem; position: relative; z-index: 2;
    }
    .avatar-container--onboarding {
      align-items: center; padding-left: 0; margin-top: 1.5rem;
    }
    .avatar-wrapper {
      position: relative; width: 120px; height: 120px; border-radius: 50%;
      background: var(--surface-ground); box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border: 4px solid var(--surface-card);
    }
    .avatar-img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block; }
    .avatar-placeholder {
      width: 100%; height: 100%; border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-color), var(--primary-500));
      color: #fff; display: flex; align-items: center; justify-content: center;
      font-size: 2.5rem; font-weight: 700;
    }
    .avatar-hint { margin: 0.5rem 0 0; font-size: 0.8rem; color: var(--text-color-secondary); }

    /* ─── Camera overlay ──────────────────────────────────────────── */
    .camera-overlay {
      position: absolute; bottom: 0; right: 0;
      width: 36px; height: 36px; border-radius: 50%;
      background: var(--primary-color);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      border: 2px solid var(--surface-card);
      overflow: hidden; cursor: pointer; transition: all .2s; z-index: 10;
    }
    .camera-overlay:hover { transform: scale(1.1); background: var(--primary-600); }

    :host ::ng-deep .upload-btn .p-button {
      width: 100% !important; height: 100% !important; border-radius: 50% !important;
      padding: 0 !important; background: transparent !important; border: none !important;
      color: #fff !important; display: flex !important; align-items: center !important;
      justify-content: center !important;
    }
    :host ::ng-deep .upload-btn .p-button:hover { background: transparent !important; }
    :host ::ng-deep .upload-btn .p-button-icon { font-size: 1.1rem; margin: 0 !important; }
    :host ::ng-deep .upload-btn .p-button-label { display: none; }

    /* ─── Fields ──────────────────────────────────────────────────── */
    .fields { padding: 0 0.25rem; }
    .field { margin-bottom: 1.25rem; }
    label {
      display: block; margin-bottom: 0.5rem;
      font-weight: 600; color: var(--text-color); font-size: 0.9rem;
    }
    .w-full { width: 100%; }
    .bio-counter { text-align: right; font-size: 0.75rem; color: var(--text-color-secondary); margin-top: 0.25rem; }

    /* ─── Actions ─────────────────────────────────────────────────── */
    .actions {
      display: flex; justify-content: flex-end; gap: 0.75rem;
      margin-top: 2rem; border-top: 1px solid var(--surface-border); padding-top: 1.5rem;
    }
    .actions--onboarding {
      flex-direction: column; align-items: center; border-top: none; padding-top: 0.5rem;
    }
    :host ::ng-deep .onboarding-submit {
      width: 100%; max-width: 280px;
      background: linear-gradient(135deg, #4caf50, #2e7d32) !important;
      border: none !important; font-size: 1rem !important;
      padding: 0.85rem 2rem !important;
    }
    .skip-hint {
      margin-top: 0.75rem; font-size: 0.82rem;
      color: var(--text-color-secondary); cursor: pointer; text-decoration: underline;
    }
    .skip-hint:hover { color: var(--text-color); }
  `]
})
export class ProfileFormComponent implements OnInit {
  @Input({ required: true }) profile!: UserProfile;
  @Input() mode: 'edit' | 'onboarding' = 'edit';
  @Output() saved = new EventEmitter<UserProfile>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private toast = inject(ToastService);

  saving = signal(false);

  previewAvatar = signal<string | null>(null);
  selectedAvatarFile: File | null = null;
  avatarError = signal(false);

  previewCover = signal<string | null>(null);
  selectedCoverFile: File | null = null;
  coverError = signal(false);

  form = this.fb.group({
    username: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9_]{3,20}$')]],
    fullName: ['', [Validators.maxLength(100)]],
    bio: ['', [Validators.maxLength(500)]],
    location: ['', [Validators.maxLength(100)]]
  });

  ngOnInit(): void {
    this.form.patchValue({
      username: this.profile.username,
      fullName: this.profile.fullName,
      bio: this.profile.bio ?? '',
      location: this.profile.location ?? ''
    });
  }

  initials(): string {
    return (this.profile.fullName || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  resolveUrl(url: string | undefined | null): string | null {
    if (!url) return null;
    if (url.startsWith('data:') || url.startsWith('http')) return url;
    return environment.baseUrl + url;
  }

  onAvatarSelect(event: any): void {
    const file: File | undefined = event.files?.[0];
    if (!file) return;
    this.selectedAvatarFile = file;
    this.avatarError.set(false);
    const reader = new FileReader();
    reader.onload = (e: any) => this.previewAvatar.set(e.target.result);
    reader.readAsDataURL(file);
  }

  onCoverSelect(event: any): void {
    const file: File | undefined = event.files?.[0];
    if (!file) return;
    this.selectedCoverFile = file;
    this.coverError.set(false);
    const reader = new FileReader();
    reader.onload = (e: any) => this.previewCover.set(e.target.result);
    reader.readAsDataURL(file);
  }

  save(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);

    const formData = new FormData();
    formData.append('data', new Blob([JSON.stringify({
      username: this.form.value.username,
      fullName: this.form.value.fullName,
      bio: this.form.value.bio,
      location: this.form.value.location
    })], { type: 'application/json' }));

    if (this.selectedAvatarFile) formData.append('image', this.selectedAvatarFile);
    if (this.selectedCoverFile)  formData.append('coverImage', this.selectedCoverFile);

    this.userService.updateProfile(formData).subscribe({
      next: updated => {
        this.saving.set(false);
        this.toast.showSuccess('Profile updated!');
        this.saved.emit(updated);
      },
      error: err => {
        this.saving.set(false);
        this.toast.showError(err.error?.message || 'Failed to update profile');
      }
    });
  }

  skipOnboarding(): void {
    // Emit saved with unchanged profile so the parent can navigate away
    this.saved.emit(this.profile);
  }
}
