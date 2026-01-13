declare module '../api/posts.js' {
    export const fetchVotesData: () => Promise<any>;
    export const getFunctions: () => Promise<any>;
    export const voteForPost: (postId: string) => Promise<any>;
}
