import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { OAuthService } from 'angular-oauth2-oidc';
import { environment } from '../../environments/environment';
import { catchError, EMPTY } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const platformId = inject(PLATFORM_ID);
    const oauthService = inject(OAuthService);

    const isBackend = req.url.startsWith('http://localhost:9000') ||
                      req.url.startsWith(environment.baseUrl) ||
                      req.url.startsWith(environment.gamificationBaseUrl) ||
                      req.url.startsWith('/api');

    if (!isPlatformBrowser(platformId) || !isBackend) {
        return next(req);
    }

    const token = oauthService.hasValidAccessToken() ? oauthService.getAccessToken() : null;
    const outgoing = token
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;

    return next(outgoing).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                oauthService.initCodeFlow();
                return EMPTY;
            }
            throw error;
        })
    );
};
