export type ITask={
        id?: number;
        title: string;
        description: string | null;
        status: 'pending' | 'in_progress' | 'completed';
        user_id: number;
        created_at: Date;
        updated_at: Date; 
        deleted_at: Date | null;
}