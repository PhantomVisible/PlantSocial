import { Injectable, signal, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    isDarkMode = signal<boolean>(false);

    constructor(
        @Inject(PLATFORM_ID) private platformId: Object,
        @Inject(DOCUMENT) private document: Document
    ) {
        this.initTheme();
    }

    private initTheme() {
        if (!isPlatformBrowser(this.platformId)) {
            return; // Skip localStorage and DOM manipulation on the server
        }
        // Only activate dark mode if explicitly set by the user previously
        const savedTheme = localStorage.getItem('theme');

        if (savedTheme === 'dark') {
            this.isDarkMode.set(true);
            this.swapTheme('lara-dark-green');
        } else {
            this.isDarkMode.set(false);
            this.swapTheme('lara-light-green');
        }
    }

    private swapTheme(theme: string) {
        const themeLink = this.document.getElementById('app-theme') as HTMLLinkElement;
        if (themeLink) {
            themeLink.href = `assets/themes/${theme}/theme.css`;
        }
    }

    toggleTheme() {
        const newThemeState = !this.isDarkMode();
        this.isDarkMode.set(newThemeState);

        if (isPlatformBrowser(this.platformId)) {
            if (newThemeState) {
                this.swapTheme('lara-dark-green');
                localStorage.setItem('theme', 'dark');
            } else {
                this.swapTheme('lara-light-green');
                localStorage.setItem('theme', 'light');
            }
        }
    }
}
