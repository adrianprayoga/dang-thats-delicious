const mongoose = require('mongoose')
mongoose.Promise = global.Promise

const reviewSchema = new mongoose.Schema({
    rating: {
        type: Number,
        required: 'rating is required',
        min: 1,
        max: 5
    },
    text: String,
    store: {
        type: mongoose.Schema.ObjectId,
        ref: 'Store',
        required: true
    },
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    }
})

function autopopulate(next) {
    this.populate('author')
    next();
}

reviewSchema.pre('find', autopopulate)
reviewSchema.pre('findOne', autopopulate)

module.exports = mongoose.model('Review', reviewSchema)