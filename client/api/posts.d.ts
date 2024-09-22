declare module 'posts.js' {
    export function fetchVotesData(): Promise<any>;
    export function getFunctions(): Promise<any>;
    export function voteForPost(postId: number, vote: any): Promise<any>;
}