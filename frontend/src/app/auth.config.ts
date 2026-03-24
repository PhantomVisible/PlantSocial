import { AuthConfig } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {
  issuer: 'http://localhost:8082/realms/plantsocial',
  redirectUri: typeof window !== 'undefined' ? window.location.origin + '/index.html' : '',
  clientId: 'plantsocial-frontend',
  responseType: 'code',
  strictDiscoveryDocumentValidation: false,
  requireHttps: false,
  scope: 'openid profile email offline_access',
};
