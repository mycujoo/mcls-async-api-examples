#!/bin/sh
env=$1

gcloud functions deploy webhook-example-${env} \
    --source=. \
    --entry-point=webhook \
    --trigger-http \
    --runtime=nodejs14 \
    --allow-unauthenticated \
    --memory=256M \
    --timeout=540s \
    --region=europe-west3 \
    --set-env-vars=ENV=${env},GCLOUD_PROJECT="$(gcloud config list --format 'value(core.project)')"


function_url=$(gcloud functions describe webhook-example-${env} --region europe-west3 --format json | jq -r '.httpsTrigger.url')

if [ $? = 0 ]; then
    echo "Deployed function webhook-example-${env} to ${function_url}"
else
    echo "Deployment failed"
fi