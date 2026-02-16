export interface UserProfile {
    id: string;
    username: string;
    fullName: string;
    bio: string | null;
    location: string | null;
    profilePictureUrl?: string; // Optional because legacy users might not have it immediately
    joinDate: string;
    postCount: number;
}
