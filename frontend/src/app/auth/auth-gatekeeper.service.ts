import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGatekeeperService {
    private authService = inject(AuthService);

    // Signal to control the global auth prompt visibility
    showPrompt = signal(false);

    /**
     * Executes the action if user is logged in.
     * Otherwise, opens the auth prompt.
     * @param action Callback to run if authenticated
     */
    run(action: () => void) {
        if (this.authService.currentUser()) {
            action();
        } else {
            this.showPrompt.set(true);
        }
    }
}
