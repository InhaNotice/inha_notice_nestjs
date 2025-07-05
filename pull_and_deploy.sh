echo "Getting the latest version from GitHub..."
git pull || { echo "Git pull failed. Deployment aborted."; exit 1; }

echo "Installing required packages..."
npm i

echo "Killing all currently running servers..."
npx pm2 kill

echo "Running the NestJS server in the deployment environment..."
npm run start:prod

echo "Displaying logs of the currently running servers..."
npx pm2 logs
