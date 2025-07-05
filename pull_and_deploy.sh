echo "Get the latest version from GitHub."
git pull

echo "Kill all currently running servers."
npx pm2 kill

echo "Run the NestJS server in the deployment environment."
npm run start:prod

echo "Print the logs of the currently running servers."
npx pm2 logs
