import connection from './db'

const createTableQuery = `
 CREATE TABLE task_activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT,
  user_id INT,
  action ENUM('created', 'updated', 'deleted') NOT NULL,
  description TEXT, 
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
`

connection.query(createTableQuery, (err, result) => {
  if (err) {
    console.error('Error creating table:', err)
  } else {
    console.log('Table created successfully:', result)
  }
  connection.end()
})
