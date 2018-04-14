import rp from 'request-promise';
import { GraphQLError } from 'graphql/error';
import casual from 'casual';
import moment from 'moment';
if( !isMockMode() )
   var Kafka = require('no-kafka');
import elasticsearch from 'elasticsearch';
import esb from 'elastic-builder';
import { PubSub } from 'graphql-subscriptions';
import rules from './dataModel';

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

class Serie {
  constructor(name: string,
              data: number[],
              ruleId: number) {
    this.id = casual.uuid;
    this.label = name;
    this.data = data;
    this.ruleId = ruleId;
  }

}

class Series {

  constructor(labels: string[],
              series: Serie[]) {

    this.id = casual.uuid;
    this.labels = labels;
    this.series = series;

  }

}

class Camera {

  constructor(cameraId: integer,
              cars: integer,
              bikes: integer,
              motorcycles: integer) {
    this.id = casual.uuid;
    this.cameraId = cameraId;

    this.observation = new Observation(cars, bikes, motorcycles, new Date());

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

class Device {
  constructor(name: string,
              cameraId: integer,
              x, y) {
    this.id = casual.uuid;
    this.name = name;
    this.cameraId = cameraId;
    this.lat = x;
    this.lng = y;
  }
}

export const resolvers = {

  Query: {

    camera: (_, args, context) => {

      let cameraId = args.cameraId;
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
          return new Camera(cameraId, 0, 0, 0);
      }).catch( error => {
          console.error(error.message);
          //return new GraphQLError(error.message);
          return new Camera(cameraId, 0, 0, 0);
      });

    },

    traffic: (_, args, context) => {

      const cameraId = args.cameraId;

      if( isMockMode() ) {

        let labels = [];
        for(let i = 0; i < args.beforeHours; i++) {
          var formattedHour = ("0" + i).slice(-2);
          labels.push(formattedHour + ":00");
        }

        let series = [];
        for(let i = 0; i < rules.length; i++) {
          let data = [];
          for(let i = 0; i < args.beforeHours; i++) {
            data.push(casual.integer(10,300));
          }
          series.push(new Serie(rules[i].name, data, rules[i].ruleId));
        }

        return new Series(labels, series);
      }
    },

    devices: (_, args, context) => {

      const url = 'https://api.tel-aviv.gov.il/gis/Layer?layerCode=863';

      return rp({
        uri: url,
        headers: {
          'User-Agent': 'GraphQL'
        },
        json: true
      }).then( (response) => {

        let devices = response.features.map( (device) => {

          return new Device(device.attributes.shem_matzlema,
                            device.attributes.id_mazlema,
                            device.geometry.x,
                            device.geometry.y);
        });

        return devices;

      })
    }

  },

  Mutation: {

    currentCamera: function(_, {cameraId}, context) {
      return cameraId;
    }

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

          }, 4000);

        } else {
            return pubsub.asyncIterator(NEW_OBSERVATION_TOPIC);
        }

      }
    }

  }

}

let mockTraceTimerId = null;
