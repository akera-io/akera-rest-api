module.exports = function(TestModel) {
  TestModel.hello = function(name, cb) {
    cb(null, 'Hello ' + name);
  };
};