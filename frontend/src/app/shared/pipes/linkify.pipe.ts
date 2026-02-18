import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
    name: 'linkify',
    standalone: true
})
export class LinkifyPipe implements PipeTransform {

    constructor(private sanitizer: DomSanitizer) { }

    transform(text: string): SafeHtml {
        if (!text) return text;

        // 1. Mentions: @username -> <a href="/profile/username">@username</a>
        // We use a regex that captures the name after @
        let html = text.replace(/@(\w+)/g, (match, username) => {
            return `<a href="/profile/${username}" class="link-mention" onclick="event.stopPropagation()">@${username}</a>`;
        });

        // 2. Hashtags: #tag -> <a href="/explore?q=tag">#tag</a>
        // Note: We use query params for search
        html = html.replace(/#(\w+)/g, (match, tag) => {
            return `<a href="/explore?q=${tag}" class="link-hashtag" onclick="event.stopPropagation()">#${tag}</a>`;
        });

        return this.sanitizer.bypassSecurityTrustHtml(html);
    }
}
