#!/bin/sh

rm accountapi.zip
zip -r accountapi.zip config src package.json tsconfig.json
scp -i "~/Exchangedatasets/credential/exchangedataset-accountapi.pem" accountapi.zip ec2-user@ec2-3-21-140-158.us-east-2.compute.amazonaws.com:~/
ssh -i "~/Exchangedatasets/credential/exchangedataset-accountapi.pem" ec2-user@ec2-3-21-140-158.us-east-2.compute.amazonaws.com "cd /var/ && (sudo rm -r www || true) && sudo mkdir www && cd www && sudo unzip ~/accountapi.zip && sudo su - -c \"cd /var/www/ && npm install && npm run-script build\" && sudo chmod +x build/app.js"
