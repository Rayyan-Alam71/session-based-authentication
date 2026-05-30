import express from "express"
import { addTodoController, getTodosController, loginController, logoutController, signupController } from "./controller.js"
import { auth } from "./middleware.js"

const app = express()

app.use(express.urlencoded({ extended : true}))
app.use(express.json())
app.get('/health', (req, res)=>{
    return res.status(200).send('server running fine')
})

app.post('/signup', signupController)

app.post('/login', loginController)

app.get('/todos', auth, getTodosController)

app.post('/add-todo', auth, addTodoController)

app.post("/logout", logoutController)

app.listen(3000, ()=>console.log('server is running on port 3000')
)