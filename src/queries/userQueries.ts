export const UserQueries = {
  CREATE_USER: `
    INSERT INTO users (name, email, password, role_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, NOW(), NOW())
  `,

  GET_USER_BY_ID: `
    SELECT id, name, email, role_id, created_at, updated_at 
    FROM users 
    WHERE id = ?
  `,

  GET_ALL_USERS: `
    SELECT id, name, email, role_id, created_at, updated_at 
    FROM users 
    WHERE deleted_at IS NULL
  `,

  FIND_USER_BY_EMAIL: `
    SELECT id, name, email, password, role_id, created_at, updated_at 
    FROM users 
    WHERE email = ?
  `,

  UPDATE_USER: `
    UPDATE users 
    SET name = ?, email = ?, password = ?, role_id = ?, updated_at = NOW() 
    WHERE id = ?
  `,

  DELETE_USER: `
    UPDATE users 
    SET deleted_at = NOW() 
    WHERE id = ?
  `,

  RESTORE_USER: `
    UPDATE users 
    SET deleted_at = NULL 
    WHERE id = ?
  `,

  HARD_DELETE_USER: `
    DELETE FROM users WHERE id = ?
  `,
};
