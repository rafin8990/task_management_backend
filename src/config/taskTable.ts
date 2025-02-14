import connection from './db';

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
    user_id INT,
    due_date TIMESTAMP NULL,
    priority ENUM('low', 'medium', 'high') DEFAULT 'low',
    position INT DEFAULT 0,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`;

const createIndexUserQuery = 'CREATE INDEX idx_user_id ON tasks(user_id);';
const createIndexStatusQuery = 'CREATE INDEX idx_status ON tasks(status);';

connection.query(createTableQuery, (err, result) => {
  if (err) {
    console.error('Error creating table:', err);
  } else {
    console.log('Table created successfully:', result);

    connection.query(createIndexUserQuery, (err, result) => {
      if (err) {
        console.error('Error creating user_id index:', err);
      } else {
        console.log('user_id index created successfully:', result);
      }
    });

    connection.query(createIndexStatusQuery, (err, result) => {
      if (err) {
        console.error('Error creating status index:', err);
      } else {
        console.log('status index created successfully:', result);
      }
      connection.end(); 
    });
  }
});
