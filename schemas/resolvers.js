import casual from 'casual';
if( !isMockMode() )
   var Kafka = require('no-kafka');
import elasticsearch from 'elasticsearch';
import esb from 'elastic-builder';

import { PubSub } from 'graphql-subscriptions';

function isMockMode(): boolean {

  let mockToken = process.argv.find( (arg: string) => {
    return arg == "--mock"
  });

  return mockToken;
}

const pubsub = new PubSub();
const NEW_OBSERVATION_TOPIC = 'newObservation';

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

  constructor(cameraId: integer) {
    this.id = casual.uuid;
    this.cameraId = cameraId;

    this.observation = new Observation(0, 0, 0, new Date());

  }

}

class Observation {

  constructor(cars: integer,
              bikes: integer,
              motorcycles: integer,
              when: Date) {
    this.id = casual.uuid;
    this.cars = cars;
    this.bikes = bikes;
    this.motorcyrcles = motorcycles;
    this.when_observed = when;
  }

}

export const resolvers = {

  Query: {

    camera: (_, args, context) => {

      let cameraId = args.Id;
      let beforeHours = args.beforeHours;

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

      return elasticClient.search({
        index: 'innovi',
        type: 'vcount',
        "size": 0, // omit hits from putput
        body: requestBody.toJSON()
      }).then( response => {
        return new Camera(cameraId);
      });

    },

  },

  Subscription: {

    // Subscriptions resolvers are not a functions,
    // but an objects with subscribe method, than returns AsyncIterable.

    newObservtion: {
      subscribe: () => {

        console.log('Subscribed to observations');

        if( isMockMode() && mockTraceTimerId == null ) {

          mockTraceTimerId = setInterval( () => {

            const newObservation = new Observation(casual.integer(0, 5),
                                                   casual.integer(0, 5),
                                                   casual.integer(0, 5),
                                                   new Date()
                                                  );

            return pubsub.publish(NEW_OBSERVATION_TOPIC,
            {
              newObservtion: newObservation
            });

          }, 2000);

        } else {
            return pubsub.asyncIterator(NEW_OBSERVATION_TOPIC);
        }

      }
    }

  }

}

let mockTraceTimerId = null;
