export interface UserProfile {
    id: string;
    username: string;
    fullName: string;
    bio: string | null;
    location: string | null;
    profilePictureUrl?: string; // Optional because legacy users might not have it immediately
    coverPictureUrl?: string;
    joinDate: string;
    postCount: number;
    followerCount: number;
    followingCount: number;
    isFollowing: boolean;
}

export interface UserHoverCard {
    id: string;
    fullName: string;
    username: string;
    bio: string | null;
    profilePictureUrl?: string;
    followerCount: number;
    followingCount: number;
    isFollowing: boolean;
}
