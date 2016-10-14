module.exports = function(Customer) {
  Customer.getName = function(id, cb) {
    cb(null, 'TestCustomer');
  };
};