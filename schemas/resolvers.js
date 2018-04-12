 var Kafka = require('no-kafka');
import elasticsearch from 'elasticsearch';

function isMockMode(): boolean {

  let mockToken = process.argv.find( (arg: string) => {
    return arg == "--mock"
  });

  return mockToken;
}

const esHost = isMockMode() ? 'localhost' : '10.1.70.47';

var elasticClient = new elasticsearch.Client({
  host: `${esHost}:9200`
  //log: 'trace'
  // selector: function (hosts) {
  // }
});

elasticClient.cluster.health({}, function(err, resp, status) {
  console.log("Elastic Health: ", resp);
})

class Camera {

  constructor() {
    this.cars = 0;
    this.bikes = 0;
    this.motorcycles = 0;
  }

}

export const resolvers = {

  Query: {

    camera: (_, args, context) => {

      let _daysBefore = 1;
      let from = `now-${_daysBefore}d/d`;

      let requestBody = esb.requestBodySearch()
          .query(
              esb.boolQuery()
                  .must(esb.rangeQuery('event_time')
                          .gte(from)
                          .lte('now+1d/d')
                  )
                  .filter(esb.termQuery('rule_id', '203'))
          )
          .agg(esb.sumAggregation('user_terms', 'rule_id'));

      elasticClient.search({
        index: 'innovi',
        type: 'vcount',
        "size": 0, // omit hits from putput
        body: requestBody.toJSON()
      }).then( response => {
      });

      return new Camera();
    },

  },

}
