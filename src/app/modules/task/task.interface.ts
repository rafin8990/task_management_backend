export type ITask={
        id?: number;
        title: string;
        description: string | null;
        status: 'pending' | 'in_progress' | 'completed';
        user_id: number;
        due_date:Date
        priority:'low'|'medium'|'high'
        position:number
        is_archived:true|false
        created_at: Date;
        updated_at: Date; 
        deleted_at: Date | null;
}