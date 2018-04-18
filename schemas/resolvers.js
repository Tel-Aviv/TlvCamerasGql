// @flow
import DataLoader from 'dataloader';
import rp from 'request-promise';
import { GraphQLError } from 'graphql/error';
import casual from 'casual';
import moment from 'moment';
//if( !isMockMode() )
   var Kafka = require('no-kafka');
import elasticsearch from 'elasticsearch';
import esb from 'elastic-builder';
import { PubSub, withFilter } from 'graphql-subscriptions';
import rules from './dataModel';
import cameraAliases from './cameraAliases';

function isMockMode(): boolean {

  let mockToken = process.argv.find( (arg: string) => {
    return arg == "--mock"
  });

  return mockToken;
}

const pubsub = new PubSub();
const NEW_OBSERVATION_TOPIC = 'newObservation';

const myBatchGetDevices = () => {
  console.log('get Devices');
}

const devicesLoader = new DataLoader(keys => myBatchGetDevices(keys));

class CamerasMap {

  static getCameraRules(cameraId: integer) {

     switch( cameraId ) {

       case 73: {
         return ['216', '217', '218', '219', '215', '214'];
       }

       case 72: {
         return ['211', '210', '209'];
       }

       case 71: {
         return ['203','204','205']
       }

       case 23: {
         return ['154', '155']
       }

       case 51: {
         return ['161', '162', '206']
       }

     }
   }

   static translate(cameraId: integer,
                    ruleId: integer) {

     let cars = 0;
     let motorcycles = 0;
     let bikes = 0;
     let pedestrians = 0;

     switch( cameraId ) {

       case 73: {

         switch( ruleId ) {

           case 216:
           case 217: {
             motorcycles = 1;
           }
           break;

           case 218:
           case 219: {
             bikes = 1;
           }
           break;

           case 215:
           case 214: {
             cars = 1;
           }
           break;
         }
       }
       break;

       case 72: {
         switch( ruleId ) {
           case 211: {
             bikes = 1;
           }
           break;

           case 210: {
             cars = 1;
           }
           break;

           case 209: {
             motorcycles = 1;
           }
           break;
         }
       }
       break;

       case 71: {
         switch( ruleId  ) {
             case 203: {
               cars = 1;
             }
             break;

             case 204: {
               bikes = 1;
             }
             break;

             case 205: {
               motorcycles = 1;
             }
             break;
         }
       }
       break;

       case 23: {
         switch( ruleId ) {
             case 155: {
               pedestrians = 1;
             }
             break;

             case 154: {
               bikes = 1;
             }
             break;
         }
       }
       break;

       case 51: {
         switch ( ruleId ) {
           case 161:
             pedestrians = 1;
             break;

           case 162:
             bikes = 1;
             break;

           case 206:
             cars = 1;
             break;

         }
       }

       default:
         return null;
     }
   }
}

if( !isMockMode() ) {

  var consumer = new Kafka.SimpleConsumer({
    connectionString: "10.1.70.101:9092",
    asyncCompression: true
  })

  var dataHandler = function(messageSet, topic, partition){

    messageSet.forEach(function (m){

        const message = m.message.value.toString('utf-8');
        var trace = JSON.parse(message);

        let observation = CamerasMap.translate(parseInt(trace.source_id, 10),
                                               parseInt(trace.rule_id, 10));

        if( observation ) {
          pubsub.publish(NEW_OBSERVATION_TOPIC,
            {
              newObservation: observation
            });
        }

    });

  }

  consumer.init().then( function() {
    return consumer.subscribe('anovi', 0,
                              dataHandler);
  })

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

  constructor(cameraId: number,
              cars: number,
              bikes: number,
              motorcycles: number,
              pedestrians: number) {
    this.id = casual.uuid;
    this.cameraId = cameraId;

    this.observation = new Observation(cameraId,
                                       cars,
                                       bikes,
                                       motorcycles,
                                       pedestrians,
                                       new Date());

  }

}

class Observation {

  // id: number;
  // cameraId: number;
  // cars: number;
  // bikes: number;
  // motorcycles: number;
  // pedestrians: number;
  // when_observed: Date;

  constructor(cameraId: number,
              cars: number,
              bikes: number,
              motorcycles: number,
              pedestrians: number,
              when: Date) {
    this.id = casual.uuid;
    this.cameraId = cameraId;
    this.cars = cars;
    this.bikes = bikes;
    this.motorcycles = motorcycles;
    this.pedestrians = pedestrians;
    this.when_observed = when;
  }

}

class Device {

  // id: number;
  // name: string;
  // cameraId: number;
  // streamUrl: string;
  // lat: number;
  // lng: number;

  constructor(name: string,
              cameraId: number,
              streamUrl: string,
              x: number,
              y: number) {
    this.id = casual.uuid;
    this.name = name;
    this.cameraId = cameraId;
    this.streamUrl = streamUrl;
    this.lat = x;
    this.lng = y;
  }
}

