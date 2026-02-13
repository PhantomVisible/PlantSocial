import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';

export interface WikiSummary {
    title: string;
    extract: string;
    description?: string;
    thumbnail?: { source: string; width: number; height: number };
    content_urls?: { desktop: { page: string } };
}

@Injectable({
    providedIn: 'root'
})
export class WikipediaService {
    private http = inject(HttpClient);

    search(term: string): Observable<string[]> {
        if (!term || term.trim().length < 2) return of([]);
        const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(term)}&limit=6&origin=*`;
        return this.http.get<any[]>(url).pipe(
            map((response: any[]) => response[1] || [])
        );
    }

    getSummary(title: string): Observable<WikiSummary> {
        const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
        return this.http.get<WikiSummary>(url);
    }
}
