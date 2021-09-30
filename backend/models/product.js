

const mongoose = require('mongoose')


const productSchema= new mongoose.Schema({
    name: {
        type:String,
        required:[true,'please enter product name'],
        trim: true,
        maxlength:[100, 'product name cannot exceed 100 character']
    },
    price: {
        type: Number,
        required:[true,'please enter product price'],
        maxlength:[100, 'product price cannot exceed 5 character'],
        default:0.0

    },
    description: {
        type: String,
        required:[true,'please enter product description']
    },
    ratings: {
        type: Number,
        default: 0
    },
    images: [
        {
            public_id:{
                type:String,
                required: true
            },
            url:{
                type:String,
                required: true
            },
        }
    ],
    category: {
       type: String,
       required:[true, 'please select category for this products'],
       enum:  {
           values: [
               'Electronics',
                'Camera',
               'Laptops',
               'Accessories',
               'headphone',
               'Food',
               'Books',
               'Shoes',
               'Beauty/Health',
               'Sports',
               'outdoor',
               'Home'
           ],
           message: 'please select correct category for products'
       }
    },

   seller: {
        type:String,
       required:[true, 'please enter product seller ']
   },
    stock: {
        type: Number,
        required:[true, 'please enter product stock '],
        maxlength:[5, 'product name cannot exceed 5 characters'],
        default: 0
    },
    numOfReviews: {
        type: Number,
        default:0
    },
    reviews: [
        {
            user: {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
                required: true
            },
            name: {
                type:String,
                required:true
            },
            rating:{
                type:Number,
                required: true
            },
            comment:{
                type:String,
                required:true
            }
        }
    ],
    user: {
        "type": mongoose.Schema.ObjectId,
        "ref": 'User',
        "required": true
    },
    createdAt: {
        type: Date,
        default:Date.now
    }
})

module.exports =mongoose.model('Product',productSchema);