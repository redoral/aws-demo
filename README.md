# AWS Demo

Simple documentation for the AWS Serverless API that I use to demo for interviews. Includes the lambda code, see `lambda.js`. For usage and response formats, see below.

### Services

- AWS Lambda
- AWS API Gateway
- AWS DynamoDB

## Usage

The API is a simple RESTful products API with complete CRUD. The available endpoints and methods are:

- `GET` on `/products` will return all of the entries in the products table.
- `POST` on `/products` will insert a new product into the products table; requires the following body:

```json
{
    "productId": string, // ex: "0"
    "productName": string, // ex: "Shirt"
    "productCategory": string, // ex: "Clothing"
    "productPrice": string // ex: "5.99"
}
```

DynamoDB takes values in strings, that's why everything is a string. The types are defined after this request body is received and before it is put in the table.

- `GET` on `/products/{productId}` returns a product that matches the given ID, where **{productId}** is a numerical value.
- `PATCH` on `/products/{productId}` updates an existing product in the products table based on the given ID in the URI and with the given values in the body; requires the following body:

```json
{
  "updateKey": string, // ex: "productPrice"
  "updateValue": {type: string} // ex: {"N": "59.99"}
}
```

- `DELETE` on `/products/{productId}` deletes an existing product in the table based on the given ID in the URI.
- `GET` on `/products/categories/{categoryName}` returns all available products under the specified category name.

## Successful Responses

The response format and status codes depends on the request method. Here you can see response data format and samples for each available method.

- Successful `GET` requests will respond with a `200 OK` and in the following format:

```json
{
  "data": [
    {
      "productCategory": {
        "S": "Clothing"
      },
      "productPrice": {
        "N": "30"
      },
      "productName": {
        "S": "Shorts"
      }
    },
    {
      "productCategory": {
        "S": "Clothing"
      },
      "productPrice": {
        "N": "50"
      },
      "productName": {
        "S": "Shirt"
      }
    }
  ]
}
```

- Successful `POST` requests will respond with a `201 Created` and include the new product's ID in the response body and location in the response header.

```json
{
  "data": {
    "productId": 1
  }
}
```

- Successful `DELETE` and `PATCH` requests will respond with a `204 No Content`, which means there will be no response body.

## Error Responses

In the event of an error, the API returns with a `5xx` or `4xx` depending on the error and the error message in the following format:

```json
{
  "message": "Error message."
}
```

AWS returns errors this way so I formatted DynamoDB exceptions this way as well to be consistent.
