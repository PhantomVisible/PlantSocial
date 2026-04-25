import { Component, inject } from '@angular/core';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { AuthService } from '../../auth/auth.service';
import { ProfileFormComponent } from './profile-form.component';
import { UserProfile } from './user.model';

/**
 * Thin shell around ProfileFormComponent for the PrimeNG DynamicDialog context.
 * All form logic lives in ProfileFormComponent.
 */
@Component({
  selector: 'app-edit-profile-dialog',
  standalone: true,
  imports: [ProfileFormComponent],
  template: `
    <app-profile-form
      [profile]="currentProfile"
      mode="edit"
      (saved)="onSaved($event)"
      (cancelled)="ref.close()">
    </app-profile-form>
  `
})
export class EditProfileDialogComponent {
  ref = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);
  private authService = inject(AuthService);

  currentProfile: UserProfile = this.config.data.profile;

  onSaved(updated: UserProfile): void {
    const user = this.authService.currentUser();
    if (user) {
      this.authService.currentUser.set({
        ...user,
        fullName: updated.fullName,
        username: updated.username,
        profilePictureUrl: updated.profilePictureUrl
      });
    }
    this.ref.close(updated);
  }
}
