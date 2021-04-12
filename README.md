# MCLS Async API Example (Google Cloud)
--------------------------------

This example shows you how to use the MCLS Async API .

## Requirements

* MCLS account
* Google cloud account
* `App Engine default service account` need to have access to secret manager
* npm & NodeJS 14
* Secret manager API needs to be enabled: https://console.developers.google.com/apis/api/secretmanager.googleapis.com/overview

## Supported resources
Currently the following resources are supprorted by the MCLS Async API:

* Events (source=SOURCE_EVENT)
* Streams (source=SOURCE_STREAM)

We currently support the following integrations:

* Webhooks

## Testing webhooks

During this example, we will create an integration and a google cloud function that will be called by the integration.
In it's current form, all this function does is get the title and print it when a stream is modified by you or by the system.
But of course you could use this to update your database or execute any other action of your choice.

Create the secret holding the required information to talk to the API:

```sh
# Replace <your bearer token> with your organisation's bearer token
echo "{\"internal_auth_token\":\"$(openssl rand -hex 16)\", \"mcls_bearer_token\":\"<your bearer token>\"}" |  gcloud secrets create mcls-async-api-example --data-file=-
```

Should you not already have access to your bearer token, learn how to create one here:
https://mcls.mycujoo.tv/help-center/getting-started/quick-start-guides/getting-started-with-the-mcls-api

To view the secret you just created run:

```sh
gcloud secrets versions access latest --secret=mcls-async-api-example
```

Note down the internal_auth_token, we need it later.
Now run the first deployment (webhook example):

```
cd functions/webhook_example
npm i
./deploy.sh production
```

You'll see a line like this when your function was deployed correctly:

```sh
Deployed function webhook_example to https://europe-west3-your-project.cloudfunctions.net/webhook-example-production
```

Now it's time to test your webhook!

```sh
curl -XPOST -d '{"test":true}' -H 'content-type: application/json' -H 'Authorization: Bearer <internal secret>' https://europe-west3-mls-production.cloudfunctions.net/webhook-example-production

{"result":"{\"test\":true}","message":"Execution took 0.061 seconds"}
```

Now create the integration:

```sh
curl --request POST \
  --url https://mls-api.mycujoo.tv/integrations/v1beta1 \
  --header 'Authorization: <your token>' \
  --header 'Content-Type: application/json' \
  --data '{
  "source": "SOURCE_STREAM",
  "target": {
    "webhook": {
      "headers": {
        "authorization": "Bearer <your bearer token>"
      },
      "params": {
        "src": "mcls"
      },
      "url": "https://europe-west3-your-project.cloudfunctions.net/webhook-example-production"
    }
  }
}'
```

Note down the id of the integration, we'll use it later to delete the integration.

When you update a stream now, you'll see the following in your logs:

```
2021-04-09 14:39:18.024 GMT webhook-example-productiongr6updcq3s62 Function execution started
2021-04-09 14:39:18.764 GMT webhook-example-productiongr6updcq3s62 [production] Got data: {"id":"xxx","type":"stream"}
2021-04-09 14:39:18.991 GMT webhook-example-productiongr6updcq3s62 Stream test stream for webhooks has been updated!
2021-04-09 14:39:18.995 GMT webhook-example-productiongr6updcq3s62 Function execution took 971 ms, finished with status code: 200
```
Now whenever a stream is modified or changed either by you or the system, this function will be called.

## Cleanup
You can easily clean up the function by deleting it:

```sh
gcloud functions delete webhook-example-production --region europe-west3
```

Then clean up the integration you created:

```sh
curl --request DELETE \
  --url https://mls-api.mycujoo.tv/integrations/v1beta1/<integration id> \
  --header 'Authorization: Bearer <your bearer token>' \
```