class Devices {
  constructor(devices: []) {
    this.id = casual.uuid;
    this.list = devices;
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
        "size": 0, // omit hits from output
        body: requestBody.toJSON()
      }).then( response => {
          return new Camera(cameraId, 0, 0, 0, 0, new Date());
      }).catch( error => {
          console.error(error.message);
          //return new GraphQLError(error.message);
          return new Camera(cameraId, 0, 0, 0, 0, new Date());
      });

    },

    traffic: (_, args, context) => {

      const cameraId = args.cameraId;
      const beforeHours = args.beforeHours;
      const rules_ids = CamerasMap.getCameraRules(cameraId);

      let labels = [];
      for(let i = 0; i < beforeHours; i++) {
        var formattedHour = ("0" + i).slice(-2);
        labels.push(formattedHour + ":00");
      }

      if( isMockMode() ) {

        let series = [];
        for(let i = 0; i < rules.length; i++) {
          let data = [];
          for(let i = 0; i < beforeHours; i++) {
            data.push(casual.integer(10,300));
          }
          series.push(new Serie(rules[i].name, data, rules[i].ruleId));
        }

        return new Series(labels, series);

      } else {

        let from = `now-${beforeHours}h/h`;

        let histogramAgg = esb.dateHistogramAggregation('distribution', 'event_time', 'hour')
                                 .order('_key', "desc");
        rules_ids.map( ruleId => {
          histogramAgg.agg(
            esb.filterAggregation(ruleId.toString(), esb.termQuery('rule_id', ruleId) )
            .agg(
                esb.termsAggregation('event_name', "event_name.keyword")
            )
          )
        });

        let requestBody = esb.requestBodySearch()
        .query(
          esb.boolQuery()
              .must(esb.rangeQuery('event_time')
                      .gte(from)
                      .lte('now+1d/d')
              )
              .filter(
                  esb.termsQuery('rule_id', rules_ids)
              )
        )
        .agg(histogramAgg);

          return elasticClient.search({
            index: 'innovi',
            type: 'vcount',
            "size": 0, // omit hits from output
            body: requestBody.toJSON()
          }).then( response => {

            let series = [];

            // response.aggregations.distribution.buckets.forEach( (bucket, index)=> {
            //
            //     data.push(bucket[index].doc_count);
            //
            //     series.push(new Serie(bucket[index].key_as_string,
            //                           data,
            //                           servicesIds[i]));
            //
            // });

            return new Series(labels, series);

          }).catch( error => {

              console.error(error.message);

          });
        }

    },

    devices: (_, args, context) => {

      const values = Object.values(cameraAliases);

      const url = 'https://api.tel-aviv.gov.il/gis/Layer?layerCode=863';

      return rp({
        uri: url,
        headers: {
          'User-Agent': 'GraphQL'
        },
        json: true
      }).then( (response) => {

        return new Devices(

          response.features.reduce( (finalList, device) => {

              // Field device.sw_analytika does exists
              // on returned features, but seems not used.
              // Instead, we maintain our own list on the analytic cameras.
              const aliasCamera= cameraAliases[device.attributes.id_mazlema];
              if( aliasCamera ) {
                const aliasCameraId = aliasCamera.alias;
                const streamUrl = cameraAliases[device.attributes.id_mazlema].url;
                let _device = new Device(device.attributes.shem_matzlema,
                                        aliasCameraId,
                                        streamUrl,
                                        device.geometry.y,
                                        device.geometry.x);

                finalList.push(_device);
              }

              return finalList;

          }, [])
        );

      }).catch(error => {
        console.error(error);
      })
    }

  },

  Subscription: {

    // Subscriptions resolvers are not a functions,
    // but an objects with subscribe method, than returns AsyncIterable.

    newObservation: {
      // resolve: (payload) => {
      //   return payload;
      // },
      subscribe: withFilter(
        () => {
          if( isMockMode() && mockTraceTimerId == null ) {

            let analyticsCameras = [];
            for(var key in cameraAliases) {
              if( cameraAliases.hasOwnProperty(key) )
                analyticsCameras.push(cameraAliases[key].alias);
            }

            mockTraceTimerId = setInterval( () => {

                  let cameraId = casual.random_element(analyticsCameras);

                  const observation = new Observation(cameraId,
                                                       casual.integer(0, 5),
                                                       casual.integer(0, 5),
                                                       casual.integer(0, 5),
                                                       casual.integer(0, 5), // pedestrians
                                                       new Date()
                                                        );
                  return pubsub.publish(NEW_OBSERVATION_TOPIC,
                  {
                    newObservation: observation
                  });

            }, 1000);

          }

          return pubsub.asyncIterator(NEW_OBSERVATION_TOPIC);

        },
        (payload, variables) => {
          if( payload.newObservation.cameraId == variables.cameraId ) {
            console.log(`${payload.newObservation.when_observed} Filtered on cameraId: ${variables.cameraId}`);
            return true;
          } else {
            return false;
          }
        }
      )

    }

  }

}

let mockTraceTimerId = null;
