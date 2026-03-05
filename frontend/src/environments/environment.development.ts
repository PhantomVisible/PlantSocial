function getHost() {
    return (typeof globalThis !== 'undefined' && globalThis.window) ? globalThis.window.location.hostname : 'localhost';
}

export const environment = {
    production: false,
    get apiUrl() { return `http://${getHost()}:8080/api/v1`; },
    get baseUrl() { return `http://${getHost()}:8080`; },
    get wsUrl() { return `ws://${getHost()}:8080/ws`; },
    get gamificationApiUrl() { return `http://${getHost()}:8081/api/game`; },
    get gamificationBaseUrl() { return `http://${getHost()}:8081`; }
};
