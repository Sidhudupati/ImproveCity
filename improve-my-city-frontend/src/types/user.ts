export interface User {
    id: string;
    email: string;
    password: string;
    name: string;
    isAdmin: boolean;
    createdAt: number;
    data: Record<string, any>
}