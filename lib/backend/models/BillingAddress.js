const mongoose = require('mongoose');

const BillingAddressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: [true, 'Please add a first name'],
    trim: true,
    maxlength: [50, 'First name cannot be more than 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Please add a last name'],
    trim: true,
    maxlength: [50, 'Last name cannot be more than 50 characters']
  },
  address: {
    type: String,
    required: [true, 'Please add an address'],
    trim: true,
    maxlength: [200, 'Address cannot be more than 200 characters']
  },
  city: {
    type: String,
    required: [true, 'Please add a city'],
    trim: true,
    maxlength: [100, 'City cannot be more than 100 characters']
  },
  state: {
    type: String,
    required: [true, 'Please add a state'],
    trim: true,
    maxlength: [100, 'State cannot be more than 100 characters']
  },
  country: {
    type: String,
    required: [true, 'Please add a country'],
    trim: true,
    maxlength: [100, 'Country cannot be more than 100 characters']
  },
  zipCode: {
    type: String,
    required: [true, 'Please add a ZIP code'],
    trim: true,
    maxlength: [20, 'ZIP code cannot be more than 20 characters']
  }
}, {
  timestamps: true
});

// Prevent model overwrite during hot reload in Next.js
module.exports = mongoose.models.BillingAddress || mongoose.model('BillingAddress', BillingAddressSchema);

