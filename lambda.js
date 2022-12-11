/**
 * A small AWS Demo application for my Commerce Architects interview
 * @author Red Oral
 */
import {
  DynamoDBClient,
  ScanCommand,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  QueryCommand
} from '@aws-sdk/client-dynamodb';

/* Resource Paths */
const productsPath = '/products';
const productIdPath = '/products/{productId}';
const categoriesNamePath = '/products/categories/{categoryName}';

/* Event handler */
export const handler = async (event) => {
  const eventBody = JSON.parse(event.body);

  switch (true) {
    case event.resource === productsPath && event.httpMethod === 'GET':
      return await getAllProducts();
    case event.resource === productsPath && event.httpMethod === 'POST':
      return await createProduct(eventBody);
    case event.resource === productIdPath && event.httpMethod === 'GET':
      return await getProductById(event.pathParameters.productId);
    case event.resource === productIdPath && event.httpMethod === 'PATCH':
      return await updateProductById(
        event.pathParameters.productId,
        eventBody.updateKey,
        eventBody.updateValue
      );
    case event.resource === productIdPath && event.httpMethod === 'DELETE':
      return await deleteProductById(event.pathParameters.productId);
    case event.resource === categoriesNamePath && event.httpMethod === 'GET':
      return await getProductsByCategory(event.pathParameters.categoryName);
    default:
      return errorResponseBuilder(404, 'Resource not found.');
  }
};

/* Initialize DynamoDB client */
const dbClient = new DynamoDBClient();

/**
 * getAllProducts - Gets all entries in the products table
 * @returns A response object with a 200 status code and an array of all of the products or an error message
 */
const getAllProducts = async () => {
  const params = {
    TableName: process.env.PRODUCTS_TABLE,
    ProjectionExpression: 'productName, productCategory, productPrice'
  };

  try {
    const data = await dbClient.send(new ScanCommand(params));
    return responseBuilder(200, data.Items, productsPath);
  } catch (e) {
    return errorResponseBuilder(500, e.message);
  }
};

/**
 * createProduct - Inserts a new product into the product table
 * @param product - The product object to be inserted
 *
 * @returns - A response object with a 201 status code and location header or an error message
 */
const createProduct = async (product) => {
  const params = {
    TableName: process.env.PRODUCTS_TABLE,
    Item: {
      productId: { N: product.productId },
      productName: { S: product.productName },
      productCategory: { S: product.productCategory },
      productPrice: { N: product.productPrice }
    }
  };

  try {
    await dbClient.send(new PutItemCommand(params));
    return responseBuilder(
      201,
      { productId: product.productId },
      `${productsPath}/${product.productId}`
    );
  } catch (e) {
    return errorResponseBuilder(500, e.message);
  }
};

/**
 *  getProductById - Gets a single product based on the ID from the products table
 *  @param id - The productId used to find the item
 *
 *  @returns A response object with a 200 status code and the product data or an error message
 */
const getProductById = async (id) => {
  const params = {
    TableName: process.env.PRODUCTS_TABLE,
    Key: {
      productId: { N: id }
    },
    ProjectionExpression: 'productName, productCategory, productPrice'
  };

  try {
    const data = await dbClient.send(new GetItemCommand(params));
    return responseBuilder(200, data.Item, `${productsPath}/${id}`);
  } catch (e) {
    return errorResponseBuilder(500, e.message);
  }
};

/**
 * updateProductById - Updates the products name and/or category based on the given request body
 * @param id - productId of the product to update
 * @param updateKey - The key to update in the table
 * @param updateValue - The value to update in the table
 *
 * @returns - A response object with a 204 status code or an error message
 */
const updateProductById = async (id, updateKey, updateValue) => {
  const params = {
    TableName: process.env.PRODUCTS_TABLE,
    Key: {
      productId: { N: id }
    },
    UpdateExpression: `set ${updateKey} = :v`,
    ExpressionAttributeValues: {
      ':v': updateValue
    }
  };

  try {
    await dbClient.send(new UpdateItemCommand(params));
    return responseBuilder(204, null, `${productsPath}/${id}`);
  } catch (e) {
    return errorResponseBuilder(500, e.message);
  }
};

/**
 * deleteProductById - Deletes a product from the products table based on the given ID
 * @param id - productId of the product to delete
 *
 * @returns - A response object with a 204 status code or an error message
 */
const deleteProductById = async (id) => {
  const params = {
    TableName: process.env.PRODUCTS_TABLE,
    Key: {
      productId: { N: id }
    }
  };

  try {
    await dbClient.send(new DeleteItemCommand(params));
    return responseBuilder(204, null, `${productsPath}/${id}`);
  } catch (e) {
    return errorResponseBuilder(500, e.message);
  }
};

/**
 * getProductsByCategory - Gets all products under the same category name
 * @param category - The category to filter out products with
 *
 * @returns - A response object with 200 status code and array of products or an error message
 */
const getProductsByCategory = async (category) => {
  const params = {
    TableName: process.env.PRODUCTS_TABLE,
    IndexName: 'productCategory-index',
    KeyConditionExpression: 'productCategory = :c',
    ExpressionAttributeValues: {
      ':c': { S: category }
    }
  };

  try {
    const data = await dbClient.send(new QueryCommand(params));
    return responseBuilder(200, data.Items, `/categories/${category}`);
  } catch (e) {
    return errorResponseBuilder(500, e.message);
  }
};

/**
 * responseBuilder - Function to build HTTP response object
 * @param status - HTTP status code of the response
 * @param data - data from the db
 * @param location - Location of the resource, mainly important for POST
 *
 * @returns A response object
 */
const responseBuilder = async (status, data, location) => {
  return {
    statusCode: status,
    headers: {
      Location: location,
      'Access-Control-Allow-Headers':
        'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE'
    },
    body: JSON.stringify({
      data: data
    })
  };
};

/**
 * errorResponseBuilder - Function to build HTTP response object on exceptions
 * @param status - HTTP status code of the response
 * @param message - The exception error message
 *
 * @returns A response object
 */
const errorResponseBuilder = async (status, message) => {
  return {
    statusCode: status,
    headers: {
      'Access-Control-Allow-Headers':
        'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE'
    },
    body: JSON.stringify({
      message: message
    })
  };
};
