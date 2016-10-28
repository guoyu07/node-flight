let request = require('request');
let async = require('async');
let _ = require('lodash');

const createSessionUri = 'http://partners.api.skyscanner.net/apiservices/pricing/v1.0';
const testApiKey = 'prtl6749387986743898559646983194';
const ownApiKey = 'sh883743621605679531697104065192';

let flight = {
  rootPath: 'flight',
  actions: {}
};

flight.actions = {
  health: {
    path: 'health',
    method: 'GET',
    executors: [function(req, res) {
      res.json({ ping: 'pong'});
    }]
  },

  fetch: {
    path: 'fetch',
    method: 'post',
    executors: [function(req, res) {
      console.log(_.now(), 'fetch begin');

      async.waterfall([function(callback) {

        // Request Create Session
        request({
          uri: createSessionUri,
          method: 'post',
          headers: { 
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          form: req.body
        }, function(error, response) {
          console.log(_.now(), 'create session end');
          callback(error, response);
        });
      }, function(response,  callback) {
        if (response.statusCode >= 299) {
          callback(`status_code ${response.statusCode}`);
          return;
        }

        let getListUrl = `${response.headers.location}?apiKey=${testApiKey}&pagesize=20&pageindex=0`;
        console.log(getListUrl);
        // request get booking list
        request({
          uri: getListUrl,
          method: 'get',
          json: true
        }, function(error, response, body) {
          console.log(_.now(), `get list detail end. status_code: ${response.statusCode}, error:${error}`);
          if (error) {
            callback({
              code: 500,
              error: error
            });
            return;
          }

          if (response.statusCode > 299) {
            callback({
              code: response.statusCode,
              error: 'API error'
            });
            return;
          }

          callback(null, body);
        });
      }, function(body, callback) {
        let itineraries = body.Itineraries;
        let legs = body.Legs;
        let segments = body.Segments;
        let carriers = body.Carriers;
        let agents = body.Agents;
        let places = body.Places;

        segments = _.map(segments, (segment) => {
          segment.OriginStation = _.find(places, ['Id', segment.OriginStation]);
          segment.DestinationStation = _.find(places, ['Id', segment.DestinationStation]);
          segment.Carrier = _.find(carriers, ['Id', segment.Carrier]);
          segment.OperatingCarrier = _.find(carriers, ['Id', segment.OperatingCarrier]);
          return segment;
        });

        legs = _.map(legs, (leg) => {
          leg.SegmentIds = _.map(leg.SegmentIds, (segment) => {
            return _.find(segments, ['Id', segment]);
          });

          leg.OriginStation = _.find(places, ['Id', leg.OriginStation]);
          leg.DestinationStation = _.find(places, ['Id', leg.DestinationStation]);
          leg.Carriers = _.map(leg.Carriers, (carrier) => {
            return _.find(carriers, ['Id', carrier]);
          });
          leg.OperatingCarriers = _.map(leg.OperatingCarriers, (carrier) => {
            return _.find(carriers, ['Id', carrier]);
          });

          leg.FlightNumbers = _.map(leg.FlightNumbers, (flightNumber) => {
            let carrier = _.find(carriers, ['Id', flightNumber.CarrierId]);
            return {
              FlightNumber: flightNumber.FlightNumber,
              CarrierId: carrier,
              DisplayFlightNumber: carrier.DisplayCode + flightNumber.FlightNumber
            }
          });
          return leg;
        });

        let data = [];
        itineraries.forEach((element) => {
          let OutboundLeg = _.find(legs, ['Id', element.OutboundLegId]);
          let InboundLeg = _.find(legs, ['Id', element.InboundLegId]);
          let pricingOptions = element.PricingOptions;
          let priceOptions = _.map(element.PricingOptions, (priceOption) => {
            priceOption.Agents = _.map(priceOption.Agents, (agent) => {
              return _.find(agents, ['Id', agent]);
            });
            return priceOption;
          });
  
          data.push({
            OutboundLeg: OutboundLeg,
            InboundLeg: InboundLeg,
            PricingOptions: pricingOptions,
            BookingDetailsLink: element.BookingDetailsLink
          });
        });

        callback(null, { code: 200, data: data });
      }], function(error, result) {
        console.log(_.now(), 'handle end');
        if (error) {
          res.json({ error: error });
        } else {
          res.json(result);
        }
      });
    }]
  }
};

module.exports = flight;
