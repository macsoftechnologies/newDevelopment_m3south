import { config } from "config";

export const environment = {
  production: true,
  apiURL: config.apiUrl,
  //API_URL: 'http://macsof.in/beamapi/services/',
  //API_URL: 'https://safesiteworksbeam.online/beamapi/services/',
  // API_URL: "https://beam.safesiteworks.com/beamapitest/services/",
  // API_URL: "https://beam.safesiteworks.com/beamapi/services/",
  // API_URL: 'http://macsof.in/beam_api_new/beamapi/services/',
  API_URL: 'https://beam.safesiteworks.com/development/m3south/beamapi/services/',

};