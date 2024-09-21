declare module 'posts.js' {
    export function getFunctions(): Promise<never>;
    export function voteForPost(postId: number): Promise<void>;
    export function checkIfAdmin(): Promise<boolean>;
    export function handleDeleteCategory(id: number): Promise<void>;
    export function handleAddCategory(name: string): Promise<void>;
}
