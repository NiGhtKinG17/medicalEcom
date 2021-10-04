const mongoose= require('mongoose');

const orderSchema = new mongoose.Schema({
  user: String,
  email: String,
  order: []
})

const Order = module.exports = mongoose.model('Order', orderSchema);
