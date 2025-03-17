// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `angular.json`.

import { config } from "config";

export const environment = {
  production: false,
  apiURL: config.apiUrl,
  // API_URL: 'http://macsof.in/beamapi/services/',
//API_URL: 'https://safesiteworksbeam.online/beamapi/services/',
// API_URL: "https://beam.safesiteworks.com/beamapitest/services/",
// API_URL: "https://beam.safesiteworks.com/beamapi/services/",
  // API_URL: 'http://macsof.in/beam_api_new/beamapi/services/',
    API_URL: 'https://beam.safesiteworks.com/development/m3south/beamapi/services/',

};
