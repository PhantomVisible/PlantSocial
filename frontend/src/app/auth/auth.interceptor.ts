import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { OAuthService } from 'angular-oauth2-oidc';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const platformId = inject(PLATFORM_ID);
    const oauthService = inject(OAuthService);

    // Only attach token for requests to our own backend (e.g. Gateway at 9000, or env urls)
    const isBackend = req.url.startsWith('http://localhost:9000') || 
                      req.url.startsWith(environment.baseUrl) || 
                      req.url.startsWith(environment.gamificationBaseUrl) || 
                      req.url.startsWith('/api');

    if (isPlatformBrowser(platformId) && isBackend) {
        const token = oauthService.getAccessToken();
        if (token) {
            const cloned = req.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`
                }
            });
            return next(cloned);
        }
    }
    return next(req);
};
