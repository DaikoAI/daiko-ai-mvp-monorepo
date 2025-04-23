import { testPushNotification } from "../src/utils/push-notifications";

async function main() {
  await testPushNotification("04b0ba3b-4daf-4f81-9948-7c8ec1a1c5ea");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
