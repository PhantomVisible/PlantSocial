import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../profile/user.service';
import { AuthService } from '../../../auth/auth.service';
import { ToastService } from '../../../core/toast.service';

@Component({
    selector: 'app-pro-upgrade-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './pro-upgrade-modal.component.html',
    styleUrl: './pro-upgrade-modal.component.scss'
})
export class ProUpgradeModalComponent {
    @Output() closed = new EventEmitter<void>();

    private userService = inject(UserService);
    private authService = inject(AuthService);
    private toast = inject(ToastService);

    isUpgrading = false;

    upgrade() {
        this.isUpgrading = true;
        this.userService.upgradeToProTest().subscribe({
            next: () => {
                this.authService.currentUser.update(u => u ? { ...u, subscriptionTier: 'PRO' } : u);
                this.toast.showSuccess('Welcome to Pro! Enjoy unlimited listings.');
                this.closed.emit();
            },
            error: () => {
                this.toast.showError('Upgrade failed. Please try again.');
                this.isUpgrading = false;
            }
        });
    }

    close() {
        if (!this.isUpgrading) this.closed.emit();
    }
}
