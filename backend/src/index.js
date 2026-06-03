require('dotenv').config();
const express =require('express');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

//A simple test route to confirm the server works
app.get('/',(req,res)=>{
    res.json({message: 'Vismark backend is running!'});
});

const PORT =process.env.port;
app.listen(PORT,()=>{
    console.log('Backend running on port ${PORT}');
});