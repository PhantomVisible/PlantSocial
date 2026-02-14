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

export interface WikiValidation {
    summary: WikiSummary;
    isValid: boolean;
}

const BOTANICAL_KEYWORDS = [
    'plant', 'species', 'botany', 'flower', 'tree', 'shrub', 'vegetable',
    'fruit', 'herb', 'cultivar', 'crop', 'agriculture', 'harvest', 'garden',
    'leaf', 'root', 'stem', 'flora', 'fern', 'moss', 'algae', 'fungi',
    'fungus', 'seed', 'pollen', 'orchid', 'succulent', 'cactus', 'vine',
    'perennial', 'annual', 'biennial', 'genus', 'family', 'flowering',
    'photosynthesis', 'chlorophyll', 'tropical', 'deciduous', 'conifer',
    'edible', 'medicinal', 'ornamental', 'horticulture', 'nursery',
    'greenhouse', 'foliage', 'blossom', 'petal', 'sprout', 'seedling',
    'compost', 'soil', 'mulch', 'pruning', 'propagation', 'bulb', 'tuber',
    'rhizome', 'native', 'invasive', 'woodland', 'grassland', 'wetland'
];

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

    validateTopic(title: string): Observable<WikiValidation> {
        return this.getSummary(title).pipe(
            map(summary => {
                const text = [
                    summary.extract || '',
                    summary.description || '',
                    summary.title || ''
                ].join(' ').toLowerCase();

                const isValid = BOTANICAL_KEYWORDS.some(kw => text.includes(kw));
                return { summary, isValid };
            })
        );
    }
}
