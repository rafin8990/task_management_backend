export type IUserFilter = {
  searchTerm: string
  email?: string
}

export const UserSearchableFields = [
  'searchTerm',
  'id',
  'name',
  'email',
  'role',
]

export const UserFilterableFields = ['searchTerm','id', 'name', 'email', 'role']
