[![Akera Logo](http://akera.io/logo.png)](http://akera.io/)

  REST API module for Akera.io web service - call any business logic procedure through this REST interface.

## Installation

```bash
$ npm install akera-rest-api
```

## Docs

  * [Website and Documentation](http://akera.io/)


## Tests

  To run the test suite, first install the dependencies, then run `npm test`:

```bash
$ npm install
$ npm test
```

## Quick Start

  This module is designed to only be loaded as broker level service which 
  is usually done by adding a reference to it in `services` section of 
  each broker's configuration in `akera-web.json` configuration file.
   
```json
  "brokers": [
  	{	"name": "demo",
  		"host": "localhost",
		"port": 3737,
		"services": [
			{ 
				"middleware": "akera-rest-api",
				"config": {
					"route": "/rest-api/"
				}
			}
		]
	}
  ]
```
  
  Service options available:
	- `route`: the route where the service is going to be mounted (default: '/rest/api/')
  
  The interface can then be used to call business logic procedures on the broker by making HTTP `POST` requests to `http://[host]/[broker]/rest-api/` and send call information using the `call` request parameter as a JSON object with following structure:

	- `procedure`: the business logic procedure name
	- `parameters`: array of optional procedure parameters, must match the procedure parameters else an error will be thrown back. Each parameter entry has the following structure:
		- `dataType`: parameter data type, defaults to `character`
		- `type`: parameter type/direction, valid values: `input`, `output`, `inout`, defaults to `input`
		- `value`: parameter value for input/input-output parameters
	
```json
	call = {
		"procedure": "crm/getCustomerBalance.p",
		"parameters": [
			{
				"dataType": "integer",
				"value": 12
			},
			{
				"type": "output",
				"dataType": "decimal"
			},
			{
				"type": "output",
				"dataType": "decimal"
			}
		]
	}
```
  
  The response is a JSON object with either a `parameters` array or an `error` object, only output and input-output parameters are sent back in the `parameters` array keeping the same order as in the input parameters array. 
## License
	
MIT 
