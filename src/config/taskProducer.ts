import connection from './db';

const createProcedureQuery = `
CREATE PROCEDURE generate_task_report(IN user_id INT, IN start_date DATE, IN end_date DATE)
BEGIN
  SELECT * FROM tasks
  WHERE user_id = user_id
  AND created_at BETWEEN start_date AND end_date
  ORDER BY created_at;
END;
`;

connection.query(createProcedureQuery, (err, result) => {
  if (err) {
    console.error('Error creating procedure:', err);
  } else {
    console.log('Procedure created successfully:', result);
  }
  connection.end();
});
