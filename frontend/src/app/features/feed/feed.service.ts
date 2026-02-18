import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Post {
  id: string;
  content: string;
  imageUrl?: string;
  authorName: string;
  authorUsername: string;
  authorId: string;
  authorProfilePictureUrl?: string; // Add this
  createdAt: string;
  likesCount: number;
  commentCount: number;
  likedByCurrentUser: boolean;
  plantId?: string;
  plantNickname?: string;
  plantTag?: string;
  originalPost?: Post; // Recursively defined
  repostCount: number;
  isRepostedByCurrentUser: boolean;
}

export interface CommentRequest {
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class FeedService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/feed';

  getFeed(page: number = 0, size: number = 10, plant?: string, query?: string): Observable<{ content: Post[] }> {
    let url = `${this.apiUrl}?page=${page}&size=${size}`;
    if (plant) {
      url += `&plant=${encodeURIComponent(plant)}`;
    }
    if (query) {
      url += `&q=${encodeURIComponent(query)}`;
    }
    return this.http.get<{ content: Post[] }>(url);
  }

  getPostById(id: string): Observable<Post> {
    // Note: Backend endpoint is /api/v1/posts/{id}, which is distinct from /api/v1/feed
    // Construct the URL directly or update apiUrl base.
    // For now, I'll hardcode the replacement since apiUrl is .../feed
    const baseUrl = this.apiUrl.replace('/feed', '/posts');
    return this.http.get<Post>(`${baseUrl}/${id}`);
  }

  createPost(caption: string, file?: File, plantId?: string, plantTag?: string): Observable<Post> {
    const formData = new FormData();
    formData.append('caption', caption);
    if (file) {
      formData.append('file', file);
    }
    if (plantId) {
      formData.append('plantId', plantId);
    }
    if (plantTag) {
      formData.append('plantTag', plantTag);
    }
    return this.http.post<Post>(this.apiUrl, formData);
  }

  editPost(postId: string, caption: string, plantTag?: string | null): Observable<Post> {
    const formData = new FormData();
    formData.append('caption', caption);
    if (plantTag) {
      formData.append('plantTag', plantTag);
    }
    return this.http.put<Post>(`${this.apiUrl}/${postId}`, formData);
  }

  deletePost(postId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${postId}`);
  }

  likePost(postId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${postId}/like`, {});
  }

  repostPost(postId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${postId}/repost`, {});
  }

  commentOnPost(postId: string, request: CommentRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${postId}/comment`, request);
  }
}
