//url of backend API
const apiUrl = 'http://localhost:3000/api/todos';

//get reference to the HTML elements
const todoForm = document.getElementById('todoForm');
const todoList = document.getElementById('todoList');

let currentEditId = null;

// --- NEW CODE: Get the submit button element ---
const submitButton = todoForm.querySelector('button[type="submit"]');

// --- NEW CODE: Get references to the input fields ---
const todoNameInput = document.getElementById('todoName');
const todoTypeSelect = document.getElementById('todoType');
const todoDateInput = document.getElementById('todoDate');
const todoRemarkTextarea = document.getElementById('todoRemark');

// Function to fetch todos from the backend
async function fetchTodos() {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const todos = await response.json();
        renderTodos(todos);
    } catch (error) {
        console.error('Error fetching todos:', error);
    }
}

//fundtion to render todos in the UI
function renderTodos(todos) {
    todoList.innerHTML = '';
    todos.forEach(todo => {
        const li = document.createElement('li');
        li.dataset.id = todo.id;
        li.dataset.name = todo.name;
        li.dataset.type = todo.type;
        li.dataset.date = todo.date;
        li.dataset.remarks = todo.remarks;

        li.innerHTML = `
            <div>
                <strong>${todo.name}</strong> (${todo.type})
                <br>
                <span>Date: ${todo.date}</span>
                <p><em>${todo.remarks}</em></p>
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Delete</button>
            </div>
        `;
        todoList.appendChild(li);
    });
}
//event listener for handle delete and edit clicks
todoList.addEventListener('click', async (event) => {
    if (event.target.classList.contains('delete-btn')) {
        const todoId = event.target.closest('li').dataset.id;
        if (confirm('Are you sure you want to delete this todo?')) {
            await deleteTodo(todoId);
        }
    }
    if (event.target.classList.contains('edit-btn')) {
        const todoItem = event.target.closest('li');
        const todoId = todoItem.dataset.id;

        todoNameInput.value = todoItem.dataset.name;
        todoTypeSelect.value = todoItem.dataset.type;

        // Format date to yyyy-MM-dd
        let dateValue = todoItem.dataset.date;
        if (dateValue && dateValue.includes('T')) {
            dateValue = dateValue.split('T')[0];
        }
        todoDateInput.value = dateValue;

        todoRemarkTextarea.value = todoItem.dataset.remarks;

        submitButton.textContent = 'Update To-Do';
        currentEditId = todoId;
    }
});

// --- NEW CODE: Function to delete a to-do item ---
async function deleteTodo(id) {
    try {
        const response = await fetch(`${apiUrl}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete to-do');
        }

        fetchTodos(); // Refresh the list
    } catch (error) {
        console.error('Error deleting to-do:', error);
    }
}

// Event listener for the form submission
todoForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(todoForm);
    const newTodo = {
        name: formData.get('todoName'),
        type: formData.get('todoType'),
        date: formData.get('todoDate'),
        remarks: formData.get('todoRemarks') // <-- use 'todoRemarks' here
    };

    let response;

    if (currentEditId) {
        // --- NEW CODE: This is the logic for updating an existing to-do ---
        response = await fetch(`${apiUrl}/${currentEditId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newTodo)
        });
    } else {
        // --- EXISTING CODE: This is for adding a new to-do ---
        response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newTodo)
        });
    }

    try {
        if (!response.ok) {
            throw new Error('Failed to save to-do');
        }
        
        // Reset the form, button text, and edit ID
        todoForm.reset();
        submitButton.textContent = 'Submit';
        currentEditId = null;

        fetchTodos(); // Refresh the list
    } catch (error) {
        console.error('Error saving to-do:', error);
    }
});

// Initial fetch of to-dos when the page loads
fetchTodos();