[![Akera Logo](http://akera.io/logo.png)](http://akera.io/)

  REST API module for Akera.io web service - call any business logic procedure through this REST interface.

## Installation

```bash
$ npm install akera-rest-api
```

## Docs

  * [Website and Documentation](http://akera.io/)

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
  
  The interface can then be used to call business logic procedures on the broker by making 
  HTTP `POST` requests to `http://[host]/[broker]/rest-api/` and send call information using 
  the `call` request parameter as a JSON object with following structure - wrapping it all in a `call` object is optional:

	- `procedure`: the business logic procedure name
	- `parameters`: array of optional procedure parameters, must match the procedure parameters else an error will be thrown back. 
		Each parameter entry has the following structure:
		- `dataType`: parameter data type
			- valid values: `character`, `date`, `datetime`, `dataset`, `decimal`, `integer`, `int64`, `logical`, `longchar`, `memptr`, `table`
			- defaults to `character`
		- `type`: parameter type/direction
			- valid values: `input` | `i`, `input-output` | `inout` | `io`, `output` | `out` | `o`
			- defaults to `input`
		- `value`: parameter value for input/input-output parameters
		- `json`: for output/input-output parameters of type character/longchar.
			If set to true the value is sent as a JSON object instead of encoding it as a string. 
			Dataset and table parameters are always sent as JSON objects.
  
  The request must have the `Content-Type` header value set to `application/json` in order to be 
  correctly interpreted by the REST service handler.
  
  Only procedures available in akera.io application server `WEBPATH` can be executed - not everything from agent's `PROPATH` is
  available through the REST API interface.
  
  All Progress primitive data types are supported as input/output/input-output parameters, for output complex data types like
  `table` and `dataset` are also supported.
  	
```json
	{ "call": {
			"procedure": "crm/getCustomerBalance.p",
			"parameters": [
				{
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
	}
```

or 

```json
	{
		"procedure": "crm/getCustomerComplaints.p",
		"parameters": [
			{
				"value": 12 // customer number
			},
			{
				"type": "input-output",
				"dataType": "integer" // start record
			},
			{
				"type": "output",
				"dataType": "longchar",
				"json": true
			}
		]
	}
```
  
  The response is a JSON object with either a `parameters` array or an `error` object, 
  only output and input-output parameters are sent back in the `parameters` array keeping 
  the same order as in the input parameters array. 

## Change log
  As of version 1.0.8 the interface also support `GET` requests with `procedure` and `parameters` values passed through 
  the query string value, also on `POST` requests the `call` wrapper object is no longer mandatory - `procedure` and `parameters` 
  can be sent directly into the root JSON object.
  
  As of version 1.0.10 the interface also support `json` flag for output/input-output string parameters (characters/longchar). 

## License
	
MIT 
