import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { FileUploadModule } from 'primeng/fileupload';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { UserService } from './user.service';
import { UserProfile } from './user.model';
import { MessageService } from 'primeng/api';
import { RippleModule } from 'primeng/ripple';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-edit-profile-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    FileUploadModule,
    RippleModule
  ],
  providers: [MessageService],
  template: `
    <div class="edit-profile">
      <form [formGroup]="form" (ngSubmit)="save()" class="edit-profile__form">
        
        <!-- Cover Image Section -->
        <div class="edit-profile__cover-container">
          <div class="edit-profile__cover-wrapper">
            <img *ngIf="(previewCover() || currentProfile.coverPictureUrl) && !coverError()"
                 [src]="previewCover() || resolveImageUrl(currentProfile.coverPictureUrl)"
                 (error)="handleCoverError($event)"
                 alt="Cover"
                 class="edit-profile__cover-img">
            
            <div *ngIf="(!previewCover() && !currentProfile.coverPictureUrl) || coverError()" class="edit-profile__cover-placeholder">
            </div>

            <div class="edit-profile__camera-overlay cover-overlay">
              <p-fileUpload mode="basic"
                            chooseLabel=" "
                            chooseIcon="pi pi-camera"
                            name="coverImage"
                            accept="image/*"
                            maxFileSize="2000000"
                            (onSelect)="onCoverFileSelect($event)"
                            [auto]="true"
                            class="edit-profile__upload-btn">
              </p-fileUpload>
            </div>
          </div>
        </div>

        <!-- Avatar Section -->
        <div class="edit-profile__avatar-container">
          <div class="edit-profile__avatar-wrapper">
             <!-- Avatar Image -->
             <img *ngIf="(previewImage() || currentProfile.profilePictureUrl) && !imageError()" 
                  [src]="previewImage() || resolveImageUrl(currentProfile.profilePictureUrl)"
                  (error)="handleImageError($event)"
                  alt="Avatar" 
                  class="edit-profile__avatar-img">
             
             <!-- Fallback Initial (if no image or error) -->
             <div *ngIf="(!previewImage() && !currentProfile.profilePictureUrl) || imageError()" class="edit-profile__avatar-placeholder">
                {{ getInitials(currentProfile.fullName) }}
             </div>

            <!-- Camera Overlay -->
            <div class="edit-profile__camera-overlay">
              <p-fileUpload mode="basic" 
                            chooseLabel=" " 
                            chooseIcon="pi pi-camera" 
                            name="image" 
                            accept="image/*" 
                            maxFileSize="1000000" 
                            (onSelect)="onFileSelect($event)"
                            [auto]="true"
                            class="edit-profile__upload-btn">
              </p-fileUpload>
            </div>
          </div>
        </div>

        <!-- Text Fields -->
        <div class="field">
          <label for="fullName">Full Name</label>
          <input pInputText id="fullName" formControlName="fullName" class="w-full" />
          <small class="p-error" *ngIf="form.get('fullName')?.invalid && form.get('fullName')?.touched">
            Name is too long.
          </small>
        </div>

        <div class="field">
          <label for="username">Username</label>
          <div class="p-inputgroup">
            <span class="p-inputgroup-addon">&#64;</span>
            <input pInputText id="username" formControlName="username" />
          </div>
          <small class="p-error" *ngIf="form.get('username')?.invalid && form.get('username')?.touched">
            Username must be 3-20 alphanumeric characters.
          </small>
        </div>

        <div class="field">
          <label for="bio">Bio</label>
          <textarea pInputTextarea id="bio" formControlName="bio" rows="3" class="w-full"></textarea>
          <div class="bio-counter">
            {{ form.get('bio')?.value?.length || 0 }}/500
          </div>
        </div>

        <div class="edit-profile__actions">
          <p-button label="Cancel" styleClass="p-button-text" (onClick)="cancel()"></p-button>
          <p-button label="Save" type="submit" [loading]="saving()" [disabled]="form.invalid"></p-button>
        </div>

      </form>
    </div>
  `,
  styles: [`
    .edit-profile {
      padding: 0.5rem;
    }
    .edit-profile__cover-container {
      margin-bottom: -60px; /* Pull avatar up overlapping cover */
      position: relative;
    }
    .edit-profile__cover-wrapper {
        position: relative;
        height: 120px;
        background: linear-gradient(135deg, #ddd, #eee);
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 0;
    }
    .edit-profile__cover-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    .edit-profile__cover-placeholder {
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #2E7D32 0%, #66BB6A 100%);
    }
    .cover-overlay {
        bottom: 8px !important;
        right: 8px !important;
        background: rgba(0,0,0,0.4) !important;
        backdrop-filter: blur(4px);
        border: 1px solid rgba(255,255,255,0.3) !important;
    }
    
    .edit-profile__avatar-container {
      display: flex;
      justify-content: flex-start; /* Align left */
      padding-left: 20px;
      margin-bottom: 1.5rem;
      position: relative;
      z-index: 2;
    }
    .edit-profile__avatar-wrapper {
      position: relative;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background-color: var(--surface-ground);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border: 4px solid var(--surface-card);
    }
    .edit-profile__avatar-img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      display: block;
    }
    .edit-profile__avatar-placeholder {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-color), var(--primary-500));
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
      font-weight: 700;
    }
    .edit-profile__camera-overlay {
      position: absolute;
      bottom: 0px;
      right: 0px;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--primary-color);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      border: 2px solid var(--surface-card);
      overflow: hidden;
      cursor: pointer;
      transition: all 0.2s ease;
      z-index: 10;
    }
    .edit-profile__camera-overlay:hover {
        transform: scale(1.1);
        background: var(--primary-600);
    }

    /* Force p-fileUpload to be merely an icon container */
    :host ::ng-deep .edit-profile__upload-btn .p-button {
      width: 100% !important;
      height: 100% !important;
      border-radius: 50% !important;
      padding: 0 !important;
      background: transparent !important;
      border: none !important;
      color: #fff !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    :host ::ng-deep .edit-profile__upload-btn .p-button:hover {
        background: transparent !important;
    }
    :host ::ng-deep .edit-profile__upload-btn .p-button-icon {
        font-size: 1.1rem;
        margin: 0 !important;
    }
    :host ::ng-deep .edit-profile__upload-btn .p-button-label {
        display: none;
    }

    .field {
      margin-bottom: 1.5rem;
    }
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: var(--text-color);
      font-size: 0.9rem;
    }
    .w-full {
      width: 100%;
    }
    
    .bio-counter {
        text-align: right;
        font-size: 0.75rem;
        color: var(--text-color-secondary);
        margin-top: 0.25rem;
    }

    .edit-profile__actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 2rem;
      border-top: 1px solid var(--surface-border);
      padding-top: 1.5rem;
    }
  `]
})
export class EditProfileDialogComponent {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private ref = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);
  private messageService = inject(MessageService);
  private authService = inject(AuthService);

  currentProfile: UserProfile = this.config.data.profile;
  saving = signal(false);

  // Avatar
  previewImage = signal<string | null>(null);
  selectedFile: File | null = null;
  imageError = signal(false);

  // Cover
  previewCover = signal<string | null>(null);
  selectedCoverFile: File | null = null;
  coverError = signal(false);

  form = this.fb.group({
    username: [this.currentProfile.username, [Validators.required, Validators.pattern('^[a-zA-Z0-9_]{3,20}$')]],
    fullName: [this.currentProfile.fullName, [Validators.maxLength(100)]],
    bio: [this.currentProfile.bio || '', [Validators.maxLength(500)]]
  });

  onFileSelect(event: any) {
    const file = event.files && event.files[0];
    if (file) {
      this.selectedFile = file;
      this.imageError.set(false);
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewImage.set(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  onCoverFileSelect(event: any) {
    const file = event.files && event.files[0];
    if (file) {
      this.selectedCoverFile = file;
      this.coverError.set(false);
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewCover.set(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  handleImageError(event: any) {
    this.imageError.set(true);
  }

  handleCoverError(event: any) {
    this.coverError.set(true);
  }

  resolveImageUrl(url: string | undefined | null): string | null {
    if (!url) return null;
    if (url.startsWith('data:')) return url;
    if (url.startsWith('http')) return url;
    return 'http://localhost:8080' + url;
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  save() {
    if (this.form.invalid) return;

    this.saving.set(true);
    const formData = new FormData();

    // JSON part
    const profileData = {
      username: this.form.value.username,
      fullName: this.form.value.fullName,
      bio: this.form.value.bio
    };
    formData.append('data', new Blob([JSON.stringify(profileData)], { type: 'application/json' }));

    // Image parts
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }
    if (this.selectedCoverFile) {
      formData.append('coverImage', this.selectedCoverFile);
    }

    this.userService.updateProfile(formData).subscribe({
      next: (updatedProfile) => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Profile updated' });

        // Update local auth state
        const currentUser = this.authService.currentUser();
        if (currentUser) {
          this.authService.currentUser.set({
            ...currentUser,
            fullName: updatedProfile.fullName,
            username: updatedProfile.username,
            profilePictureUrl: updatedProfile.profilePictureUrl
          });
        }

        this.ref.close(updatedProfile);
      },
      error: (err) => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to update profile' });
      }
    });
  }

  cancel() {
    this.ref.close();
  }
}
