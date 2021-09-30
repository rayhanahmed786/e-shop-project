const app=require('./app');
const connectDatabase=require('./config/database')
const cloudinary = require('cloudinary')
const dotenv=require('dotenv');

// Handle Uncaught exception
process.on('uncaughtException',err =>{
  console.log(`ERROR: ${err.stack}`);
  console.log('shutting down server due to uncaught exception');
  process.exit(1)
})

//setting up config file
dotenv.config({path:'backend/config/config.env'});

//connect database
connectDatabase();

// settting up cloudinary configaration 
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NMAE,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})


const server = app.listen(process.env.PORT, () => {
  console.log(`server started on PORT: ${process.env.PORT} in ${process.env.NODE_ENV} mode.`);
})

// Handle Unhandled promise rejection
process.on('unhandledRejection', err => {
  console.log(`ERROR: ${err.stack}`);
  console.log('shutting down the server due to unhanded promise  rejection');
  server.close(() => {
    process.exit(1)
  })
})

