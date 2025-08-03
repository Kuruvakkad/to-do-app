//importing the libraries
const express = require('express'); 
const mysql = require('mysql2/promise');
require('dotenv').config();

//creating an express app
const app = express();
const port = 3000;

//middleware to parse JSON bodies
app.use(express.json());

// This is necessary to allow our frontend (running on a different port) to talk to this backend.
const cors = require('cors');
app.use(cors());

// Configure the MySQL database connection
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
};

let pool;
// Function to connect to the database
async function connectToDatabase() {
    try {
        pool = mysql.createPool(dbConfig);
        console.log('Connected to the database successfully!');
    } catch (error) {
        console.error('Error connecting to the database:', error);
        process.exit(1);
    }
}

// Connect to the database when the server starts
connectToDatabase();

// API Endpoint to get all todos
app.get('/api/todos', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM todos');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching todos:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//api endpoint to add a new todo
app.post('/api/todos', async (req, res) => {
    const { name, type, date, remarks } = req.body;
    if (!name || !type || !date) { // Allow empty remarks
        return res.status(400).json({ error: 'Title and description are required' });
    }
    const query = 'INSERT INTO todos (name, type, date, remarks) VALUES (?, ?, ?, ?)';
    const values = [name, type, date, remarks];

    try {
        const [result] = await pool.execute(query, values);
        res.status(201).json({ id: result.insertId, name, type, date, remarks });
        console.log('Todo added successfully:', { id: result.insertId, name, type, date, remarks });
    } catch (error) {
        console.error('Error adding todo:', error.message, error.stack);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// API Endpoint to delete a todo
app.delete('/api/todos/:id', async (req, res) => {
    const todoId = req.params.id;
    try {
        const [result] = await pool.execute('DELETE FROM todos WHERE id = ?', [todoId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Todo not found' });
        }
        res.status(204).send(); // No content to send back
    } catch (error) {
        console.error('Error deleting todo:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }   
});

// API Endpoint to update a todo
app.put('/api/todos/:id', async (req, res) => {
    const { id } = req.params;
    const { name, type, date, remarks } = req.body;
    if (!name || !type || !date) {
        return res.status(400).json({ error: 'Title and description are required' });
    }
    const query = 'UPDATE todos SET name = ?, type = ?, date = ?, remarks = ? WHERE id = ?';
    const values = [name, type, date, remarks, id];

    try {
        const [result] = await pool.execute(query, values);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Todo not found' });
        }
        res.status(200).json({ id, name, type, date, remarks });
    } catch (error) {
        console.error('Error updating todo:', error.message, error.stack);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// API Endpoint to get a single todo by ID
app.get('/api/todos/:id', async (req, res) => {
    const todoId = req.params.id;
    try {
        const [rows] = await pool.execute('SELECT * FROM todos WHERE id = ?', [todoId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Todo not found' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching todo:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Starting the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});