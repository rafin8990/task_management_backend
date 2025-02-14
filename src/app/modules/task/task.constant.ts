export type ITaskFilter = {
    searchTerm?: string;
    userId?: number;
    status?: string;
    priority?: string;
    dueDate?: string;
  };
  
  export const taskSearchableFields = ['title', 'description', 'status', 'priority'];
  
  export const taskFilterableFields = ['userId', 'status', 'priority', 'dueDate', 'searchTerm'];
  