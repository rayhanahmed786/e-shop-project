const mongoose=require('mongoose');


const connectDatabase= () => {
    mongoose.connect(process.env.DB_LOCAL_URI,{
        useNewUrlParser:true,
        useUnifiedTopology:true,
        useCreateIndex:true
    }).then(con =>{
        console.log(`mongoose database connection with host: ${con.connection.host} `)
    })

}
module.exports=connectDatabase;

//DB_LOCAL_URI= mongodb://localhost:27017/ShopIT