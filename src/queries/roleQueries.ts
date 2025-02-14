export const RoleQueries = {
    CREATE_ROLE: `
      INSERT INTO roles (name)
      VALUES (?)
    `,
  
    GET_ROLE_BY_ID: `
      SELECT id, name
      FROM roles 
      WHERE id = ?
    `,
  
    GET_ALL_ROLES: `
      SELECT id, name
      FROM roles 
      WHERE deleted_at IS NULL
    `,
  
    FIND_ROLE_BY_NAME: `
      SELECT id, name 
      FROM roles 
      WHERE name = ?
    `,
  
    UPDATE_ROLE: `
      UPDATE roles 
      SET name = ?
      WHERE id = ?
    `,
    DELETE_ROLE: `
      DELETE FROM roles WHERE id = ?
    `,
  };