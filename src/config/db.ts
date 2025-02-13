import mysql from 'mysql2';
import config from '.';

const connection = mysql.createConnection({
  host: config.database.host,           
  user: config.database.username,         
  password: config.database.password,     
  database: config.database.database,   
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,  
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
    return;
  }
  console.log('Connected to the MySQL database Successfully.');
});

export default connection;


