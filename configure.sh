if [ ! -f ".env" ]; then
  echo ".env file does not exist in the project root directory."
  echo "Please make sure that both .env and firebase-service-account.json files are prepared in advance."
  exit 1
fi

if [ ! -d "database" ]; then
  echo "database directory does not exist in the project root directory."
  echo "Please make sure that the database directory is prepared in advance."
  exit 1
fi

if [ ! -f "src/config/firebase-service-account.json" ]; then
  echo "firebase-service-account.json file does not exist in the src/config/ directory."
  echo "Please make sure that both .env and firebase-service-account.json files are prepared in advance."
  exit 1
fi

echo "All required files are present."

echo "Installing required packages..."
npm i

echo "Running the NestJS server in the deployment environment..."
npm run start:prod

echo "Displaying logs of the currently running servers..."
npx pm2 logs
