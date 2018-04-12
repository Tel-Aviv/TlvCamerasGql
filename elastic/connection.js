var elasticsearch=require('elasticsearch');

var client = new elasticsearch.Client( {
  hosts: ['10.1.70.47:9200'],
  //log: 'trace'
});


module.exports = client;
