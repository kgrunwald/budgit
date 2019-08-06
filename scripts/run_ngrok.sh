#/bin/bash

ngrok http 3000 > /dev/null 2>&1 &

for i in {1..20}
do
    HOSTNAME=`curl --silent http://127.0.0.1:4040/api/tunnels | sed -nE 's/.*public_url":"https:..([^"]*).*/\1/p' 2> /dev/null`
    if [ ! -z "$HOSTNAME" ]; then
        export VUE_APP_PLAID_WEBHOOK_URL=https://${HOSTNAME}/api/webhook
        echo $VUE_APP_PLAID_WEBHOOK_URL
        break
    else 
        sleep 1
    fi
    
done
