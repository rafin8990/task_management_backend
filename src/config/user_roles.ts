import connection from './db';

const createUserRolesTableQuery = `
  CREATE TABLE IF NOT EXISTS user_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
  );
`;

connection.query(createUserRolesTableQuery, (err, result) => {
  if (err) {
    console.error('Error creating user_roles table:', err);
  } else {
    console.log('User-Roles relationship table created successfully:', result);
  }
  connection.end(); 
});
