const mongoose = require('mongoose')
mongoose.Promise = global.Promise

const slug = require('slugs')

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: 'Please enter a store name'
    },
    slug: String,
    description: String,
    tags: [String],
    created: {
        type: Date,
        default: Date.now
    },
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: {
            type: [{
                type: Number,
                required: 'You must provide coordinates'
            }]
        },
        address: {
            type: String,
            required: 'You must supply address'
        }
    },
    photo: String,
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
})

//Define indexes
storeSchema.index({
    name: 'text',
    description: 'text'
})

storeSchema.index({ location: '2dsphere' })

/*
storeSchema.index({
    name: 1,
    description: 1,
    tags: 1
})
*/

//Slug can be used to generate URL friendly Strings i.e. 'Tim Hortons' => tim-hortons
storeSchema.pre('save', async function(next) {
    if(!this.isModified('name')) {
        next();
        return;
    }
    this.slug = slug(this.name);
    // ^(this.slug) starts with this.slug
    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i')
    const storesWithSlug = await this.constructor.find({ slug: slugRegEx} )

    if (storesWithSlug.length >= 1) {
        this.slug = `${this.slug}-${storesWithSlug.length + 1}`
    }

    next()
})

storeSchema.statics.getTagsList = function() {
    return this.aggregate([
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: {$sum: 1} } },
        { $sort : { count: -1 } }
    ])
} 

storeSchema.statics.getTopStores = function() {
    return this.aggregate([
        // lookup stores and populate reviews
        { $lookup: {from: 'reviews', localField: '_id', foreignField: 'store', as: 'reviews' }},
        { $match: {'reviews.1': { $exists: true }}},
        { $addFields: {
            averageRating: {$avg: '$reviews.rating'}
        }},
        { $sort: { averageRating: -1 } },
        { $limit: 10 }
    ])
} 

storeSchema.virtual('reviews', { // create a virtual field called review
    ref: 'Review',
    localField: '_id',
    foreignField: 'store'
})

function autopopulate(next) {
    this.populate('reviews')
    next();
}

storeSchema.pre('find', autopopulate)
storeSchema.pre('findOne', autopopulate)

module.exports = mongoose.model('Store', storeSchema)