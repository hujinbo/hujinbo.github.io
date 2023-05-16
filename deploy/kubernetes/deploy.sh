#!/bin/bash

kubectl rollout restart deployment hujinbo -n blog
echo "Deployment restart initiated"
echo "Waiting for Deployment to complete rollout..."

while :
do
    status=$(kubectl rollout status deployment hujinbo -n blog 2>&1)
    if [[ $status == *"successfully rolled out"* ]]; then
        echo "Deployment rollout completed"
        break
    else
        echo "Deployment rollout in progress..."
        sleep 5
    fi
done